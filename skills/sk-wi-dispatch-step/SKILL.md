---
name: sk-wi-dispatch-step
description: Resolve the current pipeline step into a concrete specialist dispatch. Use when the orchestrator is ready to launch exactly one bounded step.
---

# Dispatch Step

Mode: `autopilot-safe`

Use this skill when the plan exists, the step contract exists, and the next action is to launch the right specialist for one step.

## Action

From the repo root, run:

```bash
node "./scripts/wi-dispatch-step.js" "<projectId>"
```

Optional explicit step:

```bash
node "./scripts/wi-dispatch-step.js" "<projectId>" "<stepId>"
```

Then:

1. Read the resolved `instruction.md` and `acceptance.md`.
2. Mark the step in progress:

```bash
node "./scripts/wi-update-step-state.js" "<projectId>" "<stepId>" "IN_PROGRESS" "Dispatched to the assigned specialist"
```

3. Invoke the exact shipped WhytCard subagent returned by the dispatch payload.

## Rules

- Dispatch one step at a time.
- If the contract is missing, create or repair it first with `wi-create-step`.
- Do not improvise a different specialist than the one declared in the step unless you explicitly update the step contract first.

## Acceptance

- The active step is resolved deterministically
- The relevant paths are known before delegation
- `pipeline/state.json` reflects `IN_PROGRESS`
- The orchestrator has an exact subagent invocation to launch next
