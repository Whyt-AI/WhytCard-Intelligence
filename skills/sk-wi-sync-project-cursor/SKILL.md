---
name: sk-wi-sync-project-cursor
description: Sync WhytCard plugin-managed assets into the current repository's `.cursor/`. Use when the project needs local rules, commands, agents, hook templates, and helper scripts aligned with the installed plugin.
---

# Sync Project Cursor

Mode: `autopilot-safe`

Use this skill when the current repository should carry a local `.cursor/` mirror of the WhytCard assets, while keeping active hooks managed globally in `~/.cursor/hooks.json`.

## Action

Run the sync helper from the repo root:

```bash
node "$HOME/.cursor/plugins/whytcard-intelligence/scripts/sync-project-cursor.js" "."
```

On Windows PowerShell, the equivalent is:

```powershell
node "$env:USERPROFILE\.cursor\plugins\whytcard-intelligence\scripts\sync-project-cursor.js" "."
```

## What gets synced

- `.cursor/commands/wi-*.md`
- `.cursor/skills/sk-wi-*/`
- `.cursor/agents/whytcard-*.md`
- `.cursor/rules/*.mdc` shipped by WhytCard
- `.cursor/hooks/` templates and helper files
- `.cursor/scripts/` WhytCard helper scripts

## Important

- This sync does **not** auto-create `.cursor/hooks.json`.
- Live hooks stay in `~/.cursor/hooks.json` by default because project-level hooks are more conflict-prone on Windows.
- The goal is local project guidance and reproducible repo context, not a second active hook system.

## Acceptance

- The project has a refreshed `.cursor/` tree for WhytCard-managed assets
- The synced local files match the installed plugin version
- No claim is made that project-level active hooks were enabled unless that was explicitly requested
