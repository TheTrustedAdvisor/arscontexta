---
name: architect
description: "Research-backed vault evolution guidance. Toggle features (self-space, semantic search), rebalance MOCs, adjust dimensions with full rationale."
tags:
  - architecture
  - evolution
  - configuration
---

## Skill: architect

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user wants to make explicit architectural changes to their vault: toggling features, adjusting dimension values, rebalancing MOCs, or adding/removing structural capabilities.

### Supported Commands

The skill accepts natural-language architectural commands, including:

- `enable self-space` / `disable self-space`
- `enable semantic search` / `disable semantic search`
- `adjust {dimension} to {value}` (e.g. "adjust atomicity to 0.7")
- `rebalance MOCs` — restructure the MOC hierarchy based on current note distribution
- `add feature {feature-name}`
- `remove feature {feature-name}`
- Free-form: "my notes are too long" → infer the relevant dimension adjustment

### Behavior

**Intent Parsing**
Parse the user's architectural command. If ambiguous, ask one clarifying question before proceeding.

**Rationale Read**
Read `ops/derivation.md` to understand the existing rationale for current configuration. If the requested change conflicts with the original derivation intent, flag this: "Your vault was originally derived with {reason}. This change moves away from that. Is that intentional?"

**Research Explanation**
Before executing any change, explain:
- What this dimension or feature controls
- The research backing for the current value (why it was set as it is)
- The research backing for the proposed new value (what changes cognitively or structurally)
- The practical effect the user will observe

Always cite specific claims, principles, or frameworks from the methodology corpus. Do not present architectural changes as arbitrary knobs — every dimension has a research rationale.

**Proposal Phase**
Show a precise list of what will change:
- Fields in `ops/config.yaml` that will be updated
- Template files that will be regenerated or modified
- MOC files that will be restructured (for rebalance operations)
- Context file sections (`copilot-instructions.md`, `CLAUDE.md`) that will be refreshed

State explicitly what will not change (user notes, self/ content).

Wait for user confirmation.

**Backup Phase**
Create timestamped backups in `ops/archive/` for every file that will be modified.

**Execution Phase**
Apply the approved changes:
1. Update `ops/config.yaml`
2. Regenerate or patch affected templates
3. Restructure MOC files if rebalancing
4. Refresh `copilot-instructions.md` and `CLAUDE.md`
5. Append a dated entry to `ops/derivation.md` recording what changed, why, and the research backing
6. Update `ops/derivation-manifest.md` with the new configuration state

**Validation**
Run the 15 kernel primitive checks. Report PASS/FAIL. If any primitive regressed, offer to roll back the specific change that caused it.
