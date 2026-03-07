---
description: "Resolve and dispatch the current pipeline step. Uses sk-wi-dispatch-step."
disable-model-invocation: true
---

# /wi-dispatch-step

Mode: `autopilot-safe`

Use when the orchestrator is ready to launch the current or requested pipeline step.

Invoke `sk-wi-dispatch-step` and follow it exactly.

Return:

- the resolved step id and agent
- the instruction, acceptance, and evidence paths
- the exact subagent invocation to use
- confirmation that the step state moved to `IN_PROGRESS`

Non-negotiables:

- dispatch only one bounded step at a time
- read the step contract before invoking the specialist
- keep `pipeline/state.json` in sync with the live step state
