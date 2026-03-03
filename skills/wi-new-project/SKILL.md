---
name: wi-new-project
description: Autonomously scaffold a new project from scratch. Researches the stack, creates the pipeline, and executes step by step. Use when the user wants to start a new project without brainstorming.
---

# New Project

Autopilot mode. You create all necessary agents and run the full pipeline without brainstorm.

## Workflow

### 0. Initialize the KB project scaffold

Before creating any steps, ensure the canonical per-project KB structure exists.

- Run the `wi-init-project` skill (idempotent; no overwrites).
- Use the created `.whytcard/projects/{projectId}/00_orchestrator/*` as the home for plans + state.

### 1. Gather requirements

If the user hasn't specified, ask:
- What type of project? (web app, API, CLI, library)
- What stack? (or "recommend one")
- What's the core feature?

### 2. Research

Launch research agents in parallel:
- **Stack research** — Current versions, best practices, recommended project structure (use wi-research-stack skill)
- **Tooling research** — Package manager, linter, formatter, test runner for this stack

### 3. Create the pipeline

In `.whytcard/projects/{projectId}/01_foundation/steps/`, create steps:

```
S001-init          — Initialize project (package.json, Cargo.toml, etc.)
S002-config        — Configure tooling (linter, formatter, TypeScript, etc.)
S003-structure     — Create directory structure and base files
S004-first-module  — Build the first meaningful component/module
S005-gates         — Run all gates (lint, type-check, test, build)
```

Each step gets `instruction.md` + `acceptance.md`.

### 4. Execute

Delegate each step to an implementation agent. Review evidence after each step. Iterate on failure.

### 5. Verify

After all steps pass, launch a review agent (use review-codebase skill) to validate the overall project quality.
