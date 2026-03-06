---
description: "Create a new project end-to-end with pipeline and proof. Uses wi-new-project."
disable-model-invocation: true
---

# /wi-new-project

Mode: `autopilot-full`

Use when the user wants a new project scaffolded and executed with minimal interruption.

Invoke `wi-new-project` and follow it exactly.

Return:

- a project plan in `.whytcard/projects/{id}/plans/`
- execution steps in `.whytcard/projects/{id}/pipeline/steps/`
- proof and review outputs in `.whytcard/projects/{id}/proofs/` and `.whytcard/projects/{id}/reviews/`

Non-negotiables:

- initialize the base scaffold first
- keep execution traceable under `pipeline/steps/`
- validate the resulting project with real gates
- do not claim exhaustive understanding after partial reading
