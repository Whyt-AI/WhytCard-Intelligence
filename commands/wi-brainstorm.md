---
description: "Interactive brainstorm with research. Uses sk-wi-brainstorm."
disable-model-invocation: true
---

# /wi-brainstorm

Mode: `interactive`

Use when the user wants to explore options before committing to implementation.

Invoke `sk-wi-brainstorm` and follow it exactly.

Return:

- research artifacts in `.whytcard/projects/{id}/research/`
- a brainstorm record in `.whytcard/projects/{id}/brainstorms/`
- an implementation plan in `.whytcard/projects/{id}/plans/`

Non-negotiables:

- research first
- compare at least 3 approaches unless the user narrows scope
- separate official behavior from community caveats
- produce pipeline-ready next steps for later delegation
- do not claim exhaustive understanding after partial reading
