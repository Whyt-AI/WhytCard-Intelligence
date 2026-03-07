---
description: "Run structured web research with official docs, caveats, and data. Uses wi-search-web."
disable-model-invocation: true
---

# /wi-search-web

Mode: `interactive`

Use when you need current external information before making a decision.

Invoke `wi-search-web` and follow it exactly.

Return:

- at least one official source
- clearly separated non-official caveats
- explicit confidence, unknowns, and source list
- research output in `.whytcard/projects/{id}/research/` when project-scoped

Non-negotiables:

- official docs first
- community findings must remain labeled as caveats
- no recommendation without evidence
- do not claim exhaustive understanding after partial reading
