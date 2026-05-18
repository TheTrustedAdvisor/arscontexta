#!/usr/bin/env bash
set -euo pipefail

# Session Orient Hook — inject vault tree and identity at session start
# Equivalent to OMC's SessionStart hook for Ars Contexta vaults

VAULT_ROOT="${PWD}"

# Detect if we're in a vault (look for ops/derivation-manifest.md or ops/derivation.md)
if [[ ! -f "${VAULT_ROOT}/ops/derivation-manifest.md" ]] && [[ ! -f "${VAULT_ROOT}/ops/derivation.md" ]]; then
  exit 0
fi

echo "# Ars Contexta Vault — Session Orient"
echo ""

# Inject vault tree (depth-limited to avoid noise)
echo "## Vault Structure"
echo '```'
if command -v tree &>/dev/null; then
  tree -L 2 --noreport -I 'node_modules|.git|.omc|.claude|.github' "${VAULT_ROOT}" 2>/dev/null || find "${VAULT_ROOT}" -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' | head -60
else
  find "${VAULT_ROOT}" -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.omc/*' | sort | head -60
fi
echo '```'
echo ""

# Load identity if self/ is enabled
if [[ -d "${VAULT_ROOT}/self" ]]; then
  echo "## Agent Identity"
  for f in identity.md methodology.md goals.md; do
    if [[ -f "${VAULT_ROOT}/self/${f}" ]]; then
      echo "### ${f}"
      cat "${VAULT_ROOT}/self/${f}"
      echo ""
    fi
  done
fi

# Surface reminders
if [[ -f "${VAULT_ROOT}/ops/reminders.md" ]]; then
  REMINDER_COUNT=$(grep -c "^- " "${VAULT_ROOT}/ops/reminders.md" 2>/dev/null || echo "0")
  if [[ "${REMINDER_COUNT}" -gt 0 ]]; then
    echo "## Active Reminders (${REMINDER_COUNT})"
    cat "${VAULT_ROOT}/ops/reminders.md"
    echo ""
  fi
fi

# Surface health warnings from most recent report
LATEST_HEALTH=$(find "${VAULT_ROOT}/ops/health/" -name "*.md" -type f 2>/dev/null | sort -r | head -1)
if [[ -n "${LATEST_HEALTH}" ]]; then
  FAIL_COUNT=$(grep -c "FAIL" "${LATEST_HEALTH}" 2>/dev/null || echo "0")
  WARN_COUNT=$(grep -c "WARN" "${LATEST_HEALTH}" 2>/dev/null || echo "0")
  if [[ "${FAIL_COUNT}" -gt 0 ]] || [[ "${WARN_COUNT}" -gt 0 ]]; then
    echo "## Health Signals"
    echo "Latest report: $(basename "${LATEST_HEALTH}") — ${FAIL_COUNT} FAIL, ${WARN_COUNT} WARN"
    echo "Run \`/health full\` for details."
    echo ""
  fi
fi

# Quick vault stats
NOTES_DIR=""
for candidate in notes reflections concepts decisions claims ideas memories; do
  if [[ -d "${VAULT_ROOT}/${candidate}" ]]; then
    NOTES_DIR="${candidate}"
    break
  fi
done

if [[ -n "${NOTES_DIR}" ]]; then
  NOTE_COUNT=$(find "${VAULT_ROOT}/${NOTES_DIR}" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
  INBOX_COUNT=0
  for inbox_candidate in inbox journal encounters; do
    if [[ -d "${VAULT_ROOT}/${inbox_candidate}" ]]; then
      INBOX_COUNT=$(find "${VAULT_ROOT}/${inbox_candidate}" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
      break
    fi
  done
  echo "## Quick Stats"
  echo "- ${NOTES_DIR}/: ${NOTE_COUNT} notes"
  echo "- inbox: ${INBOX_COUNT} items pending"
  echo ""
fi

echo "Session rhythm: **Orient** → Work → Persist"
