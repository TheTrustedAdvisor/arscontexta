---
name: health
description: "Run vault health diagnostics. 3 modes: quick (schema+orphans+links), full (all 8 categories), three-space (boundary violations)."
tags:
  - diagnostics
  - maintenance
  - quality
---

## Skill: health

Delegates to: @ars-contexta:health-checker

### Trigger

Invoke this skill to run vault-wide health diagnostics. More comprehensive than `verify` (which focuses on recently processed notes). Use health for periodic maintenance checks.

### Arguments

- `quick` — run 3 core categories: schema compliance, orphan detection, link health (default)
- `full` — run all 8 diagnostic categories
- `three-space` — run boundary violation checks only

If no argument is provided, use `quick`.

### Behavior

Parse the mode from arguments and run the applicable diagnostic categories.

**The 8 Diagnostic Categories**

**1. Schema Compliance** (quick, full)
Check every note's YAML frontmatter against its template. Required fields: description, type, created. Flag missing or malformed fields. Severity: FAIL for missing required fields, WARN for unrecognized fields.

**2. Orphan Detection** (quick, full)
Find notes with zero incoming wiki-links (no other note links to them). Orphans are unreachable via graph traversal. They may be legitimate entry points or forgotten notes. Report count and list. Severity: WARN.

**3. Link Health** (quick, full)
Resolve every wiki-link in every note to a vault file. Flag dangling links (target file does not exist). Severity: FAIL for dangling links, WARN for links to archived files.

**4. Description Quality** (full)
Check that descriptions differ from titles, are >50 chars, and add meaningful information. Severity: WARN.

**5. Three-Space Boundaries** (three-space, full)
Verify that the three-space separation is intact:
- self/ contains only identity, methodology, goals, relationships, memory, journal, sessions
- ops/ contains only operational files (derivation, config, health, queue, sessions, observations, methodology)
- {notes}/ contains no operational or identity files
Flag any files that appear to be in the wrong space. Severity: WARN for misplaced files, FAIL if ops/ or self/ files appear in notes/.

**6. Processing Throughput** (full)
Check inbox/ for files that have been present for more than 7 days without processing. Stale inbox items indicate pipeline neglect. Severity: WARN for >7 days, WARN for >14 days.

**7. Stale Notes** (full)
Find notes with `created` dates older than 90 days that have never been linked to by another note. These may be worth reviewing or archiving. Severity: WARN.

**8. MOC Coherence** (full)
Check MOC files for structural issues:
- MOC with >15 members — consider splitting
- MOC with <3 members — consider merging with sibling
- MOC member links that don't resolve — dangling MOC entries
Severity: WARN for size imbalances, FAIL for dangling entries.

**Report output**
Write the report to `ops/health/YYYY-MM-DD-report.md` with the following structure:

```markdown
# Vault Health Report — YYYY-MM-DD
Mode: {quick | full | three-space}

## Summary
| Category              | Status | Issues |
|-----------------------|--------|--------|
| Schema Compliance     | PASS   | 0      |
| Orphan Detection      | WARN   | 3      |
| ...                   |        |        |

## Issues

### {Category Name}
- `{file}`: {issue description}
```

Also output the summary table directly to the user after writing the file.
