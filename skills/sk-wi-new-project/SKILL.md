---
name: sk-wi-new-project
description: Autonomously scaffold a new project from scratch. Researches the stack, creates the pipeline, and executes step by step. Use when the user wants to start a new project without brainstorming.
---

# New Project

Mode: `autopilot-full`

Create a new project with minimal interruption while keeping the work traceable and evidence-based.

## Hard contract

- Official docs are the primary source for stack and workflow choices.
- Community sources are caveats only.
- If exhaustive reading was requested, list the requested corpus and do not claim full understanding until it is fully read.
- Real execution steps belong under `.whytcard/projects/{projectId}/pipeline/steps/`.

## Workflow

### 0. Initialize the KB project scaffold

Before creating any steps, ensure the canonical per-project KB structure exists.

- Run the `wi-init-project` skill (idempotent; no overwrites).
- Use the created `.whytcard/projects/{projectId}/00_orchestrator/*` as the home for base orchestration state.
- Use `.whytcard/projects/{projectId}/plans/` for implementation plans.

### 1. Gather requirements

If the user hasn't specified, ask:
- What type of project? (web app, API, CLI, library)
- What stack? (or "recommend one")
- What's the core feature?

### 2. Research

Launch research subagents in parallel:
- **Stack research** - Current versions, best practices, recommended project structure (use wi-research-stack skill)
- **Tooling research** - Package manager, linter, formatter, test runner for this stack

### 3. Create the pipeline

Create an execution plan in `.whytcard/projects/{projectId}/plans/`, then create real execution steps in `.whytcard/projects/{projectId}/pipeline/steps/`.

Recommended first steps:

```
S001-foundation-init
S002-foundation-config
S003-foundation-structure
S004-feature-first-slice
S005-proof-gates
```

Each step gets `instruction.md` + `acceptance.md`.

### 4. Execute

Delegate each step to an implementation subagent. Review evidence after each step. Iterate on failure.

### 5. Verify

After all steps pass:

- save repo-level gate proof under `.whytcard/projects/{projectId}/proofs/`
- launch a review subagent (use `wi-review-codebase`) to validate the overall project quality
- save the review under `.whytcard/projects/{projectId}/reviews/`
