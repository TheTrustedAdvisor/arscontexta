---
name: upgrade
description: "Apply plugin methodology updates to an existing vault. Preserves user content while upgrading templates, config, and context files."
tags:
  - architecture
  - maintenance
  - upgrade
---

## Skill: upgrade

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user wants to bring their vault up to date with a newer version of the Ars Contexta plugin, after a plugin update, or when prompted by the health checker that the vault version is behind.

### Behavior

**Version Comparison Phase**
Read `ops/derivation-manifest.md` to determine the vault's current plugin version. Compare against the plugin's current version.

If the vault is already at the current version, report this and exit: "Your vault is already running plugin version {version}. No upgrade needed."

**Change Summary Phase**
Show the user exactly what will change, organized by impact:

- **Templates** — list each template file that will be updated, with a one-line summary of what changed (e.g. "Added `reviewed` frontmatter field")
- **Context files** — `copilot-instructions.md` and `CLAUDE.md`: describe what sections will be refreshed
- **Methodology references** — any new or updated methodology notes that will be added to `ops/methodology/`
- **Config schema** — any new fields added to `ops/config.yaml` (always additive, never removes existing fields)
- **What will NOT change** — explicitly state that all files in `notes/`, `self/`, and any user-created files will not be touched

Wait for user confirmation before proceeding.

**Backup Phase**
Before modifying any file, create timestamped backups in `ops/archive/`:
- Each template being updated → `ops/archive/templates/{name}-{YYYY-MM-DD}.md`
- `copilot-instructions.md` → `ops/archive/copilot-instructions-{YYYY-MM-DD}.md`
- `CLAUDE.md` → `ops/archive/CLAUDE-{YYYY-MM-DD}.md`
- `ops/config.yaml` → `ops/archive/config-{YYYY-MM-DD}.yaml`

**Upgrade Phase**
Apply updates in order:
1. Update templates (merge new fields/sections, preserve user customizations where detectable)
2. Refresh `copilot-instructions.md` and `CLAUDE.md` (re-derive from current config + new plugin defaults)
3. Add new methodology notes to `ops/methodology/` if introduced in this version
4. Add new config fields to `ops/config.yaml` with default values
5. Update the plugin version field in `ops/derivation-manifest.md`

**Validation Phase**
Run the 15 kernel primitive checks. Report any that regressed during the upgrade. If regressions are found, offer to restore from backup.
