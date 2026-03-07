---
description: "Add a feature with pipeline steps and proof. Uses sk-wi-add-feature."
disable-model-invocation: true
---

# /wi-add-feature

Mode: `autopilot-safe`

Use when the user wants new functionality added to an existing project.

Invoke `sk-wi-add-feature` and follow it exactly.

Return:

- scoped execution steps in `.whytcard/projects/{id}/pipeline/steps/`
- step-local evidence in each step's `evidence/`
- repo-level verification proof in `.whytcard/projects/{id}/proofs/`

Non-negotiables:

- keep steps atomic and scoped
- use `pipeline/steps/`, not legacy phase folders
- verify the feature with real gates
- do not claim exhaustive understanding after partial reading
