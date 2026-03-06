---
name: wi-whytcard
description: Run the full WhytCard Intelligence workflow in one command. Initializes per-project KB, runs brainstorm (with research), builds an improvement pipeline, executes verifications, and produces a final codebase review. Use when the user wants "do everything in one run".
---

# WhytCard (All-in-one)

This skill is the **single entry point** that chains the core skills **in order** so the user can run one command instead of many.

## Non‑negotiables

- Do **not** ask the user questions by default.
- Proceed with explicit assumptions when something is unclear; record them in the brainstorm document.
- Ask at most one question, and only if blocked by missing credentials/prerequisites, an irreversible decision, or a critical ambiguity that would invalidate the work.
- Do not use bypasses that hide problems (no “ignore/noCheck/passWithNoTests” style shortcuts).
- Do not block on approval for reversible optimizations; escalate only irreversible or destructive decisions.

## Default scope guard (important)

Unless the user explicitly requests it, **do not implement auth/billing** (Supabase/Stripe) in this run.
Focus on making the project **build + run + lint + type-check + test** cleanly with a reproducible pipeline and evidence.

## Workflow (run sequentially)

### 0) Initialize per-project KB and pipeline scaffold

- Follow the same behavior as `wi-init-project` (idempotent).
- Confirm `.whytcard/projects/{id}/00_orchestrator/` and `01_foundation/steps/` exist.

### 1) Brainstorm (with research)

- Follow the same workflow as `wi-brainstorm`, but in **autopilot**:
  - Do not pause to ask the user to approve research axes.
  - Choose 2–4 axes yourself, run research, and converge.
- Output:
  - `.whytcard/projects/{id}/brainstorms/...`
  - `.whytcard/projects/{id}/plans/...` with a step-by-step micro-action pipeline.

### 2) Improve project (create + execute pipeline)

- Follow the same workflow as `wi-improve-project`, but in **autopilot**:
  - Do not pause for approval on reversible improvements; treat them as approved by default.
  - Escalate only irreversible or destructive changes, or when a single critical ambiguity blocks safe execution.
- Create steps under:
  - `.whytcard/projects/{id}/02_improvements/steps/`
- Execute each step with evidence captured in each step’s `evidence/` folder.

### 3) Final review (quality gate)

- Follow the same behavior as `wi-review-codebase`.
- Save:
  - `.whytcard/projects/{id}/reviews/codebase-review-{date}.md`

## Acceptance criteria

- A per-project KB exists: `.whytcard/projects/{id}/...`
- A plan exists and is actionable: `.whytcard/projects/{id}/plans/...`
- An improvements pipeline exists with at least one step when issues are found: `.whytcard/projects/{id}/02_improvements/steps/`
- A final review exists: `.whytcard/projects/{id}/reviews/codebase-review-{date}.md`
- No “hidden passes”: tests and checks are real and produce trustworthy evidence.

