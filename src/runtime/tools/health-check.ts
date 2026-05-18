import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { parseFrontmatter, extractTitle, findNotesDir, findContentDirs, MIN_DESCRIPTION_LENGTH } from './shared.js';
import { MAX_FILES } from './path-guard.js';

interface HealthCheckOptions {
  mode: 'quick' | 'full' | 'three-space';
  vaultPath: string;
}

interface DiagnosticResult {
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string[];
  count?: { total: number; issues: number };
}

async function loadMarkdownFiles(dirPath: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  try {
    const entries = await readdir(dirPath);
    const mdFiles = entries.filter(f => f.endsWith('.md')).slice(0, MAX_FILES);
    for (const f of mdFiles) {
      const content = await readFile(join(dirPath, f), 'utf-8');
      files.set(f, content);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  return files;
}

async function checkSchema(notes: Map<string, string>): Promise<DiagnosticResult> {
  const issues: string[] = [];
  for (const [file, content] of notes) {
    const fields = parseFrontmatter(content);
    if (!fields) {
      issues.push(`${file}: missing frontmatter`);
      continue;
    }
    const missing = ['description', 'type', 'created'].filter(f => !fields[f]);
    if (missing.length > 0) {
      issues.push(`${file}: missing ${missing.join(', ')}`);
    }
  }
  const rate = notes.size > 0 ? ((notes.size - issues.length) / notes.size) * 100 : 100;
  return {
    category: 'Schema Compliance',
    status: rate > 95 ? 'PASS' : rate > 80 ? 'WARN' : 'FAIL',
    details: issues.length > 0 ? issues : ['All notes have valid schema'],
    count: { total: notes.size, issues: issues.length },
  };
}

async function checkOrphans(notes: Map<string, string>, allNotes?: Map<string, string>): Promise<DiagnosticResult> {
  const linkSource = allNotes || notes;
  const allLinks = new Set<string>();
  for (const content of linkSource.values()) {
    const matches = content.match(/\[\[([^\]]+)\]\]/g);
    if (matches) matches.forEach(m => allLinks.add(m.slice(2, -2)));
  }

  const orphans: string[] = [];
  for (const [file, content] of notes) {
    const match = content.match(/^# (.+)$/m);
    const title = match ? match[1] : basename(file, '.md');
    if (!allLinks.has(title)) orphans.push(file);
  }

  const rate = notes.size > 0 ? (orphans.length / notes.size) * 100 : 0;
  return {
    category: 'Orphan Detection',
    status: rate < 5 ? 'PASS' : rate < 15 ? 'WARN' : 'FAIL',
    details: orphans.length > 0 ? orphans.map(f => `Orphan: ${f}`) : ['No orphan notes'],
    count: { total: notes.size, issues: orphans.length },
  };
}

async function checkLinks(notes: Map<string, string>): Promise<DiagnosticResult> {
  const existingTitles = new Set<string>();
  for (const [file, content] of notes) {
    const match = content.match(/^# (.+)$/m);
    existingTitles.add(match ? match[1] : basename(file, '.md'));
  }

  const dangling: string[] = [];
  let totalLinks = 0;
  for (const [file, content] of notes) {
    const matches = content.match(/\[\[([^\]]+)\]\]/g);
    if (!matches) continue;
    totalLinks += matches.length;
    for (const m of matches) {
      const target = m.slice(2, -2);
      if (!existingTitles.has(target)) {
        dangling.push(`${file}: [[${target}]]`);
      }
    }
  }

  const resolveRate = totalLinks > 0 ? ((totalLinks - dangling.length) / totalLinks) * 100 : 100;
  return {
    category: 'Link Health',
    status: resolveRate > 90 ? 'PASS' : resolveRate > 75 ? 'WARN' : 'FAIL',
    details: dangling.length > 0 ? dangling.slice(0, 20) : ['All links resolve'],
    count: { total: totalLinks, issues: dangling.length },
  };
}

async function checkDescriptions(notes: Map<string, string>): Promise<DiagnosticResult> {
  const issues: string[] = [];
  for (const [file, content] of notes) {
    const fields = parseFrontmatter(content);
    if (!fields?.description) continue;
    const title = extractTitle(content) || '';

    if (fields.description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push(`${file}: description too short (${fields.description.length} chars)`);
    } else if (fields.description === title) {
      issues.push(`${file}: description identical to title`);
    }
  }

  const rate = notes.size > 0 ? ((notes.size - issues.length) / notes.size) * 100 : 100;
  return {
    category: 'Description Quality',
    status: rate > 90 ? 'PASS' : rate > 70 ? 'WARN' : 'FAIL',
    details: issues.length > 0 ? issues : ['All descriptions meet quality threshold'],
    count: { total: notes.size, issues: issues.length },
  };
}

async function checkThreeSpace(vaultPath: string, notesDir: string): Promise<DiagnosticResult> {
  const issues: string[] = [];

  const opsFiles = await loadMarkdownFiles(join(vaultPath, 'ops'));
  for (const [file, content] of opsFiles) {
    const fields = parseFrontmatter(content);
    if (fields?.type && ['claim', 'pattern', 'fact'].includes(fields.type)) {
      issues.push(`ops/${file}: knowledge content (type: ${fields.type}) belongs in ${notesDir}/`);
    }
  }

  const noteFiles = await loadMarkdownFiles(join(vaultPath, notesDir));
  for (const [file] of noteFiles) {
    if (file.includes('session') || file.includes('queue') || file.includes('health')) {
      issues.push(`${notesDir}/${file}: operational content belongs in ops/`);
    }
  }

  return {
    category: 'Three-Space Boundaries',
    status: issues.length === 0 ? 'PASS' : issues.length < 3 ? 'WARN' : 'FAIL',
    details: issues.length > 0 ? issues : ['Content is correctly separated across spaces'],
    count: { total: opsFiles.size + noteFiles.size, issues: issues.length },
  };
}

export async function healthCheck(options: HealthCheckOptions): Promise<string> {
  const { mode, vaultPath } = options;
  const notesDir = await findNotesDir(vaultPath);

  if (!notesDir) {
    return 'No notes directory found. Initialize a vault first.';
  }

  const contentDirs = await findContentDirs(vaultPath);
  const allNotes = new Map<string, string>();
  for (const dir of contentDirs) {
    const dirNotes = await loadMarkdownFiles(join(vaultPath, dir));
    for (const [file, content] of dirNotes) {
      allNotes.set(`${dir}/${file}`, content);
    }
  }

  const primaryNotes = await loadMarkdownFiles(join(vaultPath, notesDir));

  const results: DiagnosticResult[] = [];

  if (mode === 'quick' || mode === 'full') {
    results.push(await checkSchema(primaryNotes));
    results.push(await checkOrphans(primaryNotes, allNotes));
    results.push(await checkLinks(allNotes));
  }

  if (mode === 'full') {
    results.push(await checkDescriptions(primaryNotes));
    results.push(await checkThreeSpace(vaultPath, notesDir));
  }

  if (mode === 'three-space') {
    results.push(await checkThreeSpace(vaultPath, notesDir));
  }

  const passCount = results.filter(r => r.status === 'PASS').length;
  const warnCount = results.filter(r => r.status === 'WARN').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  const lines = [
    `# Vault Health Report`,
    `Mode: ${mode} | PASS: ${passCount} | WARN: ${warnCount} | FAIL: ${failCount}`,
    '',
  ];

  for (const r of results) {
    lines.push(`## ${r.category} — ${r.status}`);
    if (r.count) lines.push(`(${r.count.issues}/${r.count.total} issues)`);
    for (const d of r.details.slice(0, 15)) {
      lines.push(`  ${d}`);
    }
    if (r.details.length > 15) {
      lines.push(`  ... and ${r.details.length - 15} more`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
