---
description: "Interactive brainstorm (with research) — uses the wi-brainstorm skill."
disable-model-invocation: true
---

Invoke the `wi-brainstorm` skill and enforce its hard contract:

- Research first, then compare at least 3 approaches before any decision.
- Save research artifacts in `.whytcard/projects/{id}/research/`.
- Stress-test each approach for scale, edge cases, migration cost, rollback risk, and maintenance burden.
- Return `Rejections`, `Open questions`, and `Sources`.
- Produce the brainstorm doc and implementation plan in the project KB.
