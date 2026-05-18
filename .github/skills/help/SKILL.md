---
name: help
description: "Contextual guidance and command discovery. Shows available skills, agents, and intelligent suggestions based on vault state."
tags:
  - documentation
  - onboarding
  - help
---

## Skill: help

Delegates to: @ars-contexta:knowledge-guide

### Trigger

Invoke this skill when the user asks for help, doesn't know what to do next, wants to discover available commands, or is new to the vault.

### Arguments

Optional flag: `--compact` — suppress narrative, show only the command table and next-action suggestions.

### Behavior

The skill operates in one of three modes, selected automatically based on vault state:

**Narrative Mode** (first-time users: `notes/` contains fewer than 5 notes)
Give a warm, brief orientation:
- What Ars Contexta is (a research-backed, derived knowledge system)
- The core daily loop: capture → reduce → reflect → navigate
- The three spaces: `self/` (you), `notes/` (knowledge), `ops/` (system)
- What to do first: create a note or run `/setup` if the vault is not initialized

**Contextual Mode** (active vault: 5 or more notes present)
Show the full command reference alongside intelligent next-action suggestions:

1. Discover available skills by scanning `.github/skills/*/SKILL.md` and listing each by name and description.
2. Show domain-native vocabulary from `ops/derivation-manifest.md` so the user knows what terms their vault uses.
3. Analyze vault state for suggestions:
   - Count files in the inbox area — if > 5, suggest running the reduce workflow
   - Check `ops/health/` for recent warnings — surface the top issue
   - Check for notes with no outbound links — suggest a reflect session
   - If `ops/tutorial-state.yaml` exists and is incomplete, suggest resuming the tutorial

**Compact Mode** (`--compact` flag or returning user who has seen help before)
Single-screen output only:
- Command table (skill name + one-line description)
- Top 3 next-action suggestions
- No narrative, no orientation text

### Output Structure (all modes)

```
## Available Skills
{skill name} — {description}
...

## Agents
{agent name} — {one-line role summary}
...

## Suggested Next Actions
1. {action with rationale}
2. {action with rationale}
3. {action with rationale}
```

Always show the vault's domain-native vocabulary for at least one section heading if it differs from the generic defaults (e.g. "Thoughts" instead of "Notes").
