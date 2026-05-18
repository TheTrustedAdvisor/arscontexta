import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { graphQuery } from '../graph-query.js';

function makeNote(title: string, links: string[], type = 'claim'): string {
  const desc = `Description of ${title} that is definitely long enough to pass validation`;
  const body = links.map(l => `- [[${l}]]`).join('\n');
  return `---
description: ${desc}
type: ${type}
created: 2025-01-01
---

# ${title}

${body}
`;
}

describe('graphQuery', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function createVault(notes: Record<string, { links: string[]; type?: string }>): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'gq-'));
    await mkdir(join(tempDir, 'notes'));
    for (const [name, info] of Object.entries(notes)) {
      await writeFile(
        join(tempDir, 'notes', `${name.toLowerCase().replace(/ /g, '-')}.md`),
        makeNote(name, info.links, info.type || 'claim'),
      );
    }
    return tempDir;
  }

  it('returns error when no notes directory exists', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gq-'));
    const result = await graphQuery({ query: 'stats', vaultPath: tempDir });
    expect(result).toContain('No notes directory found');
  });

  // -------------------------------------------------------------------------
  // orphans
  // -------------------------------------------------------------------------
  describe('orphans', () => {
    it('detects unlinked notes', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta'] },
        'Beta': { links: ['Alpha'] },
        'Gamma': { links: [] },
      });
      const result = await graphQuery({ query: 'orphans', vaultPath: vault });
      expect(result).toContain('Gamma');
      expect(result).not.toContain('Alpha');
      expect(result).not.toContain('Beta');
    });

    it('reports no orphans when all notes are linked', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta'] },
        'Beta': { links: ['Alpha'] },
      });
      const result = await graphQuery({ query: 'orphans', vaultPath: vault });
      expect(result).toContain('No orphan notes');
    });
  });

  // -------------------------------------------------------------------------
  // backlinks
  // -------------------------------------------------------------------------
  describe('backlinks', () => {
    it('finds notes linking to target', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta'] },
        'Beta': { links: [] },
        'Gamma': { links: ['Beta'] },
      });
      const result = await graphQuery({ query: 'backlinks', notePath: 'Beta.md', vaultPath: vault });
      expect(result).toContain('Alpha');
      expect(result).toContain('Gamma');
    });

    it('returns no backlinks message for unlinked note', async () => {
      const vault = await createVault({
        'Alpha': { links: [] },
        'Beta': { links: [] },
      });
      const result = await graphQuery({ query: 'backlinks', notePath: 'Alpha.md', vaultPath: vault });
      expect(result).toContain('No backlinks');
    });

    it('requires notePath argument', async () => {
      const vault = await createVault({ 'Alpha': { links: [] } });
      const result = await graphQuery({ query: 'backlinks', vaultPath: vault });
      expect(result).toContain('Provide a note path');
    });
  });

  // -------------------------------------------------------------------------
  // density
  // -------------------------------------------------------------------------
  describe('density', () => {
    it('calculates link density averages', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta', 'Gamma'] },
        'Beta': { links: ['Alpha'] },
        'Gamma': { links: [] },
      });
      const result = await graphQuery({ query: 'density', vaultPath: vault });
      expect(result).toContain('Link Density Report');
      expect(result).toContain('Average:');
      expect(result).toContain('Total links: 3');
    });

    it('handles empty vault', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'gq-'));
      await mkdir(join(tempDir, 'notes'));
      const result = await graphQuery({ query: 'density', vaultPath: tempDir });
      expect(result).toContain('No notes to analyze');
    });
  });

  // -------------------------------------------------------------------------
  // stats
  // -------------------------------------------------------------------------
  describe('stats', () => {
    it('returns correct counts', async () => {
      const vault = await createVault({
        'Index': { links: ['Alpha', 'Beta'], type: 'moc' },
        'Alpha': { links: ['Beta'] },
        'Beta': { links: [] },
      });
      const result = await graphQuery({ query: 'stats', vaultPath: vault });
      expect(result).toContain('Notes: 3');
      expect(result).toContain('Total links: 3');
      expect(result).toContain('MOCs: 1');
    });
  });

  // -------------------------------------------------------------------------
  // traverse
  // -------------------------------------------------------------------------
  describe('traverse', () => {
    it('shows 2-hop neighborhood', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta'] },
        'Beta': { links: ['Gamma'] },
        'Gamma': { links: ['Delta'] },
        'Delta': { links: [] },
      });
      const result = await graphQuery({ query: 'traverse', notePath: 'Alpha.md', vaultPath: vault });
      expect(result).toContain('Neighborhood of "Alpha"');
      expect(result).toContain('[[Beta]]');
      expect(result).toContain('[[Gamma]]');
      // Delta is 3 hops away, should not appear
      expect(result).not.toContain('[[Delta]]');
    });

    it('requires notePath', async () => {
      const vault = await createVault({ 'Alpha': { links: [] } });
      const result = await graphQuery({ query: 'traverse', vaultPath: vault });
      expect(result).toContain('Provide a note path');
    });

    it('returns not found for unknown note', async () => {
      const vault = await createVault({ 'Alpha': { links: [] } });
      const result = await graphQuery({ query: 'traverse', notePath: 'Unknown.md', vaultPath: vault });
      expect(result).toContain('not found');
    });
  });

  // -------------------------------------------------------------------------
  // clusters
  // -------------------------------------------------------------------------
  describe('clusters', () => {
    it('groups notes with shared link targets', async () => {
      // Alpha and Beta both link to X and Y -> they should cluster
      const vault = await createVault({
        'Alpha': { links: ['X', 'Y'] },
        'Beta': { links: ['X', 'Y'] },
        'X': { links: [] },
        'Y': { links: [] },
      });
      const result = await graphQuery({ query: 'clusters', vaultPath: vault });
      expect(result).toContain('Topical Clusters');
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });

    it('returns no clusters when notes share < 2 targets', async () => {
      const vault = await createVault({
        'Alpha': { links: ['X'] },
        'Beta': { links: ['Y'] },
        'X': { links: [] },
        'Y': { links: [] },
      });
      const result = await graphQuery({ query: 'clusters', vaultPath: vault });
      expect(result).toContain('No topical clusters');
    });

    it('handles empty vault', async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'gq-'));
      await mkdir(join(tempDir, 'notes'));
      const result = await graphQuery({ query: 'clusters', vaultPath: tempDir });
      expect(result).toContain('No notes to analyze');
    });
  });

  // -------------------------------------------------------------------------
  // suggestions
  // -------------------------------------------------------------------------
  describe('suggestions', () => {
    it('recommends links via Jaccard similarity', async () => {
      // Alpha links to X, Y; Beta links to X, Y; but they don't link to each other
      const vault = await createVault({
        'Alpha': { links: ['X', 'Y'] },
        'Beta': { links: ['X', 'Y'] },
        'X': { links: [] },
        'Y': { links: [] },
      });
      const result = await graphQuery({ query: 'suggestions', vaultPath: vault });
      expect(result).toContain('Suggested Links');
      expect(result).toContain('Alpha');
      expect(result).toContain('Beta');
    });

    it('returns no suggestions when notes already linked', async () => {
      const vault = await createVault({
        'Alpha': { links: ['Beta', 'X'] },
        'Beta': { links: ['Alpha', 'X'] },
        'X': { links: [] },
      });
      const result = await graphQuery({ query: 'suggestions', vaultPath: vault });
      // Alpha-Beta already linked; no other pair has overlap
      expect(result).toContain('No link suggestions');
    });

    it('needs at least 2 notes', async () => {
      const vault = await createVault({
        'Alpha': { links: [] },
      });
      const result = await graphQuery({ query: 'suggestions', vaultPath: vault });
      expect(result).toContain('Not enough notes');
    });
  });
});
