# AGENT.md - Plug-and-Play Setup Runbook (Cursor Only)

This document tells an agent exactly how to configure WhytCard Intelligence in a clean, conflict-free way.

No machine-specific paths, usernames, or project-specific values are allowed.

## Goal

Deliver a fully working Cursor setup where:

- WhytCard hooks are active
- WhytCard commands/skills/agents are available
- WhytCard's orchestrator mindset is active
- legacy/conflicting behavior is removed
- setup is verified with evidence
- the plugin works as a standalone Cursor install with no extra plugin, MCP, package install, or external skill dependency

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
   - Node.js in `PATH` is the only runtime prerequisite beyond Cursor itself
2. Enforce conflict cleanup:
   - remove legacy WhytCard plugin leftovers
   - remove legacy rules that shadow current WhytCard rules
   - ensure hooks merge keeps WhytCard hook entries active
3. If the user wants repo-local Cursor assets, also sync plugin-managed files into workspace `.cursor/`:
   - commands
   - skills
   - agents
   - rules
   - hook templates and helper scripts
   - do not auto-enable project-level active hooks unless explicitly requested
4. Validate plugin activation artifacts:
   - `~/.cursor/hooks.json` includes WhytCard hooks
   - `~/.cursor/agents` contains `whytcard-*` subagents
   - `~/.cursor/commands` contains `wi-*` commands
   - `~/.cursor/skills` contains `wi-*` skills
5. Enforce rule activation:
   - ensure the installed `sessionStart` hook injects WhytCard global instructions at runtime
   - do not claim the plugin wrote Cursor UI-managed `User Rules`
   - if repo-local sync was requested, ensure `.cursor/rules/` in the repo contains the WhytCard project rules
6. Verify hook health with smoke tests:
   - `node ./scripts/test-plugin.js`
   - if it fails, inspect the failing hook directly with targeted manual input
7. Verify orchestrator posture:
   - the installed runtime rule bundle describes an orchestrator that plans, delegates, reviews, and improves the pipeline
   - the plugin is not presented as a direct-coding assistant for target project work

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
- [ ] WhytCard agents/skills/commands present
- [ ] if requested, workspace `.cursor/` refreshed with current WhytCard-managed assets
- [ ] runtime instruction bundle present through `sessionStart` hook output
- [ ] hook smoke tests produce valid output (no missing-module or missing-file errors)
- [ ] no legacy/conflicting WhytCard artifacts remain

## Output format for the user

Return:

1. what was configured
2. what conflicts were removed
3. what was verified (with command-level evidence summary)
4. next step: reload Cursor window

Keep output concise and actionable.
