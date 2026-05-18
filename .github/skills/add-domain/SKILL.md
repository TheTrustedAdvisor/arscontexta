---
name: add-domain
description: "Add a new knowledge domain to an existing vault. Creates domain-specific MOCs, templates, and vocabulary mappings."
tags:
  - architecture
  - domain
  - expansion
---

## Skill: add-domain

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user wants to extend their vault with a new subject area, discipline, or knowledge domain — without rebuilding from scratch.

### Arguments

Optional: domain name (e.g. `add-domain "machine learning"`)

### Behavior

**Conversation Phase**
If no domain name was provided, ask: "What domain do you want to add? Describe the kinds of things you'll be capturing in it."

Conduct a brief 2–3 turn conversation to understand:
- The domain's vocabulary (what do practitioners call things?)
- How this domain relates to existing domains in the vault
- Typical note granularity for this domain (concepts, papers, people, projects?)
- Whether this domain needs its own MOC hierarchy or integrates into an existing one

**Derivation Phase**
Derive domain-specific configuration:
- Vocabulary mappings: canonical terms the user uses for notes, links, and tags in this domain
- MOC hierarchy: which hub MOC this domain hangs from, and what topic MOCs are needed immediately
- Templates: note templates tuned to the domain's typical structure
- Schema additions: any new frontmatter fields needed for this domain's notes

**Proposal Phase**
Show the user what will be generated:
- New MOC files and their location in `notes/`
- New templates and their names
- Additions to `ops/derivation-manifest.md`
- Any updates to context files (`copilot-instructions.md`, `CLAUDE.md`)

Wait for confirmation before generating.

**Generation Phase**
Execute the approved additions:
- Create domain MOC(s) in `notes/` using the vault's established MOC template
- Create domain-specific note templates in `templates/`
- Append domain entry to `ops/derivation-manifest.md` under the domains section
- Update `ops/config.yaml` if new schema fields were added
- Refresh `copilot-instructions.md` and `CLAUDE.md` to include domain vocabulary

**Validation**
Confirm that:
- New MOC links into at least one existing MOC (no orphan domains)
- All new templates pass the vault's schema enforcement rules
- `ops/derivation-manifest.md` reflects the addition with a timestamp
