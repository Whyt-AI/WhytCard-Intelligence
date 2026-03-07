---
description: "Sync WhytCard plugin-managed assets into the current project's `.cursor/`. Uses sk-wi-sync-project-cursor."
disable-model-invocation: true
---

# /wi-sync-project-cursor

Mode: `autopilot-safe`

Use when the current repo should receive the local `.cursor/` rules, commands, agents, hooks templates, and helper scripts shipped by WhytCard Intelligence.

Invoke `sk-wi-sync-project-cursor` and follow it exactly.

Return:

- the synced project root
- the `.cursor/` paths that were refreshed
- a reminder that active hooks still stay user-global by default

Non-negotiables:

- keep global active hooks in `~/.cursor/hooks.json` unless the user explicitly wants project-level hook wiring
- sync only plugin-managed `.cursor/` assets, not arbitrary project files
