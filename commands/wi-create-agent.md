---
description: "Create a reusable WhytCard subagent file. Uses sk-wi-create-agent."
disable-model-invocation: true
---

# /wi-create-agent

Mode: `autopilot-safe`

Use when no shipped specialist fits and the orchestrator needs a reusable new role in `agents/`.

Invoke `sk-wi-create-agent` and follow it exactly.

Return:

- the created or already-present agent file path
- the normalized agent name
- a reminder to reinstall the plugin so Cursor sees the new reusable agent

Non-negotiables:

- create agents only when a reusable specialization is justified
- do not create a new agent for every single step
- keep the prompt focused and concise
