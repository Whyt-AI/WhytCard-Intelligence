# WhytCard Intelligence

AI orchestration plugin for **Cursor** and **Claude Code**.

Goal: provide an orchestrator that **decomposes**, **delegates** to specialized sub-agents, **verifies** with concrete proof, and **iterates** until the result is clean.

## Installation (Windows)

From this folder:

```powershell
.\scripts\install-plugin.ps1
```

Then in Cursor: **Ctrl+Shift+P → “Developer: Reload Window”** (or restart Cursor).

## Installation (Linux/macOS)

From this folder:

```bash
bash ./scripts/install-plugin.sh
```

Then restart Cursor (or Reload Window).

## Quick check

In Cursor chat:
- type `/wi` → you should see `/wi-brainstorm`, `/wi-add-feature`, etc.
- run `/wi-init-project` once per repo to initialize `.whytcard/projects/<id>/...`

## What the script installs (no manual steps)

The script installs:
- the plugin into `~/.cursor/plugins/whytcard-intelligence`
- Cursor **commands** into `~/.cursor/commands/` (so `/wi-*` appears)
- Cursor **skills** into `~/.cursor/skills/`
- Cursor **rules** into `~/.cursor/rules/`
- Claude enablement in `~/.claude/settings.json` + `~/.claude/plugins/installed_plugins.json`

## Language

Internal docs are in English, but when interacting with **Jerome (the repo owner)**, the orchestrator must **speak French**.

## License

MIT — see `LICENSE`.

