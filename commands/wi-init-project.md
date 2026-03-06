---
description: "Initialize the per-project .whytcard scaffold. Uses wi-init-project."
disable-model-invocation: true
---

# /wi-init-project

Mode: `autopilot-safe`

Use when you need to create or repair the base `.whytcard/projects/<id>/` scaffold.

Invoke `wi-init-project` and follow it exactly.

Return:

- the resolved project id
- the created or already-present scaffold paths
- a reminder that real execution steps belong under `pipeline/steps/`

Non-negotiables:

- do not overwrite existing files
- keep `00_orchestrator/` and `01_foundation/` as the base scaffold
- use `pipeline/steps/` as the canonical execution path
- do not claim exhaustive understanding after partial reading

