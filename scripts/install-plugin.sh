#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="whytcard-intelligence"
PROJECT_ROOT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root)
      PROJECT_ROOT="${2:-}"
      shift 2
      ;;
    *)
      printf "Unknown argument: %s\n" "$1" >&2
      exit 2
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGET_DIR="${HOME}/.cursor/plugins/${PLUGIN_NAME}"
CURSOR_COMMANDS_DIR="${HOME}/.cursor/commands"
CURSOR_SKILLS_DIR="${HOME}/.cursor/skills"
CURSOR_AGENTS_DIR="${HOME}/.cursor/agents"
CURSOR_RULES_DIR="${HOME}/.cursor/rules"
CURSOR_HOOKS_PATH="${HOME}/.cursor/hooks.json"
LEGACY_CURSOR_PLUGIN_DIR="${HOME}/.cursor/plugins/whytcardAI-plugin"
PLUGIN_MANAGED_RULE_NAMES=(
  "orchestrator-identity.mdc"
  "research-first.mdc"
  "version-check.mdc"
  "visual-verify.mdc"
  "execution-tracking.mdc"
  "brainstorm.mdc"
)

DIRS_TO_COPY=(
  ".cursor-plugin"
  "agents"
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

sync_plugin_item() {
  local src="$1"
  local target_root="$2"
  local leaf
  leaf="$(basename "${src}")"
  local destination_path="${target_root}/${leaf}"

  if [[ -e "${destination_path}" ]]; then
    rm -rf "${destination_path}" 2>/dev/null || say "  ! Could not clear existing target item (${leaf}). Will try overwrite-in-place."
  fi

  cp -R "${src}" "${target_root}/"
}

say "WhytCard Intelligence - Installation"
say "Source: ${REPO_ROOT}"
say "Target: ${TARGET_DIR}"
say ""

if ! command -v node >/dev/null 2>&1; then
  printf "ERROR: Node.js must be available in PATH. The plugin is standalone at the package level (no npm install, no extra plugin, no MCP), but Cursor hook commands still execute via node.\n" >&2
  exit 1
fi

say "[0/4] Cleaning legacy conflicting installs..."
if [[ -d "${LEGACY_CURSOR_PLUGIN_DIR}" ]]; then
  rm -rf "${LEGACY_CURSOR_PLUGIN_DIR}"
  say "  - Removed legacy plugin folder: ${LEGACY_CURSOR_PLUGIN_DIR}"
fi
say ""

say "[1/4] Copying plugin files..."
mkdir -p "${TARGET_DIR}"

for item in "${DIRS_TO_COPY[@]}"; do
  src="${REPO_ROOT}/${item}"
  if [[ -e "${src}" ]]; then
    sync_plugin_item "${src}" "${TARGET_DIR}"
    say "  + ${item}"
  fi
done

say ""
say "[1b/4] Installing Cursor commands + skills + agents..."

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

mkdir -p "${CURSOR_AGENTS_DIR}"
if [[ -d "${REPO_ROOT}/agents" ]]; then
  for legacy_agent in "${CURSOR_AGENTS_DIR}"/whytcard-*.md; do
    rm -f "${legacy_agent}" 2>/dev/null || true
    [[ -e "${legacy_agent}" ]] && say "  - Removed legacy agent: $(basename "${legacy_agent}")"
  done
  cp "${REPO_ROOT}/agents/"*.md "${CURSOR_AGENTS_DIR}/" 2>/dev/null || true
  say "  OK: Cursor agents installed to ${CURSOR_AGENTS_DIR}"
else
  say "  WARN: agents/ missing in repo; skipping global agents install"
fi

mkdir -p "${CURSOR_RULES_DIR}"
for legacy_rule in "${CURSOR_RULES_DIR}"/wc-*.mdc; do
  rm -f "${legacy_rule}" 2>/dev/null || true
  [[ -e "${legacy_rule}" ]] && say "  - Removed legacy rule: $(basename "${legacy_rule}")"
done
if [[ -f "${CURSOR_RULES_DIR}/plugins-orchestrator-global.mdc" ]]; then
  rm -f "${CURSOR_RULES_DIR}/plugins-orchestrator-global.mdc"
  say "  - Removed legacy global orchestrator rule: plugins-orchestrator-global.mdc"
fi
for rule_name in "${PLUGIN_MANAGED_RULE_NAMES[@]}"; do
  if [[ -f "${CURSOR_RULES_DIR}/${rule_name}" ]]; then
    rm -f "${CURSOR_RULES_DIR}/${rule_name}"
    say "  - Removed stale global rule mirror: ${rule_name}"
  fi
done
say "  OK: Global rule mirrors cleaned from ${CURSOR_RULES_DIR} (runtime enforcement now comes from hooks)"

shopt -u nullglob

say ""
say "[2/4] Installing global Cursor hooks..."
node "${REPO_ROOT}/scripts/install-cursor-hooks-merge.js" "${CURSOR_HOOKS_PATH}" "${PLUGIN_NAME}" "${TARGET_DIR}"
say "  OK: Cursor hooks merged into ${CURSOR_HOOKS_PATH}"

say "[3/4] Validating merged Cursor hooks..."
node "${REPO_ROOT}/scripts/validate-cursor-hooks.js" "${CURSOR_HOOKS_PATH}"
say "  OK: Cursor hooks validation passed"

if [[ -n "${PROJECT_ROOT}" ]]; then
  say "[4/4] Syncing project-local .cursor assets..."
  node "${REPO_ROOT}/scripts/sync-project-cursor.js" "${PROJECT_ROOT}"
  say "  OK: Project-local .cursor synced for ${PROJECT_ROOT}"
fi

say ""
say "Installation complete."
say ""
say "Next steps:"
say "  1. Restart Cursor (or Reload Window)"
say "  2. In Cursor chat, verify /wi-whytcard, /wi-create-step, /wi-dispatch-step, /wi-review-step, and /wi-create-agent"
say "     (WhytCard global instructions are injected by the sessionStart hook, not written into Cursor User Rules UI)"
if [[ -n "${PROJECT_ROOT}" ]]; then
  say "  3. Project-local instructions/rules/assets were also synced into .cursor/"
  say "     (Project-level active hooks are still intentionally not auto-enabled)"
  say "  4. Verify /whytcard-* agents are available for delegation"
  say "  5. In a repo, run /wi-init-project once to scaffold .whytcard/"
else
  say "  3. Verify /whytcard-* agents are available for delegation"
  say "  4. In a repo, run /wi-init-project once to scaffold .whytcard/"
fi

