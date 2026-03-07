---
name: sk-wi-improve-project
description: Autonomously audit and improve an existing project. Identifies problems, prioritizes by impact, creates a fix pipeline, and executes. Use when the user wants to improve code quality, performance, or architecture.
---

# Improve Project

Mode: `autopilot-safe`

Audit the existing codebase and systematically improve it.

## Non-negotiables

- Do not stop for approval on reversible improvements.
- Ask at most one question, and only if blocked by missing prerequisites, an irreversible/destructive decision, or a critical ambiguity.
- Proceed with explicit assumptions when safe; record them in the plan/pipeline artifacts.
- If exhaustive reading was requested, list the requested corpus and do not claim full understanding until all requested items were read.

## Workflow

### 0. Ensure per-project KB structure exists

- Run the `wi-init-project` skill (idempotent; no overwrites).

### 1. Audit

Launch audit subagents in parallel (each using the relevant skill):
- **Code quality** - dead code, duplication, naming, complexity (use review-codebase skill)
- **Performance** - bottlenecks, bundle size, unnecessary re-renders (use perf-audit skill)
- **Security** - vulnerabilities, secrets, injection vectors (use security-audit skill)
- **Dependencies** - outdated, unmaintained, vulnerable packages

### 2. Prioritize

From audit results, create a prioritized list:
- **CRITICAL** - Must fix. Security vulnerabilities, broken functionality.
- **MAJOR** - Should fix. Performance bottlenecks, significant tech debt.
- **MINOR** - Nice to fix. Code style, minor optimizations.

Treat reversible improvements as approved by default. Escalate to the user only for irreversible or destructive decisions such as data/schema migrations, public API breaks, auth/billing commitments, vendor lock-in, or deletions that are hard to undo.

### 3. Create the pipeline

For each approved improvement, create a step under:

`.whytcard/projects/{id}/pipeline/steps/`

Each step is a folder `S###-<slug>/` with:
- `instruction.md`
- `acceptance.md`
- `evidence/`

Use descriptive slugs such as `S020-improvement-remove-dead-code`.

### 4. Execute

Delegate each step to an implementation subagent. Review evidence. Iterate on failure.

### 5. Verify

After all steps, run the full gate suite, save repo-level proof under `.whytcard/projects/{id}/proofs/`, and create a final review under `.whytcard/projects/{id}/reviews/`.
