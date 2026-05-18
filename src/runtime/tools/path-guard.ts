import { resolve, relative } from 'node:path';

export function assertContained(basePath: string, targetPath: string): string {
  const resolvedBase = resolve(basePath);
  const resolvedTarget = resolve(resolvedBase, targetPath);
  const rel = relative(resolvedBase, resolvedTarget);
  if (rel.startsWith('..') || rel.startsWith('/')) {
    throw new Error(`Path escapes vault root: ${targetPath}`);
  }
  return resolvedTarget;
}

export function safeVaultPath(vaultPath: string): string {
  const resolved = resolve(vaultPath);
  const cwd = resolve('.');
  const rel = relative(cwd, resolved);
  if (rel.startsWith('..') && !resolved.startsWith(cwd)) {
    throw new Error(`Vault path must be within or below working directory: ${vaultPath}`);
  }
  return resolved;
}

export const MAX_FILES = 500;
export const MAX_FILE_SIZE = 256 * 1024;
