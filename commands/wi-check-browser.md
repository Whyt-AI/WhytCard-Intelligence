---
description: "Run visual browser verification with screenshots and checks. Uses wi-check-browser."
disable-model-invocation: true
---

# /wi-check-browser

Mode: `interactive`

Use when UI work needs visual verification.

Invoke `wi-check-browser` and follow it exactly.

Return:

- screenshots at the required viewports
- dark and light mode observations when relevant
- any browser-console issues that affect confidence

Non-negotiables:

- verify the real UI, not a claimed state
- save proof under `.whytcard/projects/{id}/proofs/` when project-scoped
- do not claim exhaustive understanding after partial reading
