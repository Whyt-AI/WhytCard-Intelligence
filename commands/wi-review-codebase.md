---
description: "Review a codebase across quality, security, perf, and tests. Uses sk-wi-review-codebase."
disable-model-invocation: true
---

# /wi-review-codebase

Mode: `interactive`

Use when the user wants an audit or review instead of immediate implementation.

Invoke `sk-wi-review-codebase` and follow it exactly.

Return:

- prioritized findings
- evidence-backed reasoning
- review output in `.whytcard/projects/{id}/reviews/` when project-scoped

Non-negotiables:

- findings first, summary second
- official platform behavior and community caveats must stay separate
- do not claim exhaustive understanding after partial reading
