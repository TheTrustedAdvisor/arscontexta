import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { extractWikiLinks, extractTitle, parseFrontmatter, findNotesDir, findContentDirs } from './shared.js';
import { MAX_FILES, MAX_FILE_SIZE } from './path-guard.js';

interface GraphQueryOptions {
  query: 'orphans' | 'backlinks' | 'density' | 'stats' | 'traverse' | 'clusters' | 'suggestions';
  notePath?: string;
  vaultPath: string;
}

interface NoteInfo {
  path: string;
  title: string;
  outLinks: string[];
  type?: string;
}

async function loadNotes(vaultPath: string, notesDir: string): Promise<Map<string, NoteInfo>> {
  const notes = new Map<string, NoteInfo>();
  const dir = join(vaultPath, notesDir);

  let files: string[];
  try {
    files = (await readdir(dir)).filter(f => f.endsWith('.md')).slice(0, MAX_FILES);
  } catch {
    return notes;
  }

  for (const file of files) {
    const filePath = join(dir, file);
    const content = await readFile(filePath, 'utf-8');
    const title = extractTitle(content) || basename(file, '.md');
    const outLinks = extractWikiLinks(content);
    const fields = parseFrontmatter(content);
    notes.set(title, { path: filePath, title, outLinks, type: fields?.type });
  }

  return notes;
}

export async function graphQuery(options: GraphQueryOptions): Promise<string> {
  const { query, notePath, vaultPath } = options;
  const notesDir = await findNotesDir(vaultPath);

  if (!notesDir) {
    return 'No notes directory found. Initialize a vault first.';
  }

  const contentDirs = await findContentDirs(vaultPath);
  const notes = new Map<string, NoteInfo>();
  for (const dir of contentDirs) {
    const dirNotes = await loadNotes(vaultPath, dir);
    for (const [title, info] of dirNotes) {
      if (!notes.has(title)) notes.set(title, info);
    }
  }

  switch (query) {
    case 'orphans':
      return findOrphans(notes);
    case 'backlinks':
      return findBacklinks(notes, notePath);
    case 'density':
      return measureDensity(notes);
    case 'stats':
      return vaultStats(notes, contentDirs);
    case 'traverse':
      return traverseNote(notes, notePath);
    case 'clusters':
      return findClusters(notes);
    case 'suggestions':
      return suggestLinks(notes);
  }
}

function findOrphans(notes: Map<string, NoteInfo>): string {
  const allLinkedTitles = new Set<string>();
  for (const note of notes.values()) {
    for (const link of note.outLinks) {
      allLinkedTitles.add(link);
    }
  }

  const orphans: string[] = [];
  for (const [title, note] of notes) {
    if (!allLinkedTitles.has(title)) {
      orphans.push(`  - ${title} (${basename(note.path)})`);
    }
  }

  if (orphans.length === 0) {
    return 'No orphan notes found. All notes have at least one incoming link.';
  }

  const rate = ((orphans.length / notes.size) * 100).toFixed(1);
  return `Orphan notes (${orphans.length}/${notes.size}, ${rate}%):\n${orphans.join('\n')}`;
}

function findBacklinks(notes: Map<string, NoteInfo>, notePath?: string): string {
  if (!notePath) return 'Provide a note path for backlink analysis.';

  const targetTitle = basename(notePath, '.md');
  const backlinks: string[] = [];

  for (const [title, note] of notes) {
    if (note.outLinks.includes(targetTitle)) {
      backlinks.push(`  - [[${title}]]`);
    }
  }

  if (backlinks.length === 0) {
    return `No backlinks found for "${targetTitle}".`;
  }

  return `Backlinks to "${targetTitle}" (${backlinks.length}):\n${backlinks.join('\n')}`;
}

function measureDensity(notes: Map<string, NoteInfo>): string {
  if (notes.size === 0) return 'No notes to analyze.';

  const densities: { title: string; count: number }[] = [];
  let totalLinks = 0;

  for (const [title, note] of notes) {
    densities.push({ title, count: note.outLinks.length });
    totalLinks += note.outLinks.length;
  }

  densities.sort((a, b) => b.count - a.count);
  const avg = (totalLinks / notes.size).toFixed(1);

  const sparse = densities.filter(d => d.count < 2);
  const dense = densities.filter(d => d.count > 6);

  const lines = [
    `Link Density Report`,
    `  Average: ${avg} links/note (target: 2-4)`,
    `  Total links: ${totalLinks}`,
    `  Sparse (< 2 links): ${sparse.length} notes`,
    `  Dense (> 6 links): ${dense.length} notes`,
    '',
    'Top 10 most connected:',
  ];

  for (const d of densities.slice(0, 10)) {
    lines.push(`  ${d.count} links — ${d.title}`);
  }

  return lines.join('\n');
}

function vaultStats(notes: Map<string, NoteInfo>, contentDirs: string[]): string {
  let totalLinks = 0;
  let mocCount = 0;
  const allLinkedTitles = new Set<string>();

  for (const note of notes.values()) {
    totalLinks += note.outLinks.length;
    for (const link of note.outLinks) {
      allLinkedTitles.add(link);
    }
    if (note.type === 'moc') mocCount++;
  }

  const orphanCount = [...notes.keys()].filter(t => !allLinkedTitles.has(t)).length;
  const orphanRate = notes.size > 0 ? ((orphanCount / notes.size) * 100).toFixed(1) : '0';
  const avgDegree = notes.size > 0 ? (totalLinks / notes.size).toFixed(1) : '0';

  return [
    `Vault Statistics (${contentDirs.join(', ')})`,
    `  Notes: ${notes.size}`,
    `  Total links: ${totalLinks}`,
    `  Average degree: ${avgDegree}`,
    `  MOCs: ${mocCount}`,
    `  Orphan rate: ${orphanRate}%`,
    `  Unique link targets: ${allLinkedTitles.size}`,
  ].join('\n');
}

function traverseNote(notes: Map<string, NoteInfo>, notePath?: string): string {
  if (!notePath) return 'Provide a note path for traversal.';

  const targetTitle = basename(notePath, '.md');
  const targetNote = notes.get(targetTitle);

  if (!targetNote) return `Note "${targetTitle}" not found.`;

  const hop1 = new Set(targetNote.outLinks);
  const hop2 = new Set<string>();

  for (const link of hop1) {
    const linkedNote = notes.get(link);
    if (linkedNote) {
      for (const l2 of linkedNote.outLinks) {
        if (l2 !== targetTitle && !hop1.has(l2)) {
          hop2.add(l2);
        }
      }
    }
  }

  const lines = [
    `Neighborhood of "${targetTitle}" (2-hop):`,
    '',
    `Direct connections (${hop1.size}):`,
    ...[...hop1].map(l => `  → [[${l}]]`),
    '',
    `2-hop connections (${hop2.size}):`,
    ...[...hop2].map(l => `  →→ [[${l}]]`),
  ];

  return lines.join('\n');
}

function findClusters(notes: Map<string, NoteInfo>): string {
  if (notes.size === 0) return 'No notes to analyze.';

  // Build a map: link target → set of notes that link to it
  const targetToNotes = new Map<string, Set<string>>();
  for (const [title, note] of notes) {
    for (const link of note.outLinks) {
      let set = targetToNotes.get(link);
      if (!set) {
        set = new Set();
        targetToNotes.set(link, set);
      }
      set.add(title);
    }
  }

  // For each pair of notes, count shared link targets
  const pairShared = new Map<string, Set<string>>(); // "a|b" → shared targets

  for (const [target, linkers] of targetToNotes) {
    if (linkers.size < 2) continue;
    const arr = [...linkers];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = arr[i] < arr[j] ? `${arr[i]}|${arr[j]}` : `${arr[j]}|${arr[i]}`;
        let shared = pairShared.get(key);
        if (!shared) {
          shared = new Set();
          pairShared.set(key, shared);
        }
        shared.add(target);
      }
    }
  }

  // Build clusters via union-find on pairs sharing 2+ targets
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  }
  function union(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  const clusterTargets = new Map<string, Set<string>>(); // cluster root → all shared targets

  for (const [key, shared] of pairShared) {
    if (shared.size < 2) continue;
    const [a, b] = key.split('|');
    union(a, b);
  }

  // Group notes by cluster root
  const clusters = new Map<string, Set<string>>();
  for (const [key, shared] of pairShared) {
    if (shared.size < 2) continue;
    const [a, b] = key.split('|');
    const root = find(a);
    let members = clusters.get(root);
    if (!members) {
      members = new Set();
      clusters.set(root, members);
    }
    members.add(a);
    members.add(b);

    let targets = clusterTargets.get(root);
    if (!targets) {
      targets = new Set();
      clusterTargets.set(root, targets);
    }
    for (const t of shared) targets.add(t);
  }

  if (clusters.size === 0) {
    return 'No topical clusters found. Notes do not share enough common link targets.';
  }

  const lines = [`Topical Clusters (${clusters.size} found):`, ''];
  let idx = 1;
  for (const [root, members] of clusters) {
    const targets = clusterTargets.get(root) ?? new Set();
    lines.push(`Cluster ${idx} (${members.size} notes, ${targets.size} shared targets):`);
    lines.push(`  Shared targets:`);
    for (const t of targets) {
      lines.push(`    - [[${t}]]`);
    }
    lines.push(`  Members:`);
    for (const m of members) {
      lines.push(`    - ${m}`);
    }
    lines.push('');
    idx++;
  }

  return lines.join('\n').trimEnd();
}

function suggestLinks(notes: Map<string, NoteInfo>): string {
  if (notes.size < 2) return 'Not enough notes to suggest links.';

  const titles = [...notes.keys()];
  const linkSets = new Map<string, Set<string>>();
  for (const [title, note] of notes) {
    linkSets.set(title, new Set(note.outLinks));
  }

  // Build a set of existing direct links for quick lookup
  const existingLinks = new Set<string>();
  for (const [title, note] of notes) {
    for (const link of note.outLinks) {
      existingLinks.add(`${title}|${link}`);
    }
  }

  const suggestions: { a: string; b: string; score: number; common: string[] }[] = [];

  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      const a = titles[i];
      const b = titles[j];

      // Skip if already linked in either direction
      if (existingLinks.has(`${a}|${b}`) || existingLinks.has(`${b}|${a}`)) continue;

      const setA = linkSets.get(a)!;
      const setB = linkSets.get(b)!;

      // Jaccard similarity of outLinks
      const intersection: string[] = [];
      for (const link of setA) {
        if (setB.has(link)) intersection.push(link);
      }

      if (intersection.length === 0) continue;

      const unionSize = new Set([...setA, ...setB]).size;
      const score = intersection.length / unionSize;

      suggestions.push({ a, b, score, common: intersection });
    }
  }

  suggestions.sort((x, y) => y.score - x.score);
  const top = suggestions.slice(0, 10);

  if (top.length === 0) {
    return 'No link suggestions found. Notes have no overlapping neighbors.';
  }

  const lines = [`Suggested Links (top ${top.length} by Jaccard similarity):`, ''];
  for (const s of top) {
    lines.push(`  ${s.a}  ↔  ${s.b}  (score: ${s.score.toFixed(3)})`);
    lines.push(`    Common neighbors: ${s.common.map(c => `[[${c}]]`).join(', ')}`);
  }

  return lines.join('\n');
}
