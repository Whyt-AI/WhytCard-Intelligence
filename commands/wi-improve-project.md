---
description: "Improve a project with audit, plan, fixes, and proof. Uses wi-improve-project."
disable-model-invocation: true
---

# /wi-improve-project

Mode: `autopilot-safe`

Use when the user wants the existing project audited and improved.

Invoke `wi-improve-project` and follow it exactly.

Return:

- prioritized improvement steps in `.whytcard/projects/{id}/pipeline/steps/`
- review output in `.whytcard/projects/{id}/reviews/`
- repo-level proof in `.whytcard/projects/{id}/proofs/`

Non-negotiables:

- prioritize by impact
- treat reversible improvements as safe by default
- keep official behavior separate from caveats
- do not claim exhaustive understanding after partial reading
