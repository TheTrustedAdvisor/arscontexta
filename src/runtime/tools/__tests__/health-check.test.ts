import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { healthCheck } from '../health-check.js';

function makeNote(opts: {
  title: string;
  description?: string;
  type?: string;
  created?: string;
  topics?: string[];
  body?: string;
}): string {
  const lines = ['---'];
  if (opts.description !== undefined) lines.push(`description: ${opts.description}`);
  if (opts.type !== undefined) lines.push(`type: ${opts.type}`);
  if (opts.created !== undefined) lines.push(`created: ${opts.created}`);
  lines.push('---', '', `# ${opts.title}`);
  if (opts.body) lines.push('', opts.body);
  if (opts.topics && opts.topics.length > 0) {
    lines.push('', 'Topics:');
    for (const t of opts.topics) lines.push(`- [[${t}]]`);
  }
  return lines.join('\n');
}

describe('healthCheck', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function createVault(): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'hc-'));
    await mkdir(join(tempDir, 'notes'));
    await mkdir(join(tempDir, 'ops'));
    return tempDir;
  }

  it('returns error when no notes directory exists', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'hc-'));
    const result = await healthCheck({ mode: 'quick', vaultPath: tempDir });
    expect(result).toContain('No notes directory found');
  });

  it('quick mode runs schema, orphans, and link checks', async () => {
    const vault = await createVault();
    const desc = 'A thorough description of note A that exceeds the minimum character length required';
    await writeFile(
      join(vault, 'notes', 'a.md'),
      makeNote({
        title: 'Note A',
        description: desc,
        type: 'claim',
        created: '2025-01-01',
        topics: ['Note B'],
      }),
    );
    await writeFile(
      join(vault, 'notes', 'b.md'),
      makeNote({
        title: 'Note B',
        description: desc,
        type: 'claim',
        created: '2025-01-01',
        topics: ['Note A'],
      }),
    );

    const result = await healthCheck({ mode: 'quick', vaultPath: vault });
    expect(result).toContain('Vault Health Report');
    expect(result).toContain('Schema Compliance');
    expect(result).toContain('Orphan Detection');
    expect(result).toContain('Link Health');
    // Should NOT contain full-mode-only checks
    expect(result).not.toContain('Description Quality');
    expect(result).not.toContain('Three-Space');
  });

  it('full mode includes description quality and three-space checks', async () => {
    const vault = await createVault();
    const desc = 'A thorough description of the note that exceeds the minimum character length required';
    await writeFile(
      join(vault, 'notes', 'a.md'),
      makeNote({
        title: 'Note A',
        description: desc,
        type: 'claim',
        created: '2025-01-01',
        topics: ['Note A'],
      }),
    );

    const result = await healthCheck({ mode: 'full', vaultPath: vault });
    expect(result).toContain('Description Quality');
    expect(result).toContain('Three-Space');
  });

  it('three-space mode only runs three-space check', async () => {
    const vault = await createVault();
    const desc = 'A thorough description of the note that exceeds the minimum character length required';
    await writeFile(
      join(vault, 'notes', 'a.md'),
      makeNote({
        title: 'Note A',
        description: desc,
        type: 'claim',
        created: '2025-01-01',
        topics: ['Note A'],
      }),
    );

    const result = await healthCheck({ mode: 'three-space', vaultPath: vault });
    expect(result).toContain('Three-Space');
    expect(result).not.toContain('Schema Compliance');
    expect(result).not.toContain('Orphan Detection');
  });

  it('detects schema issues (missing frontmatter fields)', async () => {
    const vault = await createVault();
    // Note without required fields
    await writeFile(join(vault, 'notes', 'bad.md'), '---\ndescription: short\n---\n\n# Bad\n');

    const result = await healthCheck({ mode: 'quick', vaultPath: vault });
    expect(result).toContain('missing type, created');
  });

  it('detects orphan notes', async () => {
    const vault = await createVault();
    const desc = 'A thorough description of the note that exceeds the minimum character length required';
    // Two notes, neither links to the other
    await writeFile(
      join(vault, 'notes', 'orphan-a.md'),
      makeNote({ title: 'Orphan A', description: desc, type: 'claim', created: '2025-01-01' }),
    );
    await writeFile(
      join(vault, 'notes', 'orphan-b.md'),
      makeNote({ title: 'Orphan B', description: desc, type: 'claim', created: '2025-01-01' }),
    );

    const result = await healthCheck({ mode: 'quick', vaultPath: vault });
    expect(result).toContain('Orphan');
  });

  it('detects dangling links', async () => {
    const vault = await createVault();
    const desc = 'A thorough description of the note that exceeds the minimum character length required';
    await writeFile(
      join(vault, 'notes', 'a.md'),
      makeNote({
        title: 'Note A',
        description: desc,
        type: 'claim',
        created: '2025-01-01',
        body: 'See [[Nonexistent Note]]',
      }),
    );

    const result = await healthCheck({ mode: 'quick', vaultPath: vault });
    expect(result).toContain('[[Nonexistent Note]]');
  });

  it('detects three-space boundary violations', async () => {
    const vault = await createVault();
    // Knowledge content in ops/ (should be in notes/)
    await writeFile(
      join(vault, 'ops', 'misplaced.md'),
      makeNote({
        title: 'Misplaced',
        description: 'A long description for the misplaced operational knowledge note in ops',
        type: 'claim',
        created: '2025-01-01',
      }),
    );
    const desc = 'A thorough description of the note that exceeds the minimum character length required';
    await writeFile(
      join(vault, 'notes', 'ok.md'),
      makeNote({ title: 'OK', description: desc, type: 'claim', created: '2025-01-01', topics: ['OK'] }),
    );

    const result = await healthCheck({ mode: 'full', vaultPath: vault });
    expect(result).toContain('knowledge content');
    expect(result).toContain('belongs in notes/');
  });
});
