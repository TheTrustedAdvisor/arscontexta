import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { extractTitle, parseFrontmatter, findNotesDir, findContentDirs } from './shared.js';
import { MAX_FILES, MAX_FILE_SIZE } from './path-guard.js';

type SearchScope = 'title' | 'content' | 'frontmatter' | 'all';

const MAX_RESULTS = 20;
const SNIPPET_RADIUS = 50;

interface NoteSearchOptions {
  query: string;
  vaultPath: string;
  scope: SearchScope;
}

interface SearchResult {
  filename: string;
  title: string;
  matchCount: number;
  snippets: string[];
}

function extractSnippet(text: string, index: number): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + SNIPPET_RADIUS);
  let snippet = text.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function countMatches(text: string, pattern: RegExp): { count: number; indices: number[] } {
  const indices: number[] = [];
  let match: RegExpExecArray | null;
  const MAX_MATCHES = 1000;
  while ((match = pattern.exec(text)) !== null && indices.length < MAX_MATCHES) {
    indices.push(match.index);
    if (match[0].length === 0) break;
  }
  return { count: indices.length, indices };
}

function searchInTitle(content: string, pattern: RegExp): { count: number; snippets: string[] } {
  const title = extractTitle(content);
  if (!title) return { count: 0, snippets: [] };
  const { count, indices } = countMatches(title, pattern);
  const snippets = indices.slice(0, 3).map(i => extractSnippet(title, i));
  return { count, snippets };
}

function searchInContent(content: string, pattern: RegExp): { count: number; snippets: string[] } {
  const body = stripFrontmatter(content);
  const { count, indices } = countMatches(body, pattern);
  const snippets = indices.slice(0, 3).map(i => extractSnippet(body, i));
  return { count, snippets };
}

function searchInFrontmatter(content: string, pattern: RegExp): { count: number; snippets: string[] } {
  const fields = parseFrontmatter(content);
  if (!fields) return { count: 0, snippets: [] };

  let totalCount = 0;
  const snippets: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    const { count, indices } = countMatches(value, pattern);
    totalCount += count;
    for (const i of indices.slice(0, 2)) {
      snippets.push(`[${key}] ${extractSnippet(value, i)}`);
    }
  }

  return { count: totalCount, snippets: snippets.slice(0, 3) };
}

export async function noteSearch(options: NoteSearchOptions): Promise<string> {
  const { query, vaultPath, scope } = options;

  if (!query.trim()) {
    return 'Search query cannot be empty.';
  }

  const contentDirs = await findContentDirs(vaultPath);
  if (contentDirs.length === 0) {
    const notesDir = await findNotesDir(vaultPath);
    if (!notesDir) return 'No notes directory found. Initialize a vault first.';
    contentDirs.push(notesDir);
  }

  const allFiles: { dir: string; file: string }[] = [];
  for (const dirName of contentDirs) {
    try {
      const entries = (await readdir(join(vaultPath, dirName))).filter(f => f.endsWith('.md'));
      for (const f of entries) allFiles.push({ dir: dirName, file: f });
    } catch { /* skip unreadable dirs */ }
  }
  const cappedFiles = allFiles.slice(0, MAX_FILES);

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escapedQuery, 'gi');

  const results: SearchResult[] = [];

  for (const { dir: dirName, file } of cappedFiles) {
    const filePath = join(vaultPath, dirName, file);
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
      if (content.length > MAX_FILE_SIZE) continue;
    } catch {
      continue;
    }

    let totalCount = 0;
    const allSnippets: string[] = [];

    if (scope === 'title' || scope === 'all') {
      const r = searchInTitle(content, new RegExp(escapedQuery, 'gi'));
      totalCount += r.count;
      allSnippets.push(...r.snippets);
    }

    if (scope === 'content' || scope === 'all') {
      const r = searchInContent(content, new RegExp(escapedQuery, 'gi'));
      totalCount += r.count;
      allSnippets.push(...r.snippets);
    }

    if (scope === 'frontmatter' || scope === 'all') {
      const r = searchInFrontmatter(content, new RegExp(escapedQuery, 'gi'));
      totalCount += r.count;
      allSnippets.push(...r.snippets);
    }

    if (totalCount > 0) {
      const title = extractTitle(content) || basename(file, '.md');
      results.push({
        filename: file,
        title,
        matchCount: totalCount,
        snippets: allSnippets.slice(0, 3),
      });
    }
  }

  if (results.length === 0) {
    return `No matches found for "${query}" (scope: ${scope}).`;
  }

  results.sort((a, b) => b.matchCount - a.matchCount);
  const capped = results.slice(0, MAX_RESULTS);

  const lines = [
    `Search results for "${query}" (scope: ${scope}, ${results.length} files matched):`,
    '',
  ];

  for (const r of capped) {
    lines.push(`${r.filename} — ${r.title} (${r.matchCount} match${r.matchCount > 1 ? 'es' : ''})`);
    for (const s of r.snippets) {
      lines.push(`  > ${s}`);
    }
    lines.push('');
  }

  if (results.length > MAX_RESULTS) {
    lines.push(`... and ${results.length - MAX_RESULTS} more files.`);
  }

  return lines.join('\n');
}
