#!/usr/bin/env bash
set -euo pipefail

# Write Validate Hook — schema enforcement after file writes
# Checks YAML frontmatter against vault conventions

FILEPATH="${1:-}"

# Only validate .md files in knowledge spaces
if [[ -z "${FILEPATH}" ]] || [[ "${FILEPATH}" != *.md ]]; then
  exit 0
fi

# Skip non-note files
BASENAME=$(basename "${FILEPATH}")
if [[ "${BASENAME}" == "CLAUDE.md" ]] || [[ "${BASENAME}" == "copilot-instructions.md" ]] || [[ "${BASENAME}" == "README.md" ]]; then
  exit 0
fi

# Detect notes directory
NOTES_DIR=""
for candidate in notes reflections concepts decisions claims ideas memories; do
  if [[ -d "${candidate}" ]]; then
    NOTES_DIR="${candidate}"
    break
  fi
done

# Only validate files in notes/, self/memory/, or inbox/
IN_SCOPE=false
for scope in "${NOTES_DIR}" "self/memory" "inbox"; do
  if [[ -n "${scope}" ]] && [[ "${FILEPATH}" == ${scope}/* ]]; then
    IN_SCOPE=true
    break
  fi
done

if [[ "${IN_SCOPE}" != "true" ]]; then
  exit 0
fi

# Check for YAML frontmatter
if ! head -1 "${FILEPATH}" | grep -q "^---$"; then
  echo "⚠ Schema: ${FILEPATH} — missing YAML frontmatter (expected --- delimiter)"
  exit 0
fi

# Extract frontmatter
FRONTMATTER=$(sed -n '1,/^---$/p' "${FILEPATH}" | tail -n +2 | head -n -1)

# Check required fields
ERRORS=""
if ! echo "${FRONTMATTER}" | grep -q "^description:"; then
  ERRORS="${ERRORS}\n  - missing 'description' field"
fi
if ! echo "${FRONTMATTER}" | grep -q "^type:"; then
  ERRORS="${ERRORS}\n  - missing 'type' field"
fi
if ! echo "${FRONTMATTER}" | grep -q "^created:"; then
  ERRORS="${ERRORS}\n  - missing 'created' field"
fi

# Check description quality (not empty, not just the title)
if echo "${FRONTMATTER}" | grep -q "^description: *$"; then
  ERRORS="${ERRORS}\n  - 'description' field is empty"
fi

if [[ -n "${ERRORS}" ]]; then
  echo "⚠ Schema issues in ${FILEPATH}:${ERRORS}"
else
  echo "✓ Schema valid: ${FILEPATH}"
fi
