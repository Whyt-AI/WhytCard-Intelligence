---
name: wi-init-project
description: Create (or repair) a per-project `.whytcard/projects/<id>/...` scaffold that gets filled during discussion. Idempotent, no overwrites.
---

# Init Project Knowledge Base (KB)

This sets up the canonical WhytCard project structure inside the **current repo**:

`.whytcard/projects/<projectId>/00_orchestrator/*` + phase steps under `01_foundation/steps/*`.

## Rules

- Do **not** overwrite existing files.
- Keep content **generic** (no product/business content inside templates).
- If `.whytcard/` already exists, only add missing parts.

## Action

From the repo root, run:

```powershell
node "$env:USERPROFILE\.cursor\plugins\whytcard-intelligence\scripts\wi-init-project.js"
```

Optional: specify an explicit project id/slug:

```powershell
node "$env:USERPROFILE\.cursor\plugins\whytcard-intelligence\scripts\wi-init-project.js" "my-project"
```

## Acceptance

- `.whytcard/projects/<projectId>/00_orchestrator/master_plan.md` exists
- `.whytcard/projects/<projectId>/00_orchestrator/state_machine.json` exists (valid JSON)
- `.whytcard/projects/<projectId>/01_foundation/steps/S001-project-scaffold/{instruction.md,acceptance.md}` exists
- Re-running does not overwrite existing files

