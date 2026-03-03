---
name: wi-fix-bug
description: Autonomously diagnose and fix a bug. Reproduces the issue, identifies root cause, creates a targeted fix, and verifies with regression tests. Use when the user reports a bug or unexpected behavior.
---

# Fix Bug

Autopilot mode. You systematically find and fix the bug.

## Workflow

### 0. Ensure per-project KB structure exists

- Run the `wi-init-project` skill (idempotent; no overwrites).

### 1. Gather context

From the user's report, extract:
- What's the expected behavior?
- What's the actual behavior?
- Steps to reproduce (if provided)
- Error messages or stack traces (if any)

### 2. Reproduce

Launch a diagnostic agent to:
- Find the relevant code paths
- Reproduce the bug (run the code, check logs)
- Confirm the exact failure point (file:line)

### 3. Diagnose root cause

Launch an analysis agent to:
- Trace the execution path
- Identify WHY it fails (not just WHERE)
- Check if this is a regression (was it working before?)
- Check for related issues (same pattern elsewhere?)

### 4. Fix

Create a single step in:

`.whytcard/projects/{id}/02_bugfix/steps/S001-<slug>/`

- `instruction.md` — The specific fix with root cause context
- `acceptance.md` — Bug no longer reproducible + all existing tests pass + new test covering the bug
 - `evidence/` — repro logs, screenshots, command outputs

Delegate to an implementation agent.

### 5. Verify

- Confirm the bug is fixed
- Confirm no regressions (all gates green)
- If the bug had no test coverage: the agent must add one
