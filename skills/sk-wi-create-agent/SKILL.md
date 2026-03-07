---
name: sk-wi-create-agent
description: Create a reusable WhytCard subagent file in `agents/`. Use when no shipped specialist matches a recurring need and a new stable role should be added.
---

# Create Agent

Mode: `autopilot-safe`

Use this skill when the orchestrator discovers a missing specialist role that should be reusable across projects or stacks.

## When to use it

Use it for:

- a recurring specialization not covered by the shipped agents
- a stack-specific expert that will be reused
- a role that improves future orchestration quality

Do **not** use it for a one-off step. One-off work belongs in a step contract, not a new agent.

## Action

From the repo root, run:

```bash
node "./scripts/wi-create-agent.js" "<agentName>" "<description>"
```

Example:

```bash
node "./scripts/wi-create-agent.js" "whytcard-rust-api" "Rust API specialist. Use when designing or implementing Axum/Actix endpoints and validating request/response contracts."
```

## Acceptance

- `agents/<agentName>.md` exists
- the file has valid Cursor-style YAML frontmatter
- the agent role is reusable and not tied to one temporary step
- the orchestrator can install it later via the normal plugin install flow
