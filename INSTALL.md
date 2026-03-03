# Installation — WhytCard Intelligence

AI orchestration plugin for **Cursor** and **Claude Code**. This guide covers local installation (no marketplace publishing).

---

## Prerequisites

- **Node.js** (required for hooks)
- **Cursor** and/or **Claude Code**

---

## Quick install (Windows)

From the `WhytCard-Intelligence` folder:

```powershell
.\scripts\install-plugin.ps1
```

Then **restart Cursor** (or Reload Window: `Ctrl+Shift+P` → "Developer: Reload Window").

## Quick install (Linux/macOS)

From the `WhytCard-Intelligence` folder:

```bash
bash ./scripts/install-plugin.sh
```

Then restart Cursor (or Reload Window).

### What the script does (important)

The script installs everything so Cursor detects it **without manual steps**:

- Copy plugin into: `~/.cursor/plugins/whytcard-intelligence`
- Install Cursor **commands** into: `~/.cursor/commands/` (so `/wi-*` appears)
- Install Cursor **skills** into: `~/.cursor/skills/`
- Install Cursor **rules** into: `~/.cursor/rules/`
- Install **global Cursor hooks** into: `~/.cursor/hooks.json` (so the orchestrator gates run everywhere)

Note: The plugin does **not** rely on Cursor plugin-level hooks (`$CURSOR_PLUGIN_ROOT`) to avoid environment issues on Windows. Global hooks use absolute paths.

### Technical notes (Cursor vs Claude)

- **Cursor** reads hooks declared in `.cursor-plugin/plugin.json` (here: `hooks/hooks.cursor.json`).
- **Claude Code** reads hooks declared in `.claude-plugin/plugin.json` (here: `hooks/hooks.claude.json`).

Goal: avoid environment variable issues (`$CURSOR_PLUGIN_ROOT` vs `$CLAUDE_PLUGIN_ROOT`).

---

## Post-install checks

### 1. “Third-party plugins” setting

Cursor must allow third-party plugins:

- **Settings** → **Features** → **Include third-party Plugins, Skills, and other configs** = **ON**

If disabled, the plugin’s commands and skills won’t appear.

### 2. Available commands

In Cursor chat, type `/` and verify:

- `/wi-whytcard` (one-shot workflow: init → brainstorm → improve → review)
- `/wi-init-project` (creates `.whytcard/projects/<id>/...`)
- `/wi-brainstorm`
- `/wi-add-feature`
- `/wi-fix-bug`
- `/wi-research-stack`
- etc.

### 3. Rules

Rules (`.mdc`) should appear in **Settings** → **Rules** with the plugin prefix.

---

## Claude Code (CLI)

The plugin is shared via `~/.claude/`. If Cursor is already configured, Claude Code uses the same installation.

To install only for Claude Code (without Cursor):

```powershell
.\scripts\install-plugin.ps1
```

Puis dans Claude Code :

```
/plugin
```

Tab **Installed** → `whytcard-intelligence@local` should be listed and enabled.

---

## Troubleshooting

### Commands don’t show up

1. Ensure “Include third-party Plugins…” is enabled.
2. Re-run the install script and restart/reload Cursor.
3. Verify `~/.claude/plugins/installed_plugins.json` contains `whytcard-intelligence@local` with the correct `installPath`.

### Hook errors

Hooks use `$CLAUDE_PLUGIN_ROOT` (Claude) or `$CURSOR_PLUGIN_ROOT` (Cursor). If not defined, the plugin falls back to `__dirname`. Ensure Node.js is in `PATH`.

### Updating after plugin changes

Re-run the install script to copy updated files:

```powershell
.\scripts\install-plugin.ps1
```

---

## Publishing (optional)

To distribute via official marketplaces:

## Language

Docs are written in English, but when interacting with **Jerome**, the orchestrator must **speak French**.

- **Cursor** : [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish)
- **Claude** : [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)
