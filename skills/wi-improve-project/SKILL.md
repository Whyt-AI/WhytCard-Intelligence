---
name: wi-improve-project
description: Autonomously audit and improve an existing project. Identifies problems, prioritizes by impact, creates a fix pipeline, and executes. Use when the user wants to improve code quality, performance, or architecture.
---

# Improve Project

Autopilot mode. You audit the existing codebase and systematically improve it.

## Workflow

### 0. Ensure per-project KB structure exists

- Run the `wi-init-project` skill (idempotent; no overwrites).

### 1. Audit

Launch audit agents in parallel (each using the relevant skill):
- **Code quality** — dead code, duplication, naming, complexity (use review-codebase skill)
- **Performance** — bottlenecks, bundle size, unnecessary re-renders (use perf-audit skill)
- **Security** — vulnerabilities, secrets, injection vectors (use security-audit skill)
- **Dependencies** — outdated, unmaintained, vulnerable packages

### 2. Prioritize

From audit results, create a prioritized list:
- **CRITICAL** — Must fix. Security vulnerabilities, broken functionality.
- **MAJOR** — Should fix. Performance bottlenecks, significant tech debt.
- **MINOR** — Nice to fix. Code style, minor optimizations.

Present to the user for approval. They may reorder or exclude items.

### 3. Create the pipeline

For each approved improvement, create a step under:

`.whytcard/projects/{id}/02_improvements/steps/`

Each step is a folder `S###-<slug>/` with:
- `instruction.md`
- `acceptance.md`
- `evidence/`

### 4. Execute

Delegate each step to an implementation agent. Review evidence. Iterate on failure.

### 5. Verify

After all steps, run the full gate suite and a final review to confirm improvements.
