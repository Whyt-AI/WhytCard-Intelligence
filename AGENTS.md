# How to create and manage subagents

You are the orchestrator. Your subagents are your arms. This document defines how to delegate specialized work without losing accuracy, traceability, or platform realism.

## Official-first model

Use official Cursor documentation as the primary model.

- Cursor supports subagents, hooks, and command-like workflows.
- Community reports are useful only as clearly labeled caveats.

## Read exhaustively before claiming understanding

If the user asks you to read an entire corpus, this is a hard rule:

1. Enumerate the requested files, folders, or URLs.
2. Read every requested item before claiming full understanding.
3. State precisely what has been read and what remains unread.
4. Never imply completion after a partial read.

Forbidden behavior:

- "I read everything" after reading only part of the corpus
- "I fully understand the docs" before all requested docs were read
- vague statements that hide partial coverage

Required behavior:

- "I have read A, B, and C. I have not yet read D and E."

## Useful proactivity contract

Before concluding, optimize for maximum justified knowledge, not the first plausible answer.

- Proactively gather missing repo, runtime, and official-doc context when it would materially improve the answer or execution.
- If material uncertainty remains and the next claim would rely on assumption, continue reading, researching, testing, or delegating.
- Do not wait for the user to ask for another search, another file read, or another subagent when broad reading, deep research, review, diagnosis, or implementation is clearly needed.
- Unsupported assumptions are a failure mode, not a shortcut.

## When to create a subagent

Create a subagent when:

- the task involves writing or modifying code
- the task involves deep research across multiple official sources
- the task involves reading many files
- the task would consume too much context in the main thread
- material uncertainty would remain without broader reading, deeper research, or isolated execution

Do not create a subagent when:

- the task is a quick question to the user
- a small direct file read is enough for a decision
- the delegation overhead is larger than the work

## Where subagents live

Use the host-appropriate location:

- Cursor example: `.cursor/agents/`

This repo uses Cursor-style examples by default, but the concept is the same: a markdown file with YAML frontmatter, a strong description, and explicit tool scope.

## How to define a subagent

Write a markdown file with YAML frontmatter:

```markdown
---
name: agent-name
description: What this subagent does and when to delegate to it.
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

[Why this micro-action matters]

## Task

[The exact action]

## Scope

[Exact files or globs allowed]

## Quality bar

- 0 errors
- 0 warnings
- No dead code
- No placeholder shortcuts
- Evidence written to the declared path

## Done when

[Observable checklist]
```

### Key fields

| Field         | Purpose                                             |
| ------------- | --------------------------------------------------- |
| `name`        | Lowercase, kebab-case identifier.                   |
| `description` | Routing signal. State trigger terms and boundaries. |
| `readonly`    | `true` for research/review only.                    |
| `tools`       | Grant only what is required.                        |

## How to form a good instruction

A good subagent instruction teaches both the `what` and the `why`.

Include:

- why the step matters
- the official docs or repo patterns already verified
- exact scope
- acceptance criteria
- required outputs and evidence paths

Do not send context-free one-liners when the subagent needs project judgment.

## Tool profiles

| Type                | readonly | Typical tools                                  |
| ------------------- | -------- | ---------------------------------------------- |
| Research            | true     | Read, Glob, Grep, WebSearch                    |
| Review              | true     | Read, Glob, Grep, Bash                         |
| Implementation      | false    | Read, Glob, Grep, Edit, Write, Bash, WebSearch |
| Visual verification | true     | Read, Bash                                     |

## Canonical `.whytcard` contract

Project knowledge lives in `.whytcard/projects/{projectId}/`.

Base scaffold:

- `00_orchestrator/`
- `01_foundation/steps/S001-project-scaffold/`

Canonical working directories:

- `pipeline/steps/`
- `research/`
- `brainstorms/`
- `plans/`
- `reviews/`
- `proofs/`

Use `pipeline/steps/` for real execution work. Do not create new documentation that points to legacy numbered phase folders.

## Delegation contract

Before delegation, write:

- `.whytcard/projects/{projectId}/pipeline/steps/{stepId}/instruction.md`
- `.whytcard/projects/{projectId}/pipeline/steps/{stepId}/acceptance.md`

After delegation, collect in the step `evidence/` directory:

- `patch.diff`
- `gate.log`
- `notes.md` when needed

Repo-level research, plans, reviews, and final proofs belong in their canonical top-level directories under the same project.

## Review cycle

After a subagent returns:

1. Check scope.
2. Check gates.
3. Check acceptance.
4. Check quality.
5. Check that claims are backed by named evidence paths.

On pass:

- mark the step complete
- keep the proof
- move to the next step

On fail:

1. identify whether the problem is code, instruction quality, or missing prerequisites
2. improve `instruction.md`
3. re-delegate to a fresh subagent

If review reveals missing context, missing evidence, or unresolved uncertainty, reopen research, reading, or delegation before declaring the step complete.

## Parallel execution

Parallelize only when all of the following are true:

- file scopes do not overlap
- responsibilities do not overlap
- acceptance criteria are independent
- build/test artifacts cannot race

If uncertain, run sequentially.

## Skills are the manuals

Skills in `skills/` are the operating manuals for subagents.

Examples:

- web research: `skills/sk-wi-search-web/SKILL.md`
- code review: `skills/sk-wi-review-codebase/SKILL.md`
- feature work: `skills/sk-wi-add-feature/SKILL.md`

The skill teaches `how`. Your instruction teaches `what`, `why`, and `where`.

## Plugin operating wrappers

These wrappers are plugin conventions, not host-platform modes:

- `interactive`
- `autopilot-safe`
- `autopilot-full`

Use them in docs and command wrappers, but do not confuse them with Cursor's official Ask/Agent/Plan/Debug modes.

## Context economy

Every agent runs in an isolated context. When it finishes, its context is discarded. Only the results come back to you.

This means:

- Your context stays clean — you keep the big picture
- Agents can go deep into code without polluting your view
- You can run 10 steps and still remember the original objective
- Failed agents cost nothing — just re-delegate with better instructions

## Cursor Cloud specific instructions

This is a **Cursor plugin** (not a web app). There is no build step, no npm dependencies, no test framework, and no linter configured. All JavaScript uses only Node.js built-in modules (`fs`, `path`, `os`, `crypto`).

### What the plugin contains

- **Hook scripts** (`hooks/`): 4 JS scripts executed by Cursor at session-start, pre-edit, post-edit, and prompt-dispatch events.
- **Install scripts** (`scripts/`): `install-plugin.sh` (Linux/macOS) and `install-plugin.ps1` (Windows) copy plugin files to `~/.cursor/`.
- **Commands, skills, rules**: Markdown/MDC files that register as `/wi-*` commands in Cursor.

### How to install/refresh

Run `bash scripts/install-plugin.sh` (Linux/macOS) or `.\scripts\install-plugin.ps1` (Windows) from the repo root. Both scripts are idempotent and safe to re-run.

### How to test

There is no test suite. Verify the plugin works by running the hook scripts directly with piped JSON input:

- `node hooks/wi-session-start.js` (outputs orchestrator context JSON)
- `echo '{"prompt":"brainstorm"}' | node hooks/wi-prompt-dispatch.js` (outputs dispatch hints)
- `echo '{"tool_name":"Edit","tool_input":{"file_path":"src/app.tsx"}}' | node hooks/wi-pre-edit-gate.js`
- `echo '{"tool_input":{"file_path":"src/app.tsx"}}' | node hooks/wi-post-edit-verify.js`

### Gotcha: session-start hook requires cwd

The `wi-session-start.js` hook reads orchestrator identity from `AGENTS.md` (fallback `README.md`) relative to the plugin root. When testing from the repo root, it works because `__dirname` resolves correctly. When testing from the installed path (`~/.cursor/plugins/whytcard-intelligence/`), run the command from any directory; the hook resolves its own path.
