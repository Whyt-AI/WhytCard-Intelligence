# How to create and manage agents

You are the orchestrator. Your agents are your arms. This document teaches you how to create them, form them, delegate to them, and learn from their results.

## When to create an agent

Create an agent when:
- The task involves writing or modifying code
- The task involves deep research across multiple sources
- The task involves reading a large number of files
- The task would consume significant context window

Do NOT create an agent when:
- The task is a quick question to the user
- The task is a simple file read you need for decision-making
- The overhead of delegation exceeds the work itself

## How to create an agent (Cursor)

Write a `.md` file in `.cursor/agents/` with YAML frontmatter:

```markdown
---
name: agent-name
description: What this agent does and when to delegate to it. Be specific.
model: inherit
readonly: false
tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Bash
  - WebSearch
---

You are [role]. Your mission is [one sentence].

## Context
[Why this task matters in the larger project]

## Your task
[The specific micro-action to perform]

## Scope
[Exact files/globs you may touch — nothing outside this]

## Quality bar
- 0 errors, 0 warnings
- No dead code, no duplication
- No mocks — real integrations
- Evidence written to evidence/

## When done
[Acceptance criteria checklist]
```

### Key fields

| Field | Purpose |
|-------|---------|
| `name` | Lowercase, hyphens only. Unique identifier. |
| `description` | Critical for delegation. Include trigger terms. |
| `readonly` | `true` for research/review agents. `false` for code agents. |
| `tools` | Only grant what the agent needs. Research agents don't need Edit. |

## How to form an agent

A well-formed agent succeeds on the first try. A poorly-formed agent fails and wastes time.

### Teach the why, not just the what

Bad instruction:
```
Create a login form in src/components/Login.tsx
```

Good instruction:
```
The authentication system uses magic links via Resend (see package.json).
Users expect a clean, minimal login experience — email field + submit button.
The form should call POST /api/auth/send-link and handle loading/error/success states.
Follow the existing component pattern in src/components/Dashboard.tsx for styling conventions.
Create src/components/Login.tsx.
```

The difference: the good instruction gives the agent everything it needs to make correct judgment calls at the edges.

### Give context, not commands

- Why this step matters in the pipeline (one sentence)
- Relevant documentation links you verified during research
- Code patterns from the existing codebase the agent should follow
- Examples of expected output when helpful
- Quality bar: 0 errors, 0 warnings, no placeholders, no shortcuts

### Set the right tool permissions

| Agent type | readonly | Tools |
|-----------|----------|-------|
| Research | true | Read, Glob, Grep, WebSearch, WebFetch |
| Code review | true | Read, Glob, Grep, Bash |
| Implementation | false | Read, Glob, Grep, Edit, Write, Bash, WebSearch |
| Visual check | true | Read, Bash (for screenshots) |

## The delegation contract

For every micro-action you delegate, produce these artifacts:

### Before delegation (you write)

In `.whytcard/projects/{projectId}/pipeline/steps/{stepId}/`:

| File | Content |
|------|---------|
| `instruction.md` | What to do. Single micro-action, scope, constraints, context. |
| `acceptance.md` | What "done" means. Observable, testable checklist. |

### After delegation (agent writes)

In the step's `evidence/` directory:

| File | Content |
|------|---------|
| `patch.diff` | Output of `git diff` for the change |
| `gate.log` | Stdout/stderr of gate commands (lint, type-check, test, build) |
| `notes.md` | Optional. Non-obvious tradeoffs, scope concerns, suggestions. |

## The review cycle

After an agent delivers:

1. **Check scope** — Did it only touch files within the declared scope?
2. **Check gates** — Are lint, type-check, test, build all green?
3. **Check acceptance** — Is every criterion in acceptance.md satisfied?
4. **Check quality** — No shortcuts, no placeholders, no mocks where real integrations were specified?

### On PASS
Mark the step as completed. Move to the next step.

### On FAIL
This is where your creativity matters most.

1. Read the gate logs and patch diff. Identify the root cause.
2. Is it a code bug, an ambiguous instruction, or a missing prerequisite?
3. Improve `instruction.md` — make it more precise, add a missing constraint, provide an example, or split the step further.
4. Re-delegate with the corrected instruction. A fresh agent reads the improved instruction.
5. The pipeline learns: the corrected instruction prevents the same failure in future projects.

## Parallel execution

Sequential is the default. Parallel only when ALL of these are true:
- Different file scopes (no shared files)
- Different responsibilities (no shared functionality)
- Independent acceptance criteria
- No shared build/test artifacts that could race

If uncertain: sequential.

## Using skills as agent manuals

Skills in `skills/` are instruction manuals for your agents. When you create an agent for web research, reference `skills/search-web/SKILL.md`. When you create an agent for code review, reference `skills/review-codebase/SKILL.md`.

The skill teaches the agent HOW to do the work. Your instruction teaches it WHAT to do and WHY.

## Context economy

Every agent runs in an isolated context. When it finishes, its context is discarded. Only the results come back to you.

This means:
- Your context stays clean — you keep the big picture
- Agents can go deep into code without polluting your view
- You can run 10 steps and still remember the original objective
- Failed agents cost nothing — just re-delegate with better instructions
