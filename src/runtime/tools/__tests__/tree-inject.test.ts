import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { treeInject } from '../tree-inject.js';

describe('treeInject', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function freshDir(): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'tree-'));
    return tempDir;
  }

  it('returns tree structure for a vault', async () => {
    const vaultPath = await freshDir();
    await mkdir(join(vaultPath, 'notes'));
    await writeFile(join(vaultPath, 'notes', 'index.md'), '# Index');
    await writeFile(join(vaultPath, 'notes', 'foo.md'), '# Foo');
    await mkdir(join(vaultPath, 'ops'));
    await writeFile(join(vaultPath, 'ops', 'config.yaml'), 'preset: test');

    const result = await treeInject({ vaultPath, depth: 2 });
    expect(result).toContain('Vault Structure:');
    expect(result).toContain('notes/');
    expect(result).toContain('ops/');
    expect(result).toContain('index.md');
    expect(result).toContain('config.yaml');
  });

  it('respects depth limit', async () => {
    const vaultPath = await freshDir();
    await mkdir(join(vaultPath, 'a', 'b', 'c'), { recursive: true });
    await writeFile(join(vaultPath, 'a', 'b', 'c', 'deep.md'), 'content');

    const result = await treeInject({ vaultPath, depth: 1 });
    expect(result).toContain('a/');
    expect(result).toContain('b/');
    // At depth 1 we show dir b/ but shouldn't recurse into c/
    expect(result).not.toContain('deep.md');
  });

  it('ignores IGNORED_DIRS like node_modules and .git', async () => {
    const vaultPath = await freshDir();
    await mkdir(join(vaultPath, 'node_modules'));
    await mkdir(join(vaultPath, '.git'));
    await mkdir(join(vaultPath, 'notes'));
    await writeFile(join(vaultPath, 'notes', 'test.md'), '# Test');

    const result = await treeInject({ vaultPath, depth: 2 });
    expect(result).not.toContain('node_modules');
    expect(result).not.toContain('.git');
    expect(result).toContain('notes/');
  });

  it('returns empty vault message for empty directory', async () => {
    const vaultPath = await freshDir();
    const result = await treeInject({ vaultPath, depth: 2 });
    expect(result).toContain('Empty vault');
  });

  it('returns not found for non-existent path', async () => {
    const result = await treeInject({ vaultPath: '/nonexistent/vault/abc123', depth: 2 });
    expect(result).toContain('Vault path not found');
  });

  it('sorts directories before files', async () => {
    const vaultPath = await freshDir();
    await writeFile(join(vaultPath, 'b-file.md'), 'content');
    await mkdir(join(vaultPath, 'a-dir'));
    await writeFile(join(vaultPath, 'a-file.md'), 'content');

    const result = await treeInject({ vaultPath, depth: 1 });
    const lines = result.split('\n');
    const dirLine = lines.findIndex(l => l.includes('a-dir/'));
    const fileLine = lines.findIndex(l => l.includes('a-file.md'));
    expect(dirLine).toBeLessThan(fileLine);
  });
});
