---
description: "Audit security posture, secrets, and vulnerabilities. Uses wi-security-audit."
disable-model-invocation: true
---

# /wi-security-audit

Mode: `interactive`

Use when the user wants a security-oriented audit before or after implementation.

Invoke `wi-security-audit` and follow it exactly.

Return:

- prioritized security findings
- evidence for each finding
- audit output in `.whytcard/projects/{id}/reviews/` when project-scoped

Non-negotiables:

- evidence over suspicion
- separate official security guidance from community caveats
- do not claim exhaustive understanding after partial reading
