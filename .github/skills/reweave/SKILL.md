---
name: reweave
description: "Update older notes with context from newer ones. The backward pass that keeps the knowledge graph current."
tags:
  - processing
  - connections
  - pipeline
---

## Skill: reweave

Delegates to: @ars-contexta:processor

### Trigger

Invoke this skill to run the backward pass: updating older notes with links to newer notes that connect to them. Typically follows the reflect phase.

### Arguments

- `<note>` — run the backward pass for connections originating from a specific note
- `recent` — process backward links for all notes connected during the last reflect run (default)

If no argument is provided, use `recent`.

### Behavior

**What reweave solves**
The reflect phase adds outgoing links from new notes to existing ones. But the older notes don't yet know about the newer notes. Reweave closes this gap: if note A now links to older note B, note B should also link back to note A. Without this backward pass, the knowledge graph becomes directionally biased toward older material.

**Runtime configuration**
Read `ops/derivation-manifest.md` for vocabulary. Read `ops/queue/` for the list of notes that were connected during the most recent reflect phase.

**For each recently connected note:**

1. Identify all older notes it links to via its Relevant Notes section
2. For each older note:
   - Read the older note in full
   - Check whether it already references the newer note (skip if so)
   - Add a backward link in the older note's Relevant Notes section:
     ```
     - [[{newer note}]] — {inverse relationship type}: {why it relates}
     ```
     Use the inverse of the forward relationship type (e.g., if the new note "extends" the old one, the old note is "extended by" the new one)
   - If the new note's existence changes the meaning or scope of the older note's description, update the description to reflect the broader context. Keep changes minimal — only update if the description is now materially misleading.

3. **MOC rebalancing check**
   After adding backward links, check whether any MOC now has an imbalanced member count:
   - A MOC with >15 members may need splitting into sub-topics
   - A MOC with <3 members may need merging with a sibling topic
   Flag imbalances to `ops/queue/moc-rebalancing.md` but do not restructure automatically — delegate to @ars-contexta:vault-architect if rebalancing is needed.

**Output**
Report: older notes updated, backward links added, descriptions updated, MOC rebalancing flags raised.
