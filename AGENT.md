# AGENT.md - Plug-and-Play Setup Runbook (Cursor Only)

This document tells an agent exactly how to configure WhytCard Intelligence in a clean, conflict-free way.

No machine-specific paths, usernames, or project-specific values are allowed.

## Goal

Deliver a fully working Cursor setup where:

- WhytCard hooks are active
- WhytCard commands/skills/rules are available
- legacy/conflicting behavior is removed
- setup is verified with evidence

## Scope

Use only generic targets:

- plugin repo root (current working directory)
- Cursor user config directory (`~/.cursor/`)
- workspace config directory (`.cursor/` in current repo)

Do not use absolute machine paths in docs, outputs, or hardcoded instructions.

## Required behavior

1. Run installation script for the current OS:
   - Windows: `./scripts/install-plugin.ps1`
   - Linux/macOS: `bash ./scripts/install-plugin.sh`
2. Enforce conflict cleanup:
   - remove legacy WhytCard plugin leftovers
   - remove legacy rules that shadow current WhytCard rules
   - ensure hooks merge keeps WhytCard hook entries active
3. Validate plugin activation artifacts:
   - `~/.cursor/hooks.json` includes WhytCard hooks
   - `~/.cursor/commands` contains `wi-*` commands
   - `~/.cursor/skills` contains `wi-*` skills
   - `~/.cursor/rules` contains WhytCard rules
4. Enforce rule activation:
   - ensure `~/.cursor/rules/orchestrator-identity.mdc` exists (installed by plugin)
   - the plugin rule has `alwaysApply: true` for global enforcement
5. Verify hook health with smoke tests:
   - `node hooks/wi-session-start.js`
   - `echo '{"prompt":"/wi-add-feature"}' | node hooks/wi-prompt-dispatch.js`
   - `echo '{"tool_name":"Edit","tool_input":{"file_path":"src/app.tsx"}}' | node hooks/wi-pre-edit-gate.js`
   - `echo '{"tool_input":{"file_path":"src/app.tsx"}}' | node hooks/wi-post-edit-verify.js`

## Optional strict mode (recommended for conflict-heavy environments)

If the user asks for strict isolation:

- disable non-essential third-party plugins in workspace `.cursor/settings.json`
- keep only plugins explicitly approved by the user
- re-run installer
- repeat smoke tests

## Completion checklist

Setup is complete only if all checks pass:

- [ ] installer executed successfully
- [ ] WhytCard hooks present in Cursor hooks config
- [ ] WhytCard rules/skills/commands present
- [ ] workspace/global rule present (orchestrator-identity.mdc with `alwaysApply: true`)
- [ ] hook smoke tests produce valid output (no missing-module or missing-file errors)
- [ ] no legacy/conflicting WhytCard artifacts remain

## Output format for the user

Return:

1. what was configured
2. what conflicts were removed
3. what was verified (with command-level evidence summary)
4. next step: reload Cursor window

Keep output concise and actionable.
