---
name: sk-wi-create-step
description: Create or repair a single pipeline step contract under `.whytcard/projects/<id>/pipeline/steps/`. Idempotent, no overwrites. Use when the orchestrator is ready to delegate one bounded micro-action.
---

# Create Step

Mode: `autopilot-safe`

Use this skill to reduce friction between deciding the next action and writing a clean step contract.

## What it does

It creates or repairs one step folder with:

- `instruction.md`
- `acceptance.md`
- `evidence/notes.md`
- `evidence/gate.log`

It also updates `.whytcard/projects/<projectId>/pipeline/state.json` so the pipeline knows which step is current.

## Rules

- Do **not** overwrite existing step files.
- Keep the step to one bounded micro-action.
- Prefer `whytcard-implementer` unless another shipped specialist is clearly better.
- If the project scaffold does not exist yet, initialize it first.

## Action

From the repo root, run:

```bash
node "./scripts/wi-create-step.js" "<projectId>" "<stepId>" "<slug>" "<agentName>"
```

Examples:

```bash
node "./scripts/wi-create-step.js" "my-project" "S010" "feature-login-form" "whytcard-implementer"
node "./scripts/wi-create-step.js" "my-project" "S020" "diagnose-auth-timeout" "whytcard-debugger"
```

## Acceptance

- `.whytcard/projects/<projectId>/pipeline/steps/<stepId>-<slug>/instruction.md` exists
- `.whytcard/projects/<projectId>/pipeline/steps/<stepId>-<slug>/acceptance.md` exists
- `.whytcard/projects/<projectId>/pipeline/steps/<stepId>-<slug>/evidence/` exists
- `.whytcard/projects/<projectId>/pipeline/state.json` contains the step entry
- Re-running does not overwrite existing step files
