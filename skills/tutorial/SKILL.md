---
name: tutorial
description: "Interactive walkthrough of the knowledge system. Learn by doing — creates sample notes, processes them, explores connections."
tags:
  - onboarding
  - learning
  - tutorial
---

## Skill: tutorial

Delegates to: @ars-contexta:knowledge-guide

### Trigger

Invoke this skill when the user wants a hands-on introduction to the vault workflow, is new to Ars Contexta, or wants to walk through the core loop with a concrete example.

### Behavior

**Resume Check**
Before starting, check for `ops/tutorial-state.yaml`. If it exists and records an incomplete step, offer to resume: "You previously completed step {N}. Resume from step {N+1}, or start over?"

**Step 1 — Create a Sample Note**
Explain the anatomy of an Ars Contexta note. Then create a real sample note in `notes/` (use a topic relevant to the user's domain from `ops/derivation-manifest.md` if available, otherwise use a neutral example).

Demonstrate:
- Prose-as-title: the title is a complete, meaningful sentence, not a label
- Description field: one sentence saying what this note establishes
- Frontmatter: `created`, `tags`, `topics`, `status: seed`
- Body: the atomic claim or idea in 2–4 sentences with supporting context

Pause and invite the user to read the note. Explain each element and why it exists.

**Step 2 — Process the Note (Reduce)**
Walk through the reduce workflow on the sample note:
- Show how to extract atomic claims from a longer source
- Demonstrate splitting: one claim per note
- Show how to write a `description` that captures the claim precisely
- Create one additional note derived from the sample to show the split in action

Explain the cognitive purpose: "Reduce forces articulation. You cannot extract what you haven't understood."

**Step 3 — Discover Connections (Reflect)**
Walk through the reflect workflow on the two notes now in the vault:
- Search for related notes by concept (demonstrate using the vault's semantic or link-based search)
- Add a `[[wiki-link]]` between the two notes where a genuine conceptual relationship exists
- Show how to update the relevant MOC to include both notes

Explain the network purpose: "Each link is a retrievable path. The value of a note grows with every connection it has."

**Step 4 — Check System Health**
Run the health check on the vault:
- Show the health report output
- Explain what each diagnostic means
- Point out that the sample notes pass the kernel primitive checks

**Completion**
Update `ops/tutorial-state.yaml` to record all steps complete with a timestamp.

Suggest the natural next step based on vault state: "You're ready to start capturing real notes. Try the reduce workflow on something you're reading or thinking about today."

### State File Format

`ops/tutorial-state.yaml`:
```yaml
version: 1
started: {ISO datetime}
completed: {ISO datetime or null}
steps:
  create-note: {done|pending}
  reduce: {done|pending}
  reflect: {done|pending}
  health: {done|pending}
```
