import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { assertContained, safeVaultPath } from '../path-guard.js';

// ---------------------------------------------------------------------------
// assertContained
// ---------------------------------------------------------------------------
describe('assertContained', () => {
  it('returns resolved path for valid child', () => {
    const base = '/tmp/vault';
    const result = assertContained(base, 'notes/foo.md');
    expect(result).toBe(resolve(base, 'notes/foo.md'));
  });

  it('throws on path traversal with ../', () => {
    expect(() => assertContained('/tmp/vault', '../etc/passwd')).toThrow(
      'Path escapes vault root',
    );
  });

  it('throws on deep path traversal', () => {
    expect(() => assertContained('/tmp/vault', '../../etc/passwd')).toThrow(
      'Path escapes vault root',
    );
  });

  it('allows nested subdirectory paths', () => {
    const base = '/tmp/vault';
    const result = assertContained(base, 'notes/sub/deep/file.md');
    expect(result).toBe(resolve(base, 'notes/sub/deep/file.md'));
  });

  it('allows path at the root itself', () => {
    const base = '/tmp/vault';
    const result = assertContained(base, 'file.md');
    expect(result).toBe(resolve(base, 'file.md'));
  });
});

// ---------------------------------------------------------------------------
// safeVaultPath
// ---------------------------------------------------------------------------
describe('safeVaultPath', () => {
  it('resolves a relative path within cwd', () => {
    const result = safeVaultPath('./my-vault');
    expect(result).toBe(resolve('.', 'my-vault'));
  });

  it('resolves an absolute path within cwd', () => {
    const cwd = resolve('.');
    const vaultPath = resolve(cwd, 'test-vault');
    expect(safeVaultPath(vaultPath)).toBe(vaultPath);
  });
});
