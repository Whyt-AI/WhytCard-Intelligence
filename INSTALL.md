# Installation - WhytCard Intelligence

Standalone Cursor-only install guide.

Local install guide for the repo as it exists today.
For agent-driven full auto-configuration, see `AGENT.md`.

This file distinguishes:

- official host-platform capabilities
- this repo's actual installation behavior
- community caveats that are useful in practice but not part of the official model

## Prerequisites

- Cursor
- Node.js in `PATH` for hook scripts and install helpers

## Standalone meaning

For this repo, "standalone" means:

- no npm/package-manager install step
- no extra Cursor plugin dependency
- no MCP server dependency
- no external skill pack dependency
- no requirement for a pre-existing project `.cursor/`

The plugin ships all of its own commands, skills, rules, agents, hooks, and helper scripts.
The global install alone is enough for correct Cursor behavior.
Project-local `.cursor/` sync is optional.
The only runtime prerequisite beyond Cursor itself is a working `node` command in `PATH`, because the host runs the shipped JavaScript hook scripts through Node.js.

## Quick install

Windows:

```powershell
.\scripts\install-plugin.ps1
```

Windows with project-local `.cursor/` sync too:

```powershell
.\scripts\install-plugin.ps1 -ProjectRoot "C:\path\to\repo"
```

Linux/macOS:

```bash
bash ./scripts/install-plugin.sh
```

Linux/macOS with project-local `.cursor/` sync too:

```bash
bash ./scripts/install-plugin.sh --project-root "/path/to/repo"
```

Then reload the host tool.

## Conflict cleanup policy

The install scripts now proactively remove known legacy conflicts before install:

- legacy Cursor plugin folder `~/.cursor/plugins/whytcardAI-plugin`
- legacy Cursor rules matching `~/.cursor/rules/wc-*.mdc`
- legacy hook entries sourced from `whytcardAI-plugin` inside `~/.cursor/hooks.json`

This ensures only the current `whytcard-intelligence` hooks/rules stay active.

## What the current scripts actually install

The install scripts currently do all of the following for Cursor:

- copy the repo into `~/.cursor/plugins/whytcard-intelligence`
- copy `agents/*.md` into `~/.cursor/agents/`
- copy `commands/*.md` into `~/.cursor/commands/`
- copy `skills/*` into `~/.cursor/skills/`
- copy `rules/*.mdc` into `~/.cursor/rules/`
- merge Cursor hooks into `~/.cursor/hooks.json`
- validate merged hooks (event names + command targets)
- prune legacy `whytcardAI-plugin` hook entries during the merge
- optionally sync plugin-managed assets into `<repo>/.cursor/`

Important implementation detail:

- `.cursor-plugin/plugin.json` declares `commands`, `skills`, and `rules`
- it does not currently declare hooks or user-level subagents
- `hooks/hooks.cursor.json` is still the source template for Cursor hooks, but the installer merges those hooks into the user-level `~/.cursor/hooks.json`
- `agents/*.md` is the source for shipped Cursor subagents, and the installer copies them into `~/.cursor/agents/`
- `scripts/sync-project-cursor.js` can refresh a repo-local `.cursor/` tree with WhytCard-managed assets

This is a repo-specific implementation choice. Official Cursor supports plugin manifests and user/project hook configs, but this repo uses user-level Cursor hook installation for predictable standalone behavior.

## Hooks and manifests

Officially:

- Cursor supports hooks in `~/.cursor/hooks.json` and project-level `.cursor/hooks.json`, plus plugin packaging.

In this repo:

- Cursor hook source file: `hooks/hooks.cursor.json`
- Cursor effective install target: `~/.cursor/hooks.json`
- Cursor plugin manifest: `.cursor-plugin/plugin.json`
- Optional repo-local asset sync target: `<repo>/.cursor/`

Important:

- local `.cursor/` sync is for project-visible instructions, rules, commands, agents, hook templates, and helper scripts
- active hooks still stay global in `~/.cursor/hooks.json` by default
- this avoids relying on a second active hook surface in project `.cursor/hooks.json`

## Post-install checks

### Cursor checks

1. Enable third-party content in Cursor settings if your installation requires it.
2. Reload Cursor.
3. In chat, type `/wi` and confirm commands such as `/wi-init-project`, `/wi-brainstorm`, and `/wi-whytcard`.
4. In chat, type `/whytcard-` and confirm the shipped WhytCard subagents are available.
5. Verify rules appear in Cursor settings.
6. Verify `~/.cursor/hooks.json` contains the WhytCard hook entries after install.
7. Run:

```bash
node ./scripts/test-plugin.js
```
8. If you used project sync, verify the repo now has refreshed WhytCard files under `.cursor/`.
9. Optionally run:

```bash
node ./scripts/audit-standalone.js
```

This verifies that the shipped plugin still has no hidden external runtime/package dependencies or machine-specific hardcoded paths.

## Canonical project KB behavior

`wi-init-project` creates the pipeline-first scaffold:

- `.whytcard/projects/<id>/pipeline/plan.md`
- `.whytcard/projects/<id>/pipeline/state.json`
- `.whytcard/projects/<id>/pipeline/steps/S000-bootstrap-scaffold/`

Supporting project artifacts live under:

- `.whytcard/projects/<id>/pipeline/steps/`
- `.whytcard/projects/<id>/research/`
- `.whytcard/projects/<id>/brainstorms/`
- `.whytcard/projects/<id>/plans/`
- `.whytcard/projects/<id>/reviews/`
- `.whytcard/projects/<id>/proofs/`

`pipeline/` is the execution spine. Do not reintroduce legacy numbered phase folders for execution work.

## Community caveats (non-official)

These notes are useful, but they are not the primary platform model:

- Cursor community reports show intermittent Windows issues with project-level hooks. This repo avoids relying on project-level Cursor hooks and installs into `~/.cursor/hooks.json` instead.
- This does not prevent using a repo-local `.cursor/` for checked-in instructions and helper assets.
  Treat caveats as caveats. The official docs remain the source of truth.

## Troubleshooting

### Commands do not appear

1. Reload the host tool.
2. Re-run the install script.
3. Check the expected install targets listed above.

### Hooks do not run

1. Confirm Node.js is available in `PATH`.
2. Check `~/.cursor/hooks.json`.
3. Run:

```bash
node ./scripts/validate-cursor-hooks.js ~/.cursor/hooks.json
```

On Windows PowerShell:

```powershell
node .\scripts\validate-cursor-hooks.js "$env:USERPROFILE\.cursor\hooks.json"
```

### Updating after repo changes

Re-run the install script. The scripts copy the current repo contents again and refresh the relevant config files.
If you use repo-local `.cursor/` assets, either pass `-ProjectRoot/--project-root` during install or run the project sync helper again.

## Language

Docs stay in English. In chat, match the user's requested language.
