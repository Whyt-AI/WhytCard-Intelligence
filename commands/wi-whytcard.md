---
description: "Run the full WhytCard workflow end-to-end. Uses sk-wi-whytcard."
disable-model-invocation: true
---

# /wi-whytcard

Mode: `autopilot-full`

Use when the user explicitly wants the complete WhytCard pipeline in one run.

Invoke `sk-wi-whytcard` and follow it exactly.

Return:

- initialized project KB
- research, brainstorm, and plan artifacts
- execution steps in `.whytcard/projects/{id}/pipeline/steps/`
- final proof and review outputs

Non-negotiables:

- do not pause for reversible work
- escalate destructive or irreversible decisions
- use `pipeline/steps/` as the canonical execution location
- use shipped `whytcard-*` subagents as explicit delegation targets
- do not claim exhaustive understanding after partial reading
