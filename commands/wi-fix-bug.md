---
description: "Fix a bug with repro, root cause, fix, and proof. Uses sk-wi-fix-bug."
disable-model-invocation: true
---

# /wi-fix-bug

Mode: `autopilot-safe`

Use when the user reports incorrect behavior and wants a verified fix.

Invoke `sk-wi-fix-bug` and follow it exactly.

Return:

- a bugfix step in `.whytcard/projects/{id}/pipeline/steps/`
- reproduction and validation evidence
- regression proof in `.whytcard/projects/{id}/proofs/`

Non-negotiables:

- reproduce before fixing when possible
- capture root cause, not only the symptom
- use runtime evidence, not guesswork
- do not claim exhaustive understanding after partial reading
