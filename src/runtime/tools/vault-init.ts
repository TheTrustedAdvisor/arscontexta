import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

interface VaultInitOptions {
  preset: 'research' | 'personal-assistant' | 'experimental';
  notesDir: string;
  selfEnabled: boolean;
  vaultPath: string;
}

const PRESETS = {
  research: {
    selfEnabled: false,
    notesDir: 'notes',
    vocabulary: { note: 'claim', notes: 'notes', inbox: 'inbox', topicMap: 'topic map', reduce: 'reduce', reflect: 'reflect' },
  },
  'personal-assistant': {
    selfEnabled: true,
    notesDir: 'reflections',
    vocabulary: { note: 'reflection', notes: 'reflections', inbox: 'journal', topicMap: 'life area', reduce: 'surface', reflect: 'find patterns' },
  },
  experimental: {
    selfEnabled: false,
    notesDir: 'notes',
    vocabulary: { note: 'note', notes: 'notes', inbox: 'inbox', topicMap: 'topic map', reduce: 'reduce', reflect: 'reflect' },
  },
};

export async function vaultInit(options: VaultInitOptions): Promise<string> {
  const { preset, vaultPath } = options;
  const config = PRESETS[preset];
  const notesDir = options.notesDir || config.notesDir;
  const selfEnabled = options.selfEnabled ?? config.selfEnabled;

  try {
    await stat(join(vaultPath, 'ops', 'config.yaml'));
    return 'Vault already exists at this path. Use reseed to reconfigure, or choose a different path.';
  } catch {
    // No existing vault — proceed with initialization
  }

  const dirs = [
    notesDir,
    config.vocabulary.inbox === 'inbox' ? 'inbox' : config.vocabulary.inbox,
    'archive',
    'templates',
    'ops',
    'ops/sessions',
    'ops/health',
    'ops/observations',
    'ops/methodology',
    'ops/queue',
  ];

  if (selfEnabled) {
    dirs.push('self', 'self/memory');
  }

  const created: string[] = [];
  for (const dir of dirs) {
    const fullPath = join(vaultPath, dir);
    await mkdir(fullPath, { recursive: true });
    created.push(dir);
  }

  const today = new Date().toISOString().split('T')[0];

  await writeFile(join(vaultPath, notesDir, 'index.md'), `---
description: Hub map of content — entry point for navigating the knowledge graph
type: moc
created: ${today}
---

# Index

The hub MOC. Start here to navigate the knowledge graph.

## Domains
_Add domain MOCs as the vault grows._
`);

  await writeFile(join(vaultPath, 'ops', 'config.yaml'), `# Ars Contexta Vault Configuration
# Edit these values to adjust vault behavior

preset: ${preset}
version: "1.0"

dimensions:
  atomicity: 0.8
  organization: 0.2
  linking: 0.7
  processing: 0.8
  session: 0.7
  maintenance: 0.7
  search: 0.5
  automation: 0.8

features:
  self_space: ${selfEnabled}
  semantic_search: false
  auto_commit: true

vocabulary:
  note: "${config.vocabulary.note}"
  notes: "${notesDir}"
  inbox: "${config.vocabulary.inbox === 'inbox' ? 'inbox' : config.vocabulary.inbox}"
  topic_map: "${config.vocabulary.topicMap}"
  reduce: "${config.vocabulary.reduce}"
  reflect: "${config.vocabulary.reflect}"
`);

  await writeFile(join(vaultPath, 'ops', 'derivation-manifest.md'), `---
version: "1.0"
preset: ${preset}
created: ${today}
plugin_version: "0.1.0"
---

# Derivation Manifest

## Preset
${preset}

## Vocabulary Mapping

| Universal | Domain-Native |
|-----------|--------------|
| note | ${config.vocabulary.note} |
| notes | ${notesDir} |
| inbox | ${config.vocabulary.inbox} |
| topic map | ${config.vocabulary.topicMap} |
| reduce | ${config.vocabulary.reduce} |
| reflect | ${config.vocabulary.reflect} |

## Platform
- Copilot CLI: copilot-instructions.md
- Claude Code: CLAUDE.md
`);

  await writeFile(join(vaultPath, 'ops', 'reminders.md'), `# Reminders

_Time-bound actions. Check at session start. Remove when done._
`);

  if (selfEnabled) {
    await writeFile(join(vaultPath, 'self', 'identity.md'), `---
description: Agent identity — personality, values, working approach
type: self
created: ${today}
---

# Identity

_Define who the agent is. Updated rarely — personality doesn't change often._
`);

    await writeFile(join(vaultPath, 'self', 'methodology.md'), `---
description: How the agent works — quality standards, processing principles
type: self
created: ${today}
---

# Methodology

_How the agent processes, connects, and maintains knowledge. Evolves as the agent learns._
`);

    await writeFile(join(vaultPath, 'self', 'goals.md'), `---
description: Current threads — what's active, deferred, completed
type: self
created: ${today}
---

# Goals

_What the agent is working on. Updated every session._

## Active

## Deferred

## Completed
`);
  }

  return `Vault initialized successfully:
- Preset: ${preset}
- Notes directory: ${notesDir}
- Self space: ${selfEnabled ? 'enabled' : 'disabled'}
- Directories created: ${created.join(', ')}
- Hub MOC created: ${notesDir}/index.md
- Config: ops/config.yaml
- Manifest: ops/derivation-manifest.md`;
}
