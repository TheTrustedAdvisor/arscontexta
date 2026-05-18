import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { schemaValidate } from '../schema-validate.js';

describe('schemaValidate', () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  });

  async function writeNote(filename: string, content: string): Promise<string> {
    tempDir = await mkdtemp(join(tmpdir(), 'sv-'));
    const filePath = join(tempDir, filename);
    await writeFile(filePath, content);
    return filePath;
  }

  it('PASS for a fully valid note', async () => {
    const filePath = await writeNote('good.md', `---
description: This is a thorough description of the claim that exceeds fifty characters easily
type: claim
created: 2025-01-15
---

# A Good Note

Some body text.

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^PASS:/);
    expect(result).toContain('All checks passed');
  });

  it('FAIL for missing frontmatter', async () => {
    const filePath = await writeNote('no-fm.md', '# Just a heading\n\nNo frontmatter here.');
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^FAIL:/);
    expect(result).toContain('Missing YAML frontmatter');
  });

  it('FAIL for missing required fields', async () => {
    const filePath = await writeNote('missing.md', `---
description: A description that is long enough to pass the minimum character check
---

# Missing Fields
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^FAIL:/);
    expect(result).toContain('Missing required field: type');
    expect(result).toContain('Missing required field: created');
  });

  it('WARN for short description', async () => {
    const filePath = await writeNote('short-desc.md', `---
description: Too short
type: claim
created: 2025-01-01
---

# Short Desc

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^WARN:/);
    expect(result).toContain('Description too short');
  });

  it('WARN for long description', async () => {
    const longDesc = 'A'.repeat(201);
    const filePath = await writeNote('long-desc.md', `---
description: ${longDesc}
type: claim
created: 2025-01-01
---

# Long Desc

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^WARN:/);
    expect(result).toContain('Description too long');
  });

  it('WARN for invalid date format', async () => {
    const filePath = await writeNote('bad-date.md', `---
description: A description long enough to pass the minimum character count for validation
type: claim
created: January 2025
---

# Bad Date

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^WARN:/);
    expect(result).toContain('Invalid date format');
  });

  it('WARN for unknown type', async () => {
    const filePath = await writeNote('bad-type.md', `---
description: A description long enough to pass the minimum character count for validation
type: unknown_type
created: 2025-01-01
---

# Bad Type

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toMatch(/^WARN:/);
    expect(result).toContain('Unknown type: unknown_type');
  });

  it('FAIL for unreadable file', async () => {
    const result = await schemaValidate({ filePath: '/nonexistent/file.md' });
    expect(result).toMatch(/^FAIL:/);
    expect(result).toContain('Cannot read file');
  });

  it('WARN when description is identical to title', async () => {
    const filePath = await writeNote('dup.md', `---
description: Identical Title And Description That Is Long Enough To Pass
type: claim
created: 2025-01-01
---

# Identical Title And Description That Is Long Enough To Pass

Topics:
- [[Topic A]]
`);
    const result = await schemaValidate({ filePath });
    expect(result).toContain('Description is identical to title');
  });

  it('WARN when no Topics section present (non-moc type)', async () => {
    const filePath = await writeNote('no-topics.md', `---
description: A description long enough to pass the minimum character count for validation
type: claim
created: 2025-01-01
---

# No Topics Note

Just body text without topic links.
`);
    const result = await schemaValidate({ filePath });
    expect(result).toContain('No Topics section');
  });

  it('no Topics warning for moc type', async () => {
    const filePath = await writeNote('moc.md', `---
description: A hub map of content that serves as a navigational entry point for the graph
type: moc
created: 2025-01-01
---

# MOC Note

Body text.
`);
    const result = await schemaValidate({ filePath });
    expect(result).not.toContain('No Topics section');
  });
});
