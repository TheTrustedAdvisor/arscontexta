# Vault Format Specification v1.0

This document defines the platform-independent vault format that ensures portability between Claude Code (OMC) and GitHub Copilot agents.

## Three-Space Architecture

Every vault has exactly three spaces with distinct durability profiles:

```
vault-root/
├── self/                    # Agent's persistent mind (configurable)
│   ├── identity.md          # Who the agent is
│   ├── methodology.md       # How it works
│   ├── goals.md             # Current threads
│   ├── relationships.md     # (optional) Key people
│   └── memory/              # (optional) Atomic self-knowledge
├── {notes}/                 # Knowledge graph (domain-named)
│   ├── index.md             # Hub MOC
│   ├── {domain-mocs}.md     # Domain/topic MOCs
│   └── {notes}.md           # Atomic notes (prose-titled)
├── inbox/                   # Zero-friction capture
├── archive/                 # Processed sources
├── templates/               # Note templates
└── ops/                     # Operational coordination
    ├── derivation.md        # Configuration rationale
    ├── derivation-manifest.md # Version tracking + vocabulary
    ├── config.yaml          # Live configuration
    ├── reminders.md         # Time-bound actions
    ├── user-overrides.md    # Immutable customizations
    ├── sessions/            # Session transcripts
    ├── health/              # Diagnostic reports
    ├── observations/        # Friction signals
    ├── methodology/         # Vault self-knowledge
    └── queue/               # Processing pipeline state
```

## Note Format

Every note follows this structure regardless of domain:

```markdown
---
description: ~150 chars elaborating the claim (adds info beyond title)
type: claim | pattern | preference | fact | decision | question
created: YYYY-MM-DD
{domain-specific fields from derivation-manifest}
---

# {prose-as-title proposition}

{Body: 150-400 words with reasoning and connective words}

---

Source: [[source filename]]

Relevant Notes:
- [[related claim]] — relationship: extends | contradicts | builds on

Topics:
- [[relevant MOC]]
```

### Composability Test
A note title passes if `since [[title]]` reads as natural prose.

## MOC Format

```markdown
---
description: {domain area} — {scope description}
type: moc
created: YYYY-MM-DD
---

# {Domain Area}

{Brief description of what this area covers}

## Key {Notes}
- [[note title]] — {why it matters}

## Open Questions
- {What remains unresolved in this area}
```

## Wiki-Link Convention
- Format: `[[note title]]` (filename without .md extension)
- Resolution: by exact title match within the vault
- Dangling links allowed during creation (resolved during reflect phase)

## Platform-Specific Context Files

Both platforms generate from the same derivation but use different context file locations:

| Platform | Context File | Skills | Hooks |
|----------|-------------|--------|-------|
| Claude Code | `CLAUDE.md` | `.claude/skills/` | `.claude/hooks/` |
| Copilot CLI | `copilot-instructions.md` + `.github/copilot-instructions.md` | `.github/skills/` | `.github/hooks/` |

## 15 Kernel Primitives (Invariant)

These must be enforced identically on both platforms:

1. **markdown-yaml** — Notes are plain text with YAML frontmatter
2. **wiki-links** — `[[title]]` creates navigable graph edges
3. **moc-hierarchy** — Hub → Domain → Topic → Notes
4. **tree-injection** — File structure injected at session start
5. **description-field** — ~150 char YAML field beyond title
6. **topics-footer** — Notes declare MOC membership
7. **schema-enforcement** — Templates define required fields
8. **self-space** — Dedicated agent identity directory (configurable)
9. **session-rhythm** — Orient → Work → Persist cycle
10. **semantic-search** — Meaning-based discovery (optional tier)
11. **unique-addresses** — Filesystem as graph database
12. **discovery-first** — Optimized for future agent discovery
13. **operational-learning-loop** — Friction signals → evolution
14. **task-stack** — Notes flow through lifecycle states
15. **methodology-folder** — ops/methodology/ explains vault design

## Configuration Schema

The file `ops/config.yaml` is the live configuration for a vault. It is generated during `vault-init` and can be edited manually or via the `/architect` skill.

### Top-Level Keys

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `preset` | string | **required** | One of `research`, `personal-assistant`, or `experimental`. Determines default vocabulary and feature flags. |
| `version` | string | **required** | Format version (e.g. `"1.0"`). Must match the version in `ops/derivation-manifest.md`. Used to detect when a vault needs upgrading. |

### Dimensions Block

Eight continuous knobs that control vault behavior. Each is a float in the range `0.0` to `1.0`, where `0.0` means minimal/off and `1.0` means maximum/aggressive.

| Dimension | Default | Controls |
|-----------|---------|----------|
| `atomicity` | 0.8 | How strictly notes are kept to a single claim. Higher values enforce smaller, more focused notes. |
| `organization` | 0.2 | Eagerness to create new MOCs and structural hierarchy. Lower values keep the structure flat until it earns complexity. |
| `linking` | 0.7 | How aggressively the agent creates wiki-links between notes. Higher values produce a denser graph. |
| `processing` | 0.8 | Depth of the reduce/reflect pipeline. Higher values extract more claims per source and do more cross-referencing. |
| `session` | 0.7 | Rigor of the Orient-Work-Persist session rhythm. Higher values enforce stricter check-in and check-out routines. |
| `maintenance` | 0.7 | Frequency and thoroughness of health checks, reweaving, and cleanup passes. |
| `search` | 0.5 | Investment in search infrastructure (embeddings, indexes). Higher values enable semantic search features. |
| `automation` | 0.8 | How much the agent acts autonomously (auto-commit, auto-link, queue processing) vs. asking for confirmation. |

All eight dimensions are **required**. Omitting any dimension causes the runtime to fall back to preset defaults.

### Features Block

Boolean feature flags. All are **required**.

| Key | Type | Description |
|-----|------|-------------|
| `self_space` | boolean | Whether the `self/` directory (identity, methodology, goals) is active. Enabled by default for `personal-assistant`, disabled for `research` and `experimental`. |
| `semantic_search` | boolean | Whether meaning-based search (embeddings) is enabled. Defaults to `false`; requires external tooling. |
| `auto_commit` | boolean | Whether the agent commits changes to version control automatically after modifications. Defaults to `true`. |

### Vocabulary Block

Maps universal concepts to domain-native terms. All keys are **required**.

| Key | Default (research) | Description |
|-----|-------------------|-------------|
| `note` | `"claim"` | What a single knowledge unit is called. |
| `notes` | `"notes"` | Directory name for the knowledge graph. |
| `inbox` | `"inbox"` | Directory name for zero-friction capture. |
| `topic_map` | `"topic map"` | What MOCs are called in user-facing text. |
| `reduce` | `"reduce"` | Verb for extracting insights from sources. |
| `reflect` | `"reflect"` | Verb for finding connections and updating MOCs. |

### Example

```yaml
# ops/config.yaml
preset: research
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
  self_space: false
  semantic_search: false
  auto_commit: true

vocabulary:
  note: "claim"
  notes: "notes"
  inbox: "inbox"
  topic_map: "topic map"
  reduce: "reduce"
  reflect: "reflect"
```

## Version Migration Protocol

Vaults track their format version in two places that must stay in sync:
- `ops/config.yaml` — the `version` field (e.g. `"1.0"`)
- `ops/derivation-manifest.md` — the `version` field in YAML frontmatter

### Migration Steps

When upgrading a vault from one format version to another, follow this sequence:

1. **Backup** — Copy all files that will be modified to `ops/archive/` with timestamps (e.g. `config-2026-05-18.yaml`). This is non-negotiable; every upgrade must be reversible.
2. **Validate current** — Confirm the vault passes health checks at the current version. Do not upgrade a broken vault.
3. **Transform** — Apply the version-specific changes (new config fields, updated templates, refreshed methodology notes).
4. **Validate target** — Run the 15 kernel primitive checks against the upgraded vault. If any regress, offer to restore from backup.
5. **Update version field** — Set `version` in both `ops/config.yaml` and `ops/derivation-manifest.md` to the new version string. This is done last so a partially-applied upgrade is detectable.

### Breaking vs Non-Breaking Changes

| Change Type | Breaking | Examples |
|-------------|----------|----------|
| New optional config field with default | No | Adding a new dimension, new feature flag |
| New template section | No | Adding `reviewed` frontmatter field to templates |
| New methodology note | No | Adding `ops/methodology/new-concept.md` |
| Renamed directory | **Yes** | Renaming `inbox/` to `capture/` |
| Removed config field | **Yes** | Dropping a dimension or vocabulary key |
| Changed note format | **Yes** | Altering required frontmatter fields |

Non-breaking changes can be applied automatically. Breaking changes require explicit user confirmation and may need content migration (moving files, updating links).

### User-Facing Entry Point

The `/upgrade` skill (defined in `.github/skills/upgrade/SKILL.md`) is the primary interface for vault upgrades. It:
- Compares the vault's `plugin_version` in `ops/derivation-manifest.md` against the current plugin version
- Shows a detailed change summary before proceeding
- Creates timestamped backups of all affected files
- Applies updates in order: templates, context files, methodology, config, version fields
- Runs validation after the upgrade completes

### Platform-Specific Files

Context files (`CLAUDE.md`, `copilot-instructions.md`) are **regenerated, not migrated**. During an upgrade, these files are re-derived from the current vault configuration and the new plugin defaults. User content in these files is not preserved — customizations belong in `ops/user-overrides.md`, which is never modified by upgrades.

## Migration Between Platforms

To use a vault with the other platform:
1. Copy the vault directory
2. Run the setup skill on the target platform (it detects existing vaults)
3. The target platform generates its context file alongside the existing one
4. Both context files coexist — each platform reads only its own
