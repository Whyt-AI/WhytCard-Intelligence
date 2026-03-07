---
description: "Review a delegated pipeline step and record pass/fail. Uses sk-wi-review-step."
disable-model-invocation: true
---

# /wi-review-step

Mode: `autopilot-safe`

Use when a delegated step has returned and the orchestrator must decide pass/fail before moving on.

Invoke `sk-wi-review-step` and follow it exactly.

Return:

- the reviewed step id
- pass or fail verdict
- missing proof or blockers if any
- confirmation that `pipeline/state.json` was updated to `PASSED`, `FAILED`, or `BLOCKED`

Non-negotiables:

- do not trust the delegated agent on its own
- compare evidence against `acceptance.md`
- record the result in `pipeline/state.json` before continuing
