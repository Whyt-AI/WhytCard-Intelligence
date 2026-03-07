# Installation - WhytCard Intelligence

Local install guide for the repo as it exists today.

This file distinguishes:

- official host-platform capabilities
- this repo's actual installation behavior
- community caveats that are useful in practice but not part of the official model

## Prerequisites

- Node.js in `PATH` for hook scripts and install helpers
- Cursor and/or Claude Code

## Quick install

Windows:

```powershell
.\scripts\install-plugin.ps1
```

Linux/macOS:

```bash
bash ./scripts/install-plugin.sh
```

Then reload the host tool.

## What the current scripts actually install

### Cursor

The install scripts currently do all of the following:

- copy the repo into `~/.cursor/plugins/whytcard-intelligence`
- copy `commands/*.md` into `~/.cursor/commands/`
- copy `skills/*` into `~/.cursor/skills/`
- copy `rules/*.mdc` into `~/.cursor/rules/`
- merge Cursor hooks into `~/.cursor/hooks.json`

Important implementation detail:

- `.cursor-plugin/plugin.json` declares `commands`, `skills`, and `rules`
- it does not currently declare a hooks manifest
- `hooks/hooks.cursor.json` is still the source template for Cursor hooks, but the installer merges those hooks into the user-level `~/.cursor/hooks.json`

This is a repo-specific implementation choice. Official Cursor supports plugin manifests and user/project hook configs, but this repo uses user-level Cursor hook installation for predictable local behavior.

### Claude Code

The install scripts currently do all of the following:

- copy the repo into the Cursor plugin directory above
- register `whytcard-intelligence@local` in `~/.claude/plugins/installed_plugins.json`
- enable the plugin in `~/.claude/settings.json`
- rely on `.claude-plugin/plugin.json` for Claude-facing plugin metadata
- declare Claude hooks via `.claude-plugin/plugin.json -> hooks/hooks.claude.json`

Do not describe this as symmetric with Cursor. The repo uses different wiring on each host.

## Hooks and manifests

Officially:

- Cursor supports hooks in `~/.cursor/hooks.json` and project-level `.cursor/hooks.json`, plus plugin packaging.
- Claude Code supports hooks, plugins, settings scopes, slash commands, and subagents.

In this repo:

- Cursor hook source file: `hooks/hooks.cursor.json`
- Cursor effective install target: `~/.cursor/hooks.json`
- Claude hook source file: `hooks/hooks.claude.json`
- Claude plugin manifest: `.claude-plugin/plugin.json`
- Cursor plugin manifest: `.cursor-plugin/plugin.json`

If documentation ever claims that both hosts use identical hook-manifest behavior, that documentation is wrong.

## Post-install checks

### Cursor checks

1. Enable third-party content in Cursor settings if your installation requires it.
2. Reload Cursor.
3. In chat, type `/wi` and confirm commands such as `/wi-init-project`, `/wi-brainstorm`, and `/wi-whytcard`.
4. Verify rules appear in Cursor settings.
5. Verify `~/.cursor/hooks.json` contains the WhytCard hook entries after install.

### Claude Code checks

1. Open Claude Code.
2. Verify `~/.claude/plugins/installed_plugins.json` contains `whytcard-intelligence@local`.
3. Verify `~/.claude/settings.json` has `enabledPlugins.whytcard-intelligence@local = true`.
4. Verify plugin commands/skills are available in the CLI.

## Canonical project KB behavior

`wi-init-project` creates the base scaffold:

- `.whytcard/projects/<id>/00_orchestrator/`
- `.whytcard/projects/<id>/01_foundation/steps/S001-project-scaffold/`

Real project execution then belongs under:

- `.whytcard/projects/<id>/pipeline/steps/`
- `.whytcard/projects/<id>/research/`
- `.whytcard/projects/<id>/brainstorms/`
- `.whytcard/projects/<id>/plans/`
- `.whytcard/projects/<id>/reviews/`
- `.whytcard/projects/<id>/proofs/`

Do not reintroduce legacy numbered phase folders for execution work.

## Community caveats (non-official)

These notes are useful, but they are not the primary platform model:

- Cursor community reports show intermittent Windows issues with project-level hooks. This repo avoids relying on project-level Cursor hooks and installs into `~/.cursor/hooks.json` instead.
- Claude Code community reports show cases where plugin registration and enabled state fall out of sync between `installed_plugins.json` and `settings.json`. This repo writes both files during install to reduce that failure mode.

Treat caveats as caveats. The official docs remain the source of truth.

## Troubleshooting

### Commands do not appear

1. Reload the host tool.
2. Re-run the install script.
3. Check the expected install targets listed above.

### Hooks do not run

1. Confirm Node.js is available in `PATH`.
2. Check `~/.cursor/hooks.json` for Cursor.
3. Check `.claude-plugin/plugin.json` and `~/.claude/settings.json` for Claude Code.

### Updating after repo changes

Re-run the install script. The scripts copy the current repo contents again and refresh the relevant config files.

## Language

Docs stay in English. When interacting with Jerome, the orchestrator speaks French.
