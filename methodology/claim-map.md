# Claim Map — Key Research Claims

This maps the most frequently referenced research claims to the vault features they support. For the full 249-claim graph, use `/ask`.

## Foundation Claims

### Cognitive Offloading
**Claim:** External structures extend thinking beyond context window limits.
**Source:** Clark & Chalmers, Extended Mind thesis
**Supports:** markdown-yaml primitive, note creation as cognitive act
**Implication:** Notes are not documentation — they are thinking made durable.

### Spreading Activation
**Claim:** Reading one concept primes related concepts through explicit connections.
**Source:** Cognitive psychology, network priming research
**Supports:** wiki-links primitive, reflect phase, connection discovery
**Implication:** Dense, typed links are not metadata overhead — they are the retrieval mechanism.

### Context-Switching Cost
**Claim:** Interrupted work requires ~23 minutes to return to original cognitive state.
**Source:** Leroy (2009), attention residue research
**Supports:** moc-hierarchy primitive, session-rhythm
**Implication:** MOCs are not organizational sugar — they prevent the 23-minute penalty by presenting topic state immediately.

### Generation Effect
**Claim:** Reformulating information in your own words strengthens retention and understanding.
**Source:** Memory research, active recall studies
**Supports:** reduce phase (extract, don't copy), prose-as-title convention
**Implication:** Verbatim extraction is a failure mode, not a shortcut.

### Progressive Disclosure
**Claim:** Presenting information in layers reduces cognitive load and enables efficient filtering.
**Source:** Information architecture, UX research
**Supports:** description-field primitive, MOC hierarchy, three query levels
**Implication:** Title → description → body is a deliberate attention funnel, not formatting convention.

## Processing Claims

### Closure Rituals
**Claim:** Explicitly closing work sessions prevents attention residue from carrying over.
**Source:** Newport, Deep Work
**Supports:** session-rhythm (persist phase), session-capture hook
**Implication:** "Orient → Work → Persist" is not workflow advice — it's attention hygiene.

### Desirable Difficulty
**Claim:** Effortful processing leads to better learning than easy processing.
**Source:** Bjork & Bjork, learning research
**Supports:** reduce phase requiring transformation, composability test
**Implication:** The composability test (`since [[title]]`) forces reformulation, which strengthens understanding.

### Small-World Networks
**Claim:** Networks with high clustering and short path lengths enable efficient information retrieval.
**Source:** Watts & Strogatz, network theory
**Supports:** MOC hierarchy + wiki-links creating small-world topology
**Implication:** The combination of hierarchical MOCs (clustering) and cross-topic links (short paths) is not accidental — it's the optimal graph topology for knowledge retrieval.

## Architecture Claims

### Three-Space Separation
**Claim:** Mixing durable knowledge with operational scaffolding degrades both.
**Source:** PARA (Forte) + empirical failure mode analysis
**Supports:** three-spaces architecture (self/notes/ops)
**Implication:** ops/ is not a junk drawer — it's the immune system that keeps notes/ clean.

### Discovery Compounding
**Claim:** The value of a note increases with the probability of future discovery.
**Source:** Knowledge management, information retrieval theory
**Supports:** discovery-first primitive, description quality, MOC membership
**Implication:** An undiscoverable note has negative value — it consumed creation effort without future benefit.
