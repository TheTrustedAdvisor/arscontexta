# Ars Contexta Methodology Reference

This directory contains the research-backed methodology that underpins every vault design decision. The methodology synthesizes five knowledge management traditions with cognitive science research.

## Five Traditions

| Tradition | Key Contribution | Primary Dimension |
|-----------|-----------------|-------------------|
| **Zettelkasten** (Luhmann) | Atomic notes, emergent structure, surprise through connection | Atomicity, Linking |
| **PARA** (Forte) | Actionability hierarchy, project-centric organization | Organization, Processing |
| **Cornell Note-Taking** (Pauk) | Reduce-Review cycle, active recall | Processing |
| **Evergreen Notes** (Matuschak) | Concept-oriented, densely linked, evolving | Linking, Maintenance |
| **GTD** (Allen) | Capture everything, process to zero, context-based action | Automation, Session |

## Cognitive Science Foundations

| Principle | Application in Ars Contexta | Source |
|-----------|---------------------------|--------|
| Extended Mind (Clark & Chalmers) | Notes as external cognitive structures | Philosophy of mind |
| Spreading Activation | Wiki-links prime related concepts | Cognitive psychology |
| Generation Effect | Reformulating (not copying) strengthens retention | Memory research |
| Context-Switching Cost (Leroy 2009) | MOCs reduce 23-minute reorientation penalty | Attention research |
| Progressive Disclosure | Description field enables filter-before-read | Information architecture |
| Closure Rituals (Newport) | Session rhythm prevents attention residue | Deep work research |

## 15 Kernel Primitives

Every generated vault enforces these invariants:

1. **markdown-yaml** — Plain text with structured metadata
2. **wiki-links** — `[[title]]` as navigable graph edges
3. **moc-hierarchy** — Hub → Domain → Topic → Notes
4. **tree-injection** — File structure at session start
5. **description-field** — ~150 char progressive disclosure
6. **topics-footer** — Bidirectional MOC navigation
7. **schema-enforcement** — Templates as single source of truth
8. **self-space** — Agent identity directory (configurable)
9. **session-rhythm** — Orient → Work → Persist
10. **semantic-search** — Meaning-based discovery (configurable)
11. **unique-addresses** — Filesystem as graph database
12. **discovery-first** — Optimized for future agent discovery
13. **operational-learning-loop** — Friction → evolution
14. **task-stack** — Note lifecycle states
15. **methodology-folder** — Vault self-knowledge

## 10 Failure Modes

| Mode | Risk | Prevention |
|------|------|-----------|
| Collector's Fallacy | Accumulating without processing | Processing pipeline, inbox monitoring |
| Orphan Drift | Unconnected notes | Reflect phase, orphan detection |
| Link Rot | Links to deleted notes | Link health checks |
| Schema Erosion | Inconsistent YAML fields | Schema enforcement hooks |
| MOC Sprawl | Too many unmaintained MOCs | MOC coherence checks |
| Verbatim Risk | Copying instead of transforming | Generation effect emphasis in reduce |
| Cognitive Outsourcing | Delegating all judgment | Human-in-the-loop design |
| Over-Automation | Encoding judgment as automation | Condition-based maintenance |
| Productivity Porn | Building system instead of using it | Minimal viable structure |
| Temporal Staleness | Content becomes outdated | Stale note detection |

## 8 Configuration Dimensions

| Dimension | Range | What It Controls |
|-----------|-------|-----------------|
| Atomicity | 0.0–1.0 | Note granularity (composite → atomic) |
| Organization | 0.0–1.0 | Folder depth (flat → hierarchical) |
| Linking | 0.0–1.0 | Connection density (implicit → explicit typed) |
| Processing | 0.0–1.0 | Pipeline depth (light → heavy) |
| Session | 0.0–1.0 | Context continuity (stateless → persistent) |
| Maintenance | 0.0–1.0 | Review automation (manual → condition-based) |
| Search | 0.0–1.0 | Discovery method (keyword → semantic) |
| Automation | 0.0–1.0 | Execution mode (guided → fully automated) |

## Interaction Constraints

Dimensions are not independent. Key couplings:

- High atomicity → requires explicit linking (isolated atoms need connections)
- High automation → requires schema enforcement (automation needs structure)
- Heavy processing → benefits from semantic search (cross-vocabulary discovery)
- Self-space enabled → increases session continuity needs

## Full Methodology

The complete 249-claim research graph is maintained in the OMC Ars Contexta plugin. Query it with `/ask` for detailed research backing on any design decision.
