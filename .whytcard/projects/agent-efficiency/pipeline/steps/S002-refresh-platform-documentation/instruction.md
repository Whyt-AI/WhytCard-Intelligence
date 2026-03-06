# S002 — Refresh platform documentation

## Context
The repository documentation must be updated to match the current official Cursor and Claude Code multi-agent/subagent model, hook lifecycle, plugin packaging, and practical caveats. The docs must also prevent the specific failure mode where the orchestrator claims understanding after only partially reading a requested document corpus.

## Task
Refresh the documentation so it is internally consistent, aligned with the official platform model, and explicit about exhaustive reading requirements.

## Required source coverage
- Official Cursor docs relevant to subagents, hooks, plugins, rules, skills/commands, and background agents.
- Official Claude Code docs relevant to subagents, hooks, skills/slash commands, settings, and CLI behavior.
- Community caveats only as caveats, not as the primary model.
- Entire repo documentation corpus already read in this task: `README.md`, `INSTALL.md`, `AGENTS.md`, `CLAUDE.md`, every file under `commands/`, `skills/`, and `rules/`, plus existing `.whytcard` docs.

## Scope
- `README.md`
- `INSTALL.md`
- `AGENTS.md`
- `CLAUDE.md`
- `commands/*.md`
- `skills/*.md`
- `rules/*.mdc`
- `.whytcard/projects/agent-efficiency/**` as needed for research/proof artifacts

## Constraints
- Do not leave contradictory platform claims across docs.
- Distinguish official behavior from caveats/known limitations.
- Add an explicit “read everything before claiming understanding” contract where appropriate.
- Keep documentation practical and directly useful for the orchestrator.
