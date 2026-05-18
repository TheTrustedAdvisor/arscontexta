---
name: reflect
description: "Find connections between notes. Update MOCs with new members. Surface synthesis opportunities."
tags:
  - processing
  - connections
  - pipeline
---

## Skill: reflect

Delegates to: @ars-contexta:processor

### Trigger

Invoke this skill when the user wants to find connections between notes, update MOCs, or run the connection phase of the pipeline. Typically follows the reduce phase.

### Arguments

- `<note>` — path to a specific note to reflect on
- `recent` — process notes created or modified in the last session (default)
- `all` — reflect on all notes in the vault (use with caution on large vaults)

If no argument is provided, use `recent`.

### Behavior

**Runtime configuration**
Read `ops/derivation-manifest.md` for vocabulary. Read `ops/config.yaml` for linking density (the `linking` dimension controls how aggressive connection-finding should be — higher values mean more connections, lower values mean only strong matches).

**For each target note:**

1. **Wiki-link graph traversal**
   Read all notes already linked to or from the target. Follow one hop to find their neighborhoods. Surface any thematic clusters.

2. **Keyword matching**
   Extract key terms from the target note's title, description, and body. Search note titles and descriptions across the vault for overlap. Minimum match threshold: 2 significant shared terms.

3. **Topic overlap**
   Check which MOCs the target note belongs to (via Topics footer). Read those MOCs to find sibling notes. Sibling notes with thematic overlap are strong candidates for explicit linking.

4. **Add Relevant Notes section**
   For each identified connection, add a typed relationship entry to the target note:
   ```
   Relevant Notes:
   - [[{related note}]] — {relationship type}: {why it relates}
   ```
   Relationship types: extends, contradicts, builds on, provides evidence for, is a special case of, challenges, applies.

5. **Update MOCs**
   Add the note to any MOCs where it clearly belongs. If no suitable MOC exists and 3+ notes share a theme, flag as a synthesis opportunity (see below).

6. **Flag synthesis opportunities**
   If 2+ notes could be merged into a richer synthesis note, log the opportunity to `ops/queue/synthesis-candidates.md` with a brief rationale. Do not merge automatically.

**Output**
Report: notes processed, connections added per note, MOCs updated, synthesis opportunities flagged.
