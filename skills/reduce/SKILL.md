---
name: reduce
description: "Extract insights from source material. Creates atomic notes with prose titles, YAML frontmatter, and source attribution."
tags:
  - processing
  - extraction
  - pipeline
---

## Skill: reduce

Delegates to: @ars-contexta:processor

### Trigger

Invoke this skill when the user wants to process source material from the inbox, extract insights, or run the extraction phase of the pipeline.

### Arguments

- `<file>` — path to a specific source file in inbox/
- `all` — process all files currently in inbox/

If no argument is provided, list the contents of inbox/ and ask the user which sources to process.

### Behavior

**Runtime configuration**
Before processing, read `ops/derivation-manifest.md` for vocabulary mappings:
- `vocabulary.notes` — notes folder name
- `vocabulary.inbox` — inbox folder name
- `vocabulary.note` — note type name
- `vocabulary.topic_map` — MOC references

If the manifest does not exist, use universal defaults: notes/, inbox/, "note", "topic map".

**Processing each source**
For each source file:

1. Read the full source content
2. Identify discrete insights worth keeping (avoid the Collector's Fallacy — not everything needs a note)
3. For each insight, create an atomic note:

   **Title (prose-as-title)**
   Write the title as a proposition or claim, not a noun phrase. Apply the composability test: `since [[title]]` must read naturally as a sentence fragment. Example: "Spaced repetition outperforms massed practice for long-term retention" passes; "Spaced Repetition" fails.

   **YAML frontmatter**
   ```yaml
   ---
   description: {~150 chars, adds information beyond the title}
   type: {claim | pattern | preference | fact | decision | question}
   created: {YYYY-MM-DD}
   ---
   ```

   **Body (150-400 words)**
   Write in prose with connective words that show reasoning (because, therefore, however, which means). Not a summary — your own synthesis of why this insight matters.

   **Source attribution**
   ```
   Source: [[{source filename without extension}]]
   ```

   **Topic suggestions**
   Add 1-3 initial topic links as candidates for MOC placement. These will be confirmed during the reflect phase.

4. Save the note to the domain notes folder (e.g., notes/, reflections/, concepts/)
5. Move the processed source to archive/
6. Log the created note paths for the reflect phase

**Quality gates (check each note before saving)**
- Title passes composability test: `since [[title]]` reads naturally
- Description is ~150 chars and differs meaningfully from the title
- Body is 150-400 words with connective reasoning language
- Source is attributed
- At least one topic suggestion is present

**Output**
Report: number of sources processed, number of notes created, list of note titles, any sources skipped and why.
