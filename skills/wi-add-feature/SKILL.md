---
name: wi-add-feature
description: Autonomously add a feature to an existing project. Analyzes impact, decomposes into micro-actions, implements step by step, and reviews. Use when the user wants to add functionality to existing code.
---

# Add Feature

Autopilot mode. You analyze, decompose, implement, and verify the new feature.

## Workflow

### 1. Understand the feature

From the user's request, extract:
- What should the feature do? (behavior)
- Where does it fit in the existing architecture? (location)
- What existing code does it interact with? (dependencies)

### 2. Impact analysis

Launch an exploration agent to:
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

In `.whytcard/projects/{id}/pipeline/steps/`, create one step per micro-action with instruction + acceptance criteria.

### 5. Execute

Delegate each step to an implementation agent. Review evidence after each. Iterate on failure.

### 6. Verify

After all steps:
- Run full gate suite (lint, type-check, test, build)
- Launch a review agent to check the feature quality
- If UI: launch a browser agent for visual verification (use wi-check-browser skill)
