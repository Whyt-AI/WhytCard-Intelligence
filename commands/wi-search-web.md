---
description: "Web research (good/bad angle + data) — uses the wi-search-web skill."
disable-model-invocation: true
---

Invoke the `wi-search-web` skill and enforce its hard contract:

- Run at least 3 distinct queries: good angle, bad/community angle, data angle.
- Do not recommend anything without 1 official source, 1 bad/community source, 1 data source, and 3+ distinct sources total.
- Return explicit `Confidence: HIGH|MEDIUM|LOW`.
- Return explicit `Unknowns`.
- Return a final `Sources` list.
- If in project context, save the research in `.whytcard/projects/{id}/research/`.
