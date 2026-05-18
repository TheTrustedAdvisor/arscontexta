---
name: rethink
description: "Challenge system assumptions. Triage accumulated observations and tensions. Propose structural changes based on friction patterns."
tags:
  - processing
  - evolution
  - pipeline
---

## Activation

This skill activates the **processor** agent in rethink mode — the meta-cognitive phase of the 6R pipeline.

**Delegates to:** @ars-contexta:processor

## Trigger

- `/rethink`
- "challenge assumptions"
- "review observations"
- "what should change"

## Behavior

1. **Read accumulated friction signals** from `ops/observations/`
2. **Identify patterns** across observations — recurring themes, repeated friction points
3. **Propose structural changes:**
   - New MOCs needed (topic clusters emerging)
   - Notes that should be split or combined
   - Dimension adjustments (from ops/config.yaml)
   - Schema additions or modifications
4. **Delegate structural changes** to @ars-contexta:vault-architect with specific recommendations
5. **Archive processed observations** that have been acted on

## When to Run

- After accumulating 5+ observations
- When health reports show recurring WARN/FAIL patterns
- When the user feels the system isn't working well
- Periodically as part of system evolution

## Output

A structured proposal of changes with research justification for each, delegated to vault-architect for execution.
