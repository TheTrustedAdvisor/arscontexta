---
name: setup
description: "Scaffold a complete knowledge system. Conversational onboarding derives configuration from your domain. Validates against 15 kernel primitives."
tags:
  - architecture
  - onboarding
  - derivation
---

## Skill: setup

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user wants to create a new Ars Contexta vault, initialize a knowledge system, or run first-time setup.

### Behavior

Activate the vault-architect agent in setup mode. The agent runs the full derivation flow:

**Screen 1 — Product Introduction**
Introduce Ars Contexta: a research-backed knowledge system that derives its structure from your domain rather than imposing a generic template. Explain that the system will ask a few questions, then generate a vault tailored to how you actually think and work.

**Screen 2 — Three Presets**
Present the three starting points:
- **Research** (Zettelkasten + Cornell) — Atomic notes, heavy processing, dense schema, self/ disabled. Best for literature review, academic work, or rigorous knowledge capture.
- **Personal Assistant** — Mixed granularity, self/ enabled, warm personality, entity navigation. Best for life management, journaling, and personal CRM.
- **Experimental** — User co-designs every dimension with full transparency. Best for power users who want explicit control over all 8 configuration dimensions.

**Screen 3 — What Happens Next**
Explain: "I'll ask you 2-4 questions about your work, then derive 8 configuration dimensions from your answers, propose a vault structure, and generate everything you need to start."

**Conversation Phase (2-4 turns)**
Open with: "Tell me about what you want to track, remember, or think about."

Extract signals passively from the user's natural language. Listen for:
- Domain vocabulary (what they call things)
- Granularity preferences (atomic facts vs. rich notes)
- Collaboration signals (solo vs. team)
- Temporal patterns (daily capture vs. project-based)
- Existing tools and friction points

**Derivation Phase**
Map extracted signals to the 8 configuration dimensions (0.0–1.0 scale):
- Atomicity, Organization, Linking, Processing, Session, Maintenance, Search, Automation

Confidence scoring per dimension. Resolution threshold: cumulative confidence > 1.5 per dimension. For low-confidence dimensions, default to the preset baseline.

**Proposal Phase**
Show the user what will be generated and explain every architectural choice in terms of their stated needs. Wait for confirmation before generating.

**Generation Phase**
Generate the complete vault:
- Three-space folder structure (self/, {notes}/, ops/)
- Domain-native vocabulary throughout
- Templates for each note type
- Starter MOCs (hub → domain → topic hierarchy)
- `ops/derivation.md` and `ops/derivation-manifest.md`
- `ops/config.yaml` with derived dimension values

**Dual Context Files (always generate both)**
- `copilot-instructions.md` — GitHub Copilot CLI format
- `CLAUDE.md` — Claude Code / OMC format

Both are derived from the same configuration but use platform-specific syntax. This ensures vault portability across AI tooling.

**Validation Phase**
Check all 15 kernel primitives: markdown-yaml, wiki-links, moc-hierarchy, tree-injection, description-field, topics-footer, schema-enforcement, self-space, session-rhythm, semantic-search, unique-addresses, discovery-first, operational-learning-loop, task-stack, methodology-folder.

Report PASS/FAIL per primitive. Surface any missing elements as a checklist for the user to resolve.
