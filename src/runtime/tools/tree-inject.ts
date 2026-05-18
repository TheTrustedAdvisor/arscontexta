import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

interface TreeInjectOptions {
  vaultPath: string;
  depth: number;
}

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.omc', '.claude', '.github', '.copilot', 'dist',
]);

async function buildTree(dirPath: string, currentDepth: number, maxDepth: number): Promise<string[]> {
  if (currentDepth > maxDepth) return [];

  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  const indent = '  '.repeat(currentDepth);

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.') && currentDepth === 0) continue;

    if (entry.isDirectory()) {
      const childPath = join(dirPath, entry.name);
      let childCount = 0;
      try {
        const children = await readdir(childPath);
        childCount = children.filter(c => !c.startsWith('.')).length;
      } catch { /* ignore */ }

      lines.push(`${indent}${entry.name}/ (${childCount} items)`);

      if (currentDepth < maxDepth) {
        const children = await buildTree(childPath, currentDepth + 1, maxDepth);
        lines.push(...children);
      }
    } else {
      lines.push(`${indent}${entry.name}`);
    }
  }

  return lines;
}

export async function treeInject(options: TreeInjectOptions): Promise<string> {
  const { vaultPath, depth } = options;

  try {
    await stat(vaultPath);
  } catch {
    return `Vault path not found: ${vaultPath}`;
  }

  const lines = await buildTree(vaultPath, 0, depth);

  if (lines.length === 0) {
    return 'Empty vault. Run vault-init to create the structure.';
  }

  return `Vault Structure:\n${lines.join('\n')}`;
}
