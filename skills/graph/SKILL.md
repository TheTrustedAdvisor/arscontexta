---
name: graph
description: "Analyze the vault's knowledge graph. Subcommands: orphans, density, bridges, synthesis, traverse, clusters, stats."
tags:
  - analysis
  - graph
  - connections
---

## Skill: graph

Delegates to: @ars-contexta:graph-analyst

### Trigger

Invoke this skill for structural analysis of the vault's knowledge graph. Where `health` checks correctness, `graph` reveals topology, centrality, and emergent structure.

### Arguments

- `orphans` — find notes with zero incoming links
- `density` — compute link metrics across the vault
- `bridges` — find high-betweenness notes (critical connectors)
- `synthesis` — surface connection opportunities between unlinked but related notes
- `traverse <note>` — explore the 2-hop neighborhood of a specific note
- `clusters` — detect topic groupings from link density
- `stats` — overall graph metrics summary

If no argument is provided, run `stats`.

### Behavior

Use ripgrep as the primary query engine for all graph operations. Build link maps by grepping for `[[` patterns across the vault.

**Subcommand: orphans**
Find all notes in the domain notes folder. For each, check whether any other note contains `[[{note title}]]`. Notes with zero incoming references are orphans. Report the full list with note title and creation date. Notes in self/ and ops/ are excluded from orphan analysis.

**Subcommand: density**
Compute:
- Total notes in vault
- Total wiki-links (outgoing)
- Average outgoing links per note
- Average incoming links per note
- Median outgoing links
- Notes with zero outgoing links (no connections made)
- Notes with zero incoming links (orphans, see above)
- Link density ratio: total links / (n × (n-1)) where n = note count

**Subcommand: bridges**
Find notes with high betweenness centrality: notes that appear on many shortest paths between other notes. Approximate via incoming link count × unique referencing notes. High-betweenness notes are structural dependencies — if removed, the graph would fragment. List the top 10 by estimated betweenness.

**Subcommand: synthesis**
Find pairs or clusters of notes that share significant keyword overlap but have no wiki-link between them. These are candidates for explicit connection or synthesis. Use ripgrep to extract key terms from titles and descriptions, then find unlinked note pairs with ≥3 shared significant terms. Report top 10 opportunities with explanation of the shared theme.

**Subcommand: traverse `<note>`**
Map the 2-hop neighborhood of the specified note:
- Hop 0: the note itself
- Hop 1: all notes the target links to + all notes that link to the target
- Hop 2: all notes connected to hop-1 nodes (excluding already-listed)

Output as a structured list with relationship direction indicated. Cap at 50 nodes to keep output readable.

**Subcommand: clusters**
Detect emergent topic groupings by link density. Notes that are densely interconnected among themselves and sparsely connected to other groups form a cluster. Approximate via MOC co-membership combined with direct link overlap. Report clusters with member count and a suggested cluster label derived from member titles.

**Subcommand: stats**
Print a one-page overview:
```
Knowledge Graph Stats — {YYYY-MM-DD}

Notes:        {n} total, {n} in notes/, {n} in self/, {n} in ops/
Links:        {n} total wiki-links, {avg} per note
Orphans:      {n} notes ({pct}%) with zero incoming links
Top hubs:     {top 5 notes by incoming link count}
MOCs:         {n} topic maps, avg {n} members each
Clusters:     {n} detected
Graph age:    oldest note {date}, newest note {date}
```
