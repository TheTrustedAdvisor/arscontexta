---
name: pipeline
description: "End-to-end source processing: reduce → reflect → reweave → verify. Fresh context per phase for optimal LLM attention."
tags:
  - processing
  - automation
  - pipeline
---

## Skill: pipeline

Delegates to: @ars-contexta:processor

### Trigger

Invoke this skill to run the complete source-to-knowledge pipeline in a single command. Composes reduce, reflect, reweave, and verify in sequence.

### Arguments

- `<file>` — run the full pipeline for a specific source file
- `all` — run the full pipeline for all files currently in inbox/

If no argument is provided, list inbox/ contents and ask which sources to process.

### Behavior

Execute the four phases in strict sequence. Each phase runs as a separate task delegation to ensure fresh LLM context — this prevents attention degradation over long processing runs and keeps each phase focused on its specific concern.

**Phase 1: Reduce**
Delegate to reduce skill with the specified source argument.

Extract insights from source material. Create atomic notes with prose titles, YAML frontmatter, source attribution, and initial topic suggestions. Move processed sources to archive/.

Wait for completion. Collect the list of created note paths before proceeding.

**Phase 2: Reflect**
Delegate to reflect skill with `recent` (the notes just created in Phase 1).

Find connections between the new notes and the existing vault. Add typed Relevant Notes sections. Update MOCs. Flag synthesis opportunities.

Wait for completion. Collect the list of backward-link targets before proceeding.

**Phase 3: Reweave**
Delegate to reweave skill with `recent` (the connections made in Phase 2).

Update older notes with backward links to the new notes. Update descriptions where new context changes the summary. Flag MOC rebalancing needs.

Wait for completion before proceeding.

**Phase 4: Verify**
Delegate to verify skill with `recent` (all notes touched in Phases 1-3).

Run schema compliance, description quality, link health, and topics coverage checks on all notes created or modified during this pipeline run.

**Phase boundary reporting**
After each phase, output a brief status line before starting the next:
```
Phase 1 (reduce): {n} notes created from {n} sources — done
Phase 2 (reflect): {n} connections added, {n} MOCs updated — done
Phase 3 (reweave): {n} backward links added, {n} descriptions updated — done
Phase 4 (verify): {n} PASS, {n} WARN, {n} FAIL — done
```

**Final summary**
```
Pipeline complete — {YYYY-MM-DD}
Sources processed: {n}
Notes created: {n}
Connections made: {n}
Issues found: {n} (see verify output above)
```

If any verify phase produces FAIL results, surface the specific issues and suggest next steps. Do not block on warnings.
