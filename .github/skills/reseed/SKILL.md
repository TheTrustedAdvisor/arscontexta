---
name: reseed
description: "Re-derive the vault configuration from first principles. Use when accumulated drift makes incremental adjustment insufficient."
tags:
  - architecture
  - reset
  - derivation
---

## Skill: reseed

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user feels their vault has drifted significantly from how they actually work, when incremental adjustments are no longer sufficient, or when they want a clean derivation without losing their notes.

### Behavior

**Friction Audit Phase**
Read `ops/derivation.md` to understand the original rationale and `ops/observations/` for accumulated friction signals. Surface a brief summary to the user:
- Original configuration intent
- Key friction patterns recorded since setup
- Dimensions that appear most misaligned

**Conversation Phase**
Run a fresh derivation conversation as in the setup skill, but seeded with what was learned from friction observations. Open with: "Your vault has been running for a while. Let's re-derive from scratch — tell me how your actual usage differs from what you expected."

Listen for:
- Patterns that emerged organically vs. what was planned
- Vocabulary that shifted
- Note types that were never used vs. ones that were invented ad-hoc
- Workflow rhythms that differ from the original session/processing design

**Derivation Phase**
Map fresh signals to the 8 configuration dimensions. Where signals conflict with the original derivation, flag the tension explicitly and let the user decide which to honour.

**Proposal Phase**
Show a diff-style summary of what will change:
- Dimensions that will shift (old value → new value)
- Templates that will be regenerated
- Context files that will be rewritten
- Files that will NOT be touched (all user notes)

Explicitly state: "Your notes in `notes/` and `self/` will not be modified."

Wait for confirmation before proceeding.

**Backup Phase**
Before overwriting any file, create timestamped backups:
- `ops/derivation.md` → `ops/archive/derivation-{YYYY-MM-DD}.md`
- `ops/derivation-manifest.md` → `ops/archive/derivation-manifest-{YYYY-MM-DD}.md`
- `ops/config.yaml` → `ops/archive/config-{YYYY-MM-DD}.yaml`
- `copilot-instructions.md` → `ops/archive/copilot-instructions-{YYYY-MM-DD}.md`
- `CLAUDE.md` → `ops/archive/CLAUDE-{YYYY-MM-DD}.md`

**Generation Phase**
Regenerate ops/ configuration, context files, and templates from the new derivation. Do not modify any file outside of `ops/`, `templates/`, `copilot-instructions.md`, and `CLAUDE.md`.

**Validation**
Run the 15 kernel primitive checks against the regenerated configuration. Report PASS/FAIL and surface any regressions introduced by the new derivation.
