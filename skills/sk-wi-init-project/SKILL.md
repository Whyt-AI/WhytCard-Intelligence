---
name: sk-wi-init-project
description: Create (or repair) a per-project `.whytcard/projects/<id>/...` scaffold that gets filled during discussion. Idempotent, no overwrites.
---

# Init Project Knowledge Base (KB)

This skill initializes the canonical WhytCard project structure inside the current repo.

## Canonical layout

Base scaffold guaranteed by `wi-init-project`:

- `.whytcard/projects/<projectId>/00_orchestrator/`
- `.whytcard/projects/<projectId>/01_foundation/steps/S001-project-scaffold/`

Canonical working directories for real project work:

- `.whytcard/projects/<projectId>/pipeline/steps/`
- `.whytcard/projects/<projectId>/research/`
- `.whytcard/projects/<projectId>/brainstorms/`
- `.whytcard/projects/<projectId>/plans/`
- `.whytcard/projects/<projectId>/reviews/`
- `.whytcard/projects/<projectId>/proofs/`

Important:

- `wi-init-project` must not overwrite existing work.
- The current script guarantees only the base scaffold above.
- Later skills and workflows create missing canonical working directories on demand.
- `pipeline/steps/` is the canonical execution location. Do not introduce legacy numbered phase folders for execution work.

## Rules

- Do **not** overwrite existing files.
- Keep content **generic** (no product/business content inside templates).
- If `.whytcard/` already exists, only add missing parts.

## Action

From the repo root, run one of the following:

Directly from this repo:

```bash
node "./scripts/wi-init-project.js"
```

Optional explicit project id:

```bash
node "./scripts/wi-init-project.js" "my-project"
```

Installed plugin on Windows:

```powershell
node "$env:USERPROFILE\.cursor\plugins\whytcard-intelligence\scripts\wi-init-project.js"
```

Installed plugin on Windows with explicit project id:

```powershell
node "$env:USERPROFILE\.cursor\plugins\whytcard-intelligence\scripts\wi-init-project.js" "my-project"
```

## Acceptance

- `.whytcard/projects/<projectId>/00_orchestrator/master_plan.md` exists
- `.whytcard/projects/<projectId>/00_orchestrator/state_machine.json` exists (valid JSON)
- `.whytcard/projects/<projectId>/01_foundation/steps/S001-project-scaffold/{instruction.md,acceptance.md}` exists
- The docs and later workflows treat `pipeline/steps/`, `research/`, `brainstorms/`, `plans/`, `reviews/`, and `proofs/` as canonical locations
- Re-running does not overwrite existing files

