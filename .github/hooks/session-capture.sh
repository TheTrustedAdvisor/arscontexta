#!/usr/bin/env bash
set -euo pipefail

# Session Capture Hook — persist session state at session end
# Equivalent to OMC's Stop hook for Ars Contexta vaults

VAULT_ROOT="${PWD}"

# Only run in vault context
if [[ ! -f "${VAULT_ROOT}/ops/derivation-manifest.md" ]] && [[ ! -f "${VAULT_ROOT}/ops/derivation.md" ]]; then
  exit 0
fi

SESSION_DIR="${VAULT_ROOT}/ops/sessions"
mkdir -p "${SESSION_DIR}"

TIMESTAMP=$(date +%Y-%m-%d-%H%M)
SESSION_FILE="${SESSION_DIR}/${TIMESTAMP}.md"

# Create session log
cat > "${SESSION_FILE}" << EOF
---
date: $(date +%Y-%m-%d)
time: $(date +%H:%M)
---

# Session ${TIMESTAMP}

## Changes Made
EOF

# Capture git changes if in a repo
if git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
  CHANGED=$(git diff --name-only HEAD 2>/dev/null || true)
  if [[ -n "${CHANGED}" ]]; then
    echo '```' >> "${SESSION_FILE}"
    echo "${CHANGED}" >> "${SESSION_FILE}"
    echo '```' >> "${SESSION_FILE}"
  else
    echo "No tracked file changes this session." >> "${SESSION_FILE}"
  fi
else
  echo "Not in a git repository — manual change tracking recommended." >> "${SESSION_FILE}"
fi

echo "" >> "${SESSION_FILE}"
echo "## Session Notes" >> "${SESSION_FILE}"
echo "" >> "${SESSION_FILE}"
echo "_Auto-captured at session end. Edit to add learnings._" >> "${SESSION_FILE}"

echo "Session captured: ops/sessions/${TIMESTAMP}.md"
