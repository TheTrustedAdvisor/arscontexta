---
name: ask
description: "Query the Ars Contexta research methodology. Answers 'why does my system do X?' with research-backed explanations from 249 interconnected claims."
tags:
  - methodology
  - research
  - learning
---

## Skill: ask

Delegates to: @ars-contexta:knowledge-guide

### Trigger

Invoke this skill when the user asks a "why" question about the system's design, wants to understand the research backing for a feature, or wants to explore the methodology behind a vault convention.

### Behavior

**Question Reception**
Accept the user's question verbatim. Examples of well-suited questions:
- "Why are note titles written as prose sentences?"
- "Why does the system use a three-space folder structure?"
- "Why is atomicity a dimension rather than a fixed rule?"
- "Why does the system recommend against folders for organization?"

**Methodology Search**
Search the methodology knowledge base in this order:
1. `ops/methodology/` — vault-local methodology notes, if present
2. The plugin's bundled reference material (the 249-claim research corpus)
3. `ops/derivation.md` — for vault-specific rationale tied to this user's derivation

Trace the answer back to specific named claims or research traditions. Do not give generic knowledge-management advice — always anchor to the specific research the system is built on.

**Answer Structure**
Structure every answer in three parts:

**The direct answer** — one or two sentences stating what the system does and why.

**The research backing** — cite the specific cognitive science finding, network theory principle, or knowledge management tradition that justifies this design. Name the claim, researcher, or framework (e.g., "Claim 47: retrieval practice strengthens memory consolidation", "Luhmann's slip-box principle of forced articulation", "small-world network theory applied to knowledge graphs").

**The practical implication** — explain what breaks if this convention is ignored, so the user understands the cost of deviation rather than just being told to comply.

**Uncertainty Handling**
If the question cannot be traced to a specific research claim, say so explicitly. Do not fabricate citations. Instead, explain what is known and suggest where the user might find a more authoritative answer.

**Follow-up**
After answering, ask: "Would you like to see related methodology claims, or does this answer your question?"
