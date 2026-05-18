import { readdir } from 'node:fs/promises';

export const MIN_DESCRIPTION_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 200;

export function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      fields[key] = value;
    }
  }
  return fields;
}

export function extractTitle(content: string): string | null {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1] : null;
}

export function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(2, -2));
}

const NOTES_DIR_CANDIDATES = ['notes', 'reflections', 'concepts', 'decisions', 'claims', 'ideas', 'memories'];

export async function findNotesDir(vaultPath: string): Promise<string | null> {
  try {
    const entries = await readdir(vaultPath, { withFileTypes: true });
    for (const candidate of NOTES_DIR_CANDIDATES) {
      if (entries.some(e => e.isDirectory() && e.name === candidate)) {
        return candidate;
      }
    }
  } catch { /* directory doesn't exist */ }
  return null;
}
