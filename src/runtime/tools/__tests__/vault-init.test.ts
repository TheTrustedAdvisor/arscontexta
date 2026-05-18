import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, stat, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { vaultInit } from '../vault-init.js';

describe('vaultInit', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function freshDir(): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'vinit-'));
    return tempDir;
  }

  it('creates research preset with correct directories', async () => {
    const vaultPath = await freshDir();
    const result = await vaultInit({
      preset: 'research',
      notesDir: 'notes',
      selfEnabled: false,
      vaultPath,
    });

    expect(result).toContain('Vault initialized successfully');
    expect(result).toContain('Preset: research');
    expect(result).toContain('Self space: disabled');

    // Verify directories exist
    await expect(stat(join(vaultPath, 'notes'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'inbox'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'archive'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'templates'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'ops'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'ops', 'sessions'))).resolves.toBeDefined();

    // Verify files
    const config = await readFile(join(vaultPath, 'ops', 'config.yaml'), 'utf-8');
    expect(config).toContain('preset: research');

    const index = await readFile(join(vaultPath, 'notes', 'index.md'), 'utf-8');
    expect(index).toContain('# Index');
    expect(index).toContain('type: moc');
  });

  it('creates personal-assistant preset with self space', async () => {
    const vaultPath = await freshDir();
    const result = await vaultInit({
      preset: 'personal-assistant',
      notesDir: 'reflections',
      selfEnabled: true,
      vaultPath,
    });

    expect(result).toContain('Self space: enabled');
    await expect(stat(join(vaultPath, 'self'))).resolves.toBeDefined();
    await expect(stat(join(vaultPath, 'self', 'memory'))).resolves.toBeDefined();

    const identity = await readFile(join(vaultPath, 'self', 'identity.md'), 'utf-8');
    expect(identity).toContain('# Identity');
    expect(identity).toContain('type: self');

    const goals = await readFile(join(vaultPath, 'self', 'goals.md'), 'utf-8');
    expect(goals).toContain('# Goals');
  });

  it('creates experimental preset', async () => {
    const vaultPath = await freshDir();
    const result = await vaultInit({
      preset: 'experimental',
      notesDir: '',
      selfEnabled: false,
      vaultPath,
    });

    expect(result).toContain('Preset: experimental');
    // Empty notesDir falls back to config default 'notes'
    await expect(stat(join(vaultPath, 'notes'))).resolves.toBeDefined();
  });

  it('overwrite protection: returns error if vault already exists', async () => {
    const vaultPath = await freshDir();

    // First init
    await vaultInit({
      preset: 'research',
      notesDir: 'notes',
      selfEnabled: false,
      vaultPath,
    });

    // Second init should be blocked
    const result = await vaultInit({
      preset: 'research',
      notesDir: 'notes',
      selfEnabled: false,
      vaultPath,
    });

    expect(result).toContain('Vault already exists');
  });

  it('self space disabled does not create self directory', async () => {
    const vaultPath = await freshDir();
    await vaultInit({
      preset: 'research',
      notesDir: 'notes',
      selfEnabled: false,
      vaultPath,
    });

    await expect(stat(join(vaultPath, 'self'))).rejects.toThrow();
  });

  it('creates derivation manifest with vocabulary mapping', async () => {
    const vaultPath = await freshDir();
    await vaultInit({
      preset: 'personal-assistant',
      notesDir: 'reflections',
      selfEnabled: true,
      vaultPath,
    });

    const manifest = await readFile(join(vaultPath, 'ops', 'derivation-manifest.md'), 'utf-8');
    expect(manifest).toContain('personal-assistant');
    expect(manifest).toContain('reflection');
    expect(manifest).toContain('reflections');
  });
});
