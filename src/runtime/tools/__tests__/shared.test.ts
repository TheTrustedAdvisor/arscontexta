import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseFrontmatter, extractTitle, extractWikiLinks, findNotesDir } from '../shared.js';

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------
describe('parseFrontmatter', () => {
  it('parses valid YAML frontmatter', () => {
    const content = `---
description: A test note
type: claim
created: 2025-01-01
---

# Title`;
    const fields = parseFrontmatter(content);
    expect(fields).toEqual({
      description: 'A test note',
      type: 'claim',
      created: '2025-01-01',
    });
  });

  it('returns null when delimiters are missing', () => {
    expect(parseFrontmatter('# Just a heading\nSome text')).toBeNull();
  });

  it('returns null for incomplete delimiters', () => {
    expect(parseFrontmatter('---\nfoo: bar\nno closing')).toBeNull();
  });

  it('returns empty object for empty frontmatter', () => {
    const content = `---

---

# Title`;
    const fields = parseFrontmatter(content);
    expect(fields).toEqual({});
  });

  it('strips surrounding quotes from values', () => {
    const content = `---
description: "A quoted description"
type: 'claim'
---`;
    const fields = parseFrontmatter(content);
    expect(fields).not.toBeNull();
    expect(fields!.description).toBe('A quoted description');
    expect(fields!.type).toBe('claim');
  });

  it('handles values containing colons', () => {
    const content = `---
description: Key point: something important
---`;
    const fields = parseFrontmatter(content);
    expect(fields!.description).toBe('Key point: something important');
  });
});

// ---------------------------------------------------------------------------
// extractTitle
// ---------------------------------------------------------------------------
describe('extractTitle', () => {
  it('extracts H1 title', () => {
    expect(extractTitle('# My Title\n\nSome text')).toBe('My Title');
  });

  it('returns null when no H1 present', () => {
    expect(extractTitle('## Sub heading\nSome text')).toBeNull();
  });

  it('extracts first H1 when multiple headings exist', () => {
    const content = `---
description: test
---

# First Title

## Sub

# Second Title`;
    expect(extractTitle(content)).toBe('First Title');
  });

  it('returns null for empty content', () => {
    expect(extractTitle('')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractWikiLinks
// ---------------------------------------------------------------------------
describe('extractWikiLinks', () => {
  it('extracts wiki links', () => {
    const content = 'See [[Note A]] and [[Note B]] for details.';
    expect(extractWikiLinks(content)).toEqual(['Note A', 'Note B']);
  });

  it('returns empty array when no links present', () => {
    expect(extractWikiLinks('No links here.')).toEqual([]);
  });

  it('handles nested brackets gracefully', () => {
    // [[Foo]] should still work; unmatched brackets shouldn't break it
    expect(extractWikiLinks('text [[Foo]] and [bar]')).toEqual(['Foo']);
  });

  it('extracts multiple occurrences of the same link', () => {
    const content = '[[Alpha]] then [[Alpha]] again';
    expect(extractWikiLinks(content)).toEqual(['Alpha', 'Alpha']);
  });

  it('returns empty array for empty string', () => {
    expect(extractWikiLinks('')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findNotesDir
// ---------------------------------------------------------------------------
describe('findNotesDir', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  it('finds "notes" directory', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(tempDir, 'notes'));
    expect(await findNotesDir(tempDir)).toBe('notes');
  });

  it('finds "reflections" directory', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(tempDir, 'reflections'));
    expect(await findNotesDir(tempDir)).toBe('reflections');
  });

  it('returns first matching candidate when multiple exist', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(tempDir, 'concepts'));
    await mkdir(join(tempDir, 'notes'));
    // 'notes' comes before 'concepts' in the candidate list
    expect(await findNotesDir(tempDir)).toBe('notes');
  });

  it('returns null when no candidate matches', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vault-'));
    await mkdir(join(tempDir, 'random'));
    expect(await findNotesDir(tempDir)).toBeNull();
  });

  it('returns null for non-existent directory', async () => {
    expect(await findNotesDir('/nonexistent/path/abc123')).toBeNull();
  });
});
