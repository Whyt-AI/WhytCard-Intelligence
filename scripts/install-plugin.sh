#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="whytcard-intelligence"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGET_DIR="${HOME}/.cursor/plugins/${PLUGIN_NAME}"
CURSOR_COMMANDS_DIR="${HOME}/.cursor/commands"
CURSOR_SKILLS_DIR="${HOME}/.cursor/skills"
CURSOR_RULES_DIR="${HOME}/.cursor/rules"
CURSOR_HOOKS_PATH="${HOME}/.cursor/hooks.json"
LEGACY_CURSOR_PLUGIN_DIR="${HOME}/.cursor/plugins/whytcardAI-plugin"

DIRS_TO_COPY=(
  ".cursor-plugin"
  "commands"
  "rules"
  "skills"
  "hooks"
  "scripts"
  "AGENTS.md"
  "INSTALL.md"
  "README.md"
  "LICENSE"
)

say() { printf "%s\n" "$*"; }

say "WhytCard Intelligence - Installation"
say "Source: ${REPO_ROOT}"
say "Target: ${TARGET_DIR}"
say ""

say "[0/3] Cleaning legacy conflicting installs..."
if [[ -d "${LEGACY_CURSOR_PLUGIN_DIR}" ]]; then
  rm -rf "${LEGACY_CURSOR_PLUGIN_DIR}"
  say "  - Removed legacy plugin folder: ${LEGACY_CURSOR_PLUGIN_DIR}"
fi
if [[ -d "${CURSOR_RULES_DIR}" ]]; then
  shopt -s nullglob
  for legacy_rule in "${CURSOR_RULES_DIR}"/wc-*.mdc; do
    rm -f "${legacy_rule}"
    say "  - Removed legacy rule: $(basename "${legacy_rule}")"
  done
  shopt -u nullglob
  if [[ -f "${CURSOR_RULES_DIR}/plugins-orchestrator-global.mdc" ]]; then
    rm -f "${CURSOR_RULES_DIR}/plugins-orchestrator-global.mdc"
    say "  - Removed legacy global orchestrator rule: plugins-orchestrator-global.mdc"
  fi
fi
say ""

say "[1/3] Copying plugin files..."
rm -rf "${TARGET_DIR}"
mkdir -p "${TARGET_DIR}"

for item in "${DIRS_TO_COPY[@]}"; do
  src="${REPO_ROOT}/${item}"
  if [[ -e "${src}" ]]; then
    cp -R "${src}" "${TARGET_DIR}/"
    say "  + ${item}"
  fi
done

say ""
say "[1b/3] Installing Cursor commands + skills..."

shopt -s nullglob

mkdir -p "${CURSOR_COMMANDS_DIR}"
if [[ -d "${REPO_ROOT}/commands" ]]; then
  cp "${REPO_ROOT}/commands/"*.md "${CURSOR_COMMANDS_DIR}/"
  say "  OK: Cursor commands installed to ${CURSOR_COMMANDS_DIR}"
else
  say "  WARN: commands/ missing in repo; skipping global commands install"
fi

mkdir -p "${CURSOR_SKILLS_DIR}"
if [[ -d "${REPO_ROOT}/skills" ]]; then
  for skill_dir in "${REPO_ROOT}/skills/"*/; do
    name="$(basename "${skill_dir%/}")"
    dst="${CURSOR_SKILLS_DIR}/${name}"
    rm -rf "${dst}"
    cp -R "${skill_dir}" "${dst}"
  done
  say "  OK: Cursor skills installed to ${CURSOR_SKILLS_DIR}"
else
  say "  WARN: skills/ missing in repo; skipping global skills install"
fi

mkdir -p "${CURSOR_RULES_DIR}"
if [[ -d "${REPO_ROOT}/rules" ]]; then
  cp "${REPO_ROOT}/rules/"*.mdc "${CURSOR_RULES_DIR}/" 2>/dev/null || true
  say "  OK: Cursor rules installed to ${CURSOR_RULES_DIR}"
else
  say "  WARN: rules/ missing in repo; skipping global rules install"
fi

shopt -u nullglob

say ""
say "[2/3] Installing global Cursor hooks..."
node "${REPO_ROOT}/scripts/install-cursor-hooks-merge.js" "${CURSOR_HOOKS_PATH}" "${PLUGIN_NAME}" "${TARGET_DIR}"
say "  OK: Cursor hooks merged into ${CURSOR_HOOKS_PATH}"

say ""
say "Installation complete."
say ""
say "Next steps:"
say "  1. Restart Cursor (or Reload Window)"
say "  2. In Cursor chat, type / → verify /wi-* commands"
say "  3. In a repo, run /wi-init-project once to scaffold .whytcard/"

