---
name: sk-wi-review-step
description: Review one delegated pipeline step against its acceptance and evidence, then record the result in pipeline state. Use after a specialist returns.
---

# Review Step

Mode: `autopilot-safe`

Use this skill when a delegated step has produced changes or evidence and the orchestrator must decide whether to pass, fail, or block the step.

## Review flow

1. Read:
   - `instruction.md`
   - `acceptance.md`
   - step `evidence/`
2. Check:
   - scope respected
   - acceptance actually met
   - required evidence present
   - gates actually run
3. Decide one verdict:
   - `PASSED`
   - `FAILED`
   - `BLOCKED`

## State update

Record the result from the repo root:

```bash
node "./scripts/wi-update-step-state.js" "<projectId>" "<stepId>" "<PASSED|FAILED|BLOCKED>" "<short note>"
```

## Rules

- Do not trust success claims without named evidence.
- If the step failed because the contract was weak, say so explicitly so the orchestrator can repair `instruction.md`.
- If the step passed, the orchestrator may dispatch the next incomplete step.

## Acceptance

- The step receives an explicit verdict
- `pipeline/state.json` records that verdict
- The reason for failure or blockage is short, concrete, and reusable
- The orchestrator can decide the next move without guessing
