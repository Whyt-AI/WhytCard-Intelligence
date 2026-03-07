---
name: sk-wi-fix-bug
description: Autonomously diagnose and fix a bug. Reproduces the issue, identifies root cause, creates a targeted fix, and verifies with regression tests. Use when the user reports a bug or unexpected behavior.
---

# Fix Bug

Mode: `autopilot-safe`

Systematically reproduce, diagnose, fix, and prove the bug fix.

## Hard contract

- Use runtime evidence, not guesswork.
- Use official docs as the primary model for host/platform behavior.
- Keep community bug reports as caveats, not as the core model.
- If exhaustive reading was requested, list the requested corpus and do not claim full understanding until all requested items were read.
- Use `.whytcard/projects/{id}/pipeline/steps/` for real execution steps.
- The orchestrator owns reproduction strategy, step contracts, and review. Delegated specialists own diagnosis and fix attempts.

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

Delegate reproduction to `whytcard-debugger` to:
- Find the relevant code paths
- Reproduce the bug (run the code, check logs)
- Confirm the exact failure point (file:line)

### 3. Diagnose root cause

Delegate root-cause analysis to `whytcard-debugger` to:
- Trace the execution path
- Identify WHY it fails (not just WHERE)
- Check if this is a regression (was it working before?)
- Check for related issues (same pattern elsewhere?)

### 4. Fix

Create a single step in:

`.whytcard/projects/{id}/pipeline/steps/S001-bugfix-<slug>/`

- `instruction.md` - The specific fix with root cause context
- `acceptance.md` - Bug no longer reproducible + all existing tests pass + new test covering the bug
- `evidence/` - repro logs, screenshots, command outputs

Delegate the fix step to `whytcard-implementer`.
If the first fix attempt fails, update the step contract with the new diagnosis before retrying.

### 5. Verify

- Confirm the bug is fixed
- Confirm no regressions (all gates green)
- If the bug had no test coverage: the subagent must add one
- Save repo-level verification proof under `.whytcard/projects/{id}/proofs/`
- Review the final evidence with `whytcard-reviewer`
