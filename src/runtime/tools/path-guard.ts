import { resolve, relative } from 'node:path';

function rejectNullBytes(value: string, label: string): void {
  if (value.includes('\0')) {
    throw new Error(`Invalid ${label}: contains null byte`);
  }
}

export function assertContained(basePath: string, targetPath: string): string {
  rejectNullBytes(targetPath, 'path');
  const resolvedBase = resolve(basePath);
  const resolvedTarget = resolve(resolvedBase, targetPath);
  const rel = relative(resolvedBase, resolvedTarget);
  if (rel.startsWith('..') || rel.startsWith('/')) {
    throw new Error(`Path escapes vault root: ${targetPath}`);
  }
  return resolvedTarget;
}

export function safeVaultPath(vaultPath: string): string {
  rejectNullBytes(vaultPath, 'vault path');
  const resolved = resolve(vaultPath);
  const cwd = resolve('.');
  if (resolved !== cwd && !resolved.startsWith(cwd + '/')) {
    throw new Error(`Vault path must be within or below working directory: ${vaultPath}`);
  }
  return resolved;
}

export const MAX_FILES = 500;
export const MAX_FILE_SIZE = 256 * 1024;
