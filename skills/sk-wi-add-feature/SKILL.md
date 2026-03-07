---
name: sk-wi-add-feature
description: Autonomously add a feature to an existing project. Analyzes impact, decomposes into micro-actions, implements step by step, and reviews. Use when the user wants to add functionality to existing code.
---

# Add Feature

Mode: `autopilot-safe`

Analyze, decompose, implement, and verify the feature without repeated approval for reversible work.

## Hard contract

- Use official docs as the primary product/platform model.
- Use community findings only as caveats.
- If exhaustive reading was requested, list the requested corpus and do not claim full understanding until all requested items were read.
- Use `.whytcard/projects/{id}/pipeline/steps/` for real execution steps.
- You own the pipeline contracts. The subagent owns the step execution.

## Workflow

### 0. Ensure per-project KB structure exists

- Run the `wi-init-project` skill (idempotent; no overwrites).

### 1. Understand the feature

From the user's request, extract:
- What should the feature do? (behavior)
- Where does it fit in the existing architecture? (location)
- What existing code does it interact with? (dependencies)

### 2. Impact analysis

Delegate impact analysis to `whytcard-researcher` to:
- Read the relevant parts of the codebase
- Identify files that will need modification
- Check for existing patterns to follow
- Identify potential conflicts or side effects

### 3. Decompose

Break the feature into atomic micro-actions. Each action:
- Has one verb (create, modify, connect, test)
- Has explicit scope (exact files)
- Has testable acceptance criteria

### 4. Create the pipeline

Create one step per micro-action under:

`.whytcard/projects/{id}/pipeline/steps/`

Each step is a folder like `S001-<slug>/` with:
- `instruction.md`
- `acceptance.md`
- `evidence/` (logs, screenshots, proof)

Use descriptive slugs such as `S010-feature-login-form`.

### 5. Execute

For each step:

1. Refine `instruction.md` and `acceptance.md` until the contract is precise.
2. Delegate execution to `whytcard-implementer`.
3. Review the evidence with `whytcard-reviewer`.
4. If the step fails, improve the step contract before retrying.

### 6. Verify

After all steps:
- Run full gate suite (lint, type-check, test, build)
- Save final proof under `.whytcard/projects/{id}/proofs/`
- Launch `whytcard-reviewer` to check feature quality
- If UI: launch `whytcard-visual-verifier` for visual proof
