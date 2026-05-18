import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { noteSearch } from '../note-search.js';

function makeNote(title: string, description: string, body: string, type = 'claim'): string {
  return `---
description: ${description}
type: ${type}
created: 2025-01-01
---

# ${title}

${body}
`;
}

describe('noteSearch', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function createVault(notes: Record<string, { title: string; description: string; body: string }>): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'ns-'));
    await mkdir(join(tempDir, 'notes'));
    for (const [filename, info] of Object.entries(notes)) {
      await writeFile(join(tempDir, 'notes', filename), makeNote(info.title, info.description, info.body));
    }
    return tempDir;
  }

  it('searches by title scope', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha Concept', description: 'Describes alpha', body: 'Body text' },
      'beta.md': { title: 'Beta Pattern', description: 'Describes beta', body: 'Alpha appears in body' },
    });
    const result = await noteSearch({ query: 'Alpha', vaultPath: vault, scope: 'title' });
    expect(result).toContain('alpha.md');
    // beta.md has "Alpha" only in body, not title — should not match in title scope
    expect(result).not.toContain('beta.md');
  });

  it('searches by content scope', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha', description: 'Describes alpha', body: 'The fox jumped over the fence' },
      'beta.md': { title: 'Beta', description: 'Describes beta', body: 'The fox ran quickly' },
      'gamma.md': { title: 'Gamma', description: 'Describes gamma', body: 'No animal here' },
    });
    const result = await noteSearch({ query: 'fox', vaultPath: vault, scope: 'content' });
    expect(result).toContain('alpha.md');
    expect(result).toContain('beta.md');
    expect(result).not.toContain('gamma.md');
  });

  it('searches by frontmatter scope', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha', description: 'Quantum mechanics exploration notes', body: 'Body' },
      'beta.md': { title: 'Beta', description: 'Classical physics notes', body: 'Quantum in body' },
    });
    const result = await noteSearch({ query: 'Quantum', vaultPath: vault, scope: 'frontmatter' });
    expect(result).toContain('alpha.md');
    // beta.md has "Quantum" in body, not frontmatter
    expect(result).not.toContain('beta.md');
  });

  it('searches all scopes', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha', description: 'Unique keyword here', body: 'Body text' },
      'beta.md': { title: 'Unique keyword Title', description: 'Desc', body: 'Body' },
      'gamma.md': { title: 'Gamma', description: 'Desc', body: 'Contains unique keyword in body' },
    });
    const result = await noteSearch({ query: 'unique keyword', vaultPath: vault, scope: 'all' });
    expect(result).toContain('alpha.md');
    expect(result).toContain('beta.md');
    expect(result).toContain('gamma.md');
  });

  it('returns error for empty query', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha', description: 'Desc', body: 'Body' },
    });
    const result = await noteSearch({ query: '  ', vaultPath: vault, scope: 'all' });
    expect(result).toContain('Search query cannot be empty');
  });

  it('returns appropriate message when no matches found', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'Alpha', description: 'Desc', body: 'Body' },
    });
    const result = await noteSearch({ query: 'zzzznonexistent', vaultPath: vault, scope: 'all' });
    expect(result).toContain('No matches found');
  });

  it('returns error when no notes directory', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ns-'));
    const result = await noteSearch({ query: 'test', vaultPath: tempDir, scope: 'all' });
    expect(result).toContain('No notes directory found');
  });

  it('results are sorted by match count descending', async () => {
    const vault = await createVault({
      'few.md': { title: 'Test', description: 'Desc', body: 'apple' },
      'many.md': { title: 'Apple', description: 'apple desc', body: 'apple apple apple' },
    });
    const result = await noteSearch({ query: 'apple', vaultPath: vault, scope: 'all' });
    const lines = result.split('\n');
    const manyIdx = lines.findIndex(l => l.includes('many.md'));
    const fewIdx = lines.findIndex(l => l.includes('few.md'));
    expect(manyIdx).toBeLessThan(fewIdx);
  });

  it('caps results at 20', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ns-'));
    await mkdir(join(tempDir, 'notes'));
    for (let i = 0; i < 25; i++) {
      await writeFile(
        join(tempDir, 'notes', `note-${i}.md`),
        makeNote(`Note ${i}`, 'Keyword desc', 'keyword body'),
      );
    }
    const result = await noteSearch({ query: 'keyword', vaultPath: tempDir, scope: 'all' });
    expect(result).toContain('and 5 more files');
  });

  it('is case-insensitive', async () => {
    const vault = await createVault({
      'alpha.md': { title: 'UPPERCASE Test', description: 'Desc', body: 'Body' },
    });
    const result = await noteSearch({ query: 'uppercase', vaultPath: vault, scope: 'title' });
    expect(result).toContain('alpha.md');
  });
});
