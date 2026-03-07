---
name: sk-wi-whytcard
description: Run the full WhytCard Intelligence workflow in one command. Initializes per-project KB, runs brainstorm (with research), builds an improvement pipeline, executes verifications, and produces a final codebase review. Use when the user wants "do everything in one run".
---

# WhytCard (All-in-one)

Mode: `autopilot-full`

This is the single entry point that chains the core skills in order so the user can run one command instead of many.

## Non-negotiables

- Do **not** ask the user questions by default.
- Proceed with explicit assumptions when something is unclear; record them in the brainstorm document.
- Ask at most one question, and only if blocked by missing credentials/prerequisites, an irreversible decision, or a critical ambiguity that would invalidate the work.
- Do not use bypasses that hide problems (no "ignore/noCheck/passWithNoTests" style shortcuts).
- Do not block on approval for reversible optimizations; escalate only irreversible or destructive decisions.
- If exhaustive reading was requested, list the requested corpus and do not claim full understanding until all requested items were read.

## Default scope guard (important)

Unless the user explicitly requests it, **do not implement auth/billing** (Supabase/Stripe) in this run.
Focus on making the project **build + run + lint + type-check + test** cleanly with a reproducible pipeline and evidence.

## Workflow (run sequentially)

### 0) Initialize per-project KB and pipeline scaffold

- Follow the same behavior as `wi-init-project` (idempotent).
- Confirm `.whytcard/projects/{id}/pipeline/plan.md`, `.whytcard/projects/{id}/pipeline/state.json`, and `.whytcard/projects/{id}/pipeline/steps/` exist.
- Treat `.whytcard/projects/{id}/pipeline/` as the execution spine and `.whytcard/projects/{id}/pipeline/steps/` as the canonical execution location.

### Orchestrator posture

- You own `.whytcard`, the plan, the step contracts, the review, and the decision to continue.
- Your subagents own the scoped execution of each delegated micro-action.
- Default to keeping your hands off the target project's application code. Spend your creativity on better step contracts and better sequencing.

### 1) Brainstorm (with research)

- Follow the same workflow as `wi-brainstorm`, but in **autopilot**:
  - Do not pause to ask the user to approve research axes.
  - Choose 2-4 axes yourself, delegate research to `whytcard-researcher`, and converge.
- Output:
  - `.whytcard/projects/{id}/brainstorms/...`
  - `.whytcard/projects/{id}/plans/...` with a step-by-step micro-action pipeline.

### 2) Improve project (create + execute pipeline)

- Follow the same workflow as `wi-improve-project`, but in **autopilot**:
  - Do not pause for approval on reversible improvements; treat them as approved by default.
  - Escalate only irreversible or destructive changes, or when a single critical ambiguity blocks safe execution.
- Create steps under:
  - `.whytcard/projects/{id}/pipeline/steps/`
- For each step:
  - write or refine `instruction.md` and `acceptance.md`
  - resolve and mark the live step with `wi-dispatch-step`
  - delegate the step to the correct shipped subagent
  - require evidence in the step's `evidence/` folder
  - review and record the verdict with `wi-review-step`
  - if the step fails, improve the step contract before relaunching
- Save repo-level verification proof under `.whytcard/projects/{id}/proofs/`.

### 3) Final review (quality gate)

- Follow the same behavior as `wi-review-codebase`.
- Save:
  - `.whytcard/projects/{id}/reviews/codebase-review-{date}.md`

## Acceptance criteria

- A per-project KB exists: `.whytcard/projects/{id}/...`
- A plan exists and is actionable: `.whytcard/projects/{id}/plans/...`
- An execution pipeline exists with at least one step when issues are found: `.whytcard/projects/{id}/pipeline/steps/`
- A final review exists: `.whytcard/projects/{id}/reviews/codebase-review-{date}.md`
- No "hidden passes": tests and checks are real and produce trustworthy evidence.

## Delegation map

- `whytcard-researcher` - official docs, repo reading, comparisons, caveats
- `whytcard-planner` - plan synthesis, step sequencing, scope shaping
- `whytcard-implementer` - scoped code or config changes for one step
- `whytcard-reviewer` - acceptance, evidence, and quality review
- `whytcard-visual-verifier` - visual proof for UI work
- `whytcard-debugger` - reproduce failures, isolate root cause, and inform the next instruction revision

## Useful orchestration helpers

- `wi-create-step` - bootstrap a new step contract quickly
- `wi-dispatch-step` - resolve the current step into the exact specialist invocation
- `wi-review-step` - record pass/fail/block verdicts in pipeline state
- `wi-create-agent` - add a reusable specialist when the current library is insufficient

