---
name: verify
description: "Combined quality check: schema compliance, description quality, link health, topic coverage. Quick validation of vault integrity."
tags:
  - quality
  - validation
  - pipeline
---

## Skill: verify

Delegates to: @ars-contexta:health-checker

### Trigger

Invoke this skill for a focused quality check on recently processed notes, or to validate a specific note before considering it complete. For full vault-wide diagnostics, use the `health` skill instead.

### Arguments

- `<note>` — validate a single note
- `recent` — validate notes created or modified in the last session (default)
- `all` — validate all notes in the vault

If no argument is provided, use `recent`.

### Behavior

Run four validation categories in sequence. Report PASS, WARN, or FAIL per category.

**Category 1: Schema Compliance**
For each note, check that the YAML frontmatter contains all required fields from the applicable template:
- `description` field present and non-empty
- `type` field present and is a recognized value (claim, pattern, preference, fact, decision, question)
- `created` field present and in YYYY-MM-DD format
- No unrecognized frontmatter fields (warn, not fail)

Result: PASS (all fields valid) / WARN (unrecognized fields) / FAIL (required field missing or malformed)

**Category 2: Description Quality**
For each note:
- Description must differ from the title (not a restatement)
- Description must be >50 characters
- Description must add information not already in the title

Result: PASS / WARN (borderline length or partial restatement) / FAIL (<50 chars or identical to title)

**Category 3: Link Health**
For each wiki-link in each note:
- Resolve the link to a file in the vault
- Flag any links where no matching file exists (dangling links)

Result: PASS (all links resolve) / WARN (links to files outside notes/) / FAIL (dangling wiki-links present)

**Category 4: Topics Coverage**
For each note:
- Check that at least one entry in the Topics footer is a link to an existing MOC
- A note with no MOC membership is unreachable via navigation

Result: PASS (every note in ≥1 MOC) / WARN (note has topic links but MOC file doesn't list it) / FAIL (note has no topic links)

**Output format**
```
Verify Results — {scope} — {YYYY-MM-DD}

Schema Compliance:   PASS | WARN | FAIL  ({n} notes checked, {n} issues)
Description Quality: PASS | WARN | FAIL  ({n} notes checked, {n} issues)
Link Health:         PASS | WARN | FAIL  ({n} links checked, {n} dangling)
Topics Coverage:     PASS | WARN | FAIL  ({n} notes checked, {n} orphans)

Issues:
- {file}: {issue description}
```
