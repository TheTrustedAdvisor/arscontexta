---
name: recommend
description: "Get architecture advice for your use case. Research-backed recommendations for vault configuration based on your domain."
tags:
  - architecture
  - guidance
  - methodology
---

## Skill: recommend

Delegates to: @ars-contexta:vault-architect

### Trigger

Invoke this skill when the user wants configuration advice, is unsure whether their vault is set up optimally for their use case, or wants to know what a different preset would look like for their domain.

### Behavior

**Current State Analysis**
Read and analyze:
- `ops/config.yaml` — current dimension values
- `ops/derivation.md` — original derivation rationale
- `ops/observations/` — accumulated friction and usage patterns
- `ops/health/` — most recent health report warnings

Build a picture of: what the vault was designed for vs. how it is actually being used.

**Usage Pattern Inference**
From observations and health data, infer:
- Which note types are being created most vs. least
- Which workflow steps are being skipped (no reduce entries, sparse MOC links, etc.)
- Which dimensions appear misaligned (e.g. high atomicity setting but notes are consistently long)

**Preset Comparison**
Compare the current configuration against the three standard presets:
- **Research** — atomicity 0.8+, processing 0.7+, self/ disabled
- **Personal Assistant** — mixed granularity 0.4–0.6, self/ enabled, entity navigation active
- **Experimental** — user-defined, maximum transparency

Identify which preset the current usage most resembles, and how far the configuration diverges.

**Recommendations**
Produce 2–5 specific recommendations, each with:
- The dimension or feature being recommended for change
- Current value → recommended value
- The research justification (cite specific claims or principles from the methodology corpus)
- The practical benefit the user will observe if they apply the change
- Any trade-off or cost to be aware of

Rank recommendations by expected impact.

**Next Step**
Offer two paths:
- "I can apply these changes now using `/architect`."
- "I can explain the research behind any of these in more depth using `/ask`."

Do not apply any changes from within this skill — recommend only. Changes require explicit invocation of the architect skill.
