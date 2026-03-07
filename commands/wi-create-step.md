---
description: "Create or repair one pipeline step scaffold. Uses sk-wi-create-step."
disable-model-invocation: true
---

# /wi-create-step

Mode: `autopilot-safe`

Use when the orchestrator needs a new step contract under `.whytcard/projects/<id>/pipeline/steps/`.

Invoke `sk-wi-create-step` and follow it exactly.

Return:

- the resolved project id and step id
- the step path that was created or repaired
- the files created or already present
- confirmation that `pipeline/state.json` was updated

Non-negotiables:

- do not overwrite existing step contracts
- keep one micro-action per step
- keep the step scoped and reviewable
- treat `pipeline/state.json` as the execution state source of truth
