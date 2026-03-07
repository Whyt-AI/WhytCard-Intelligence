# WhytCard Intelligence

Practical orchestration plugin for Cursor.

The plugin teaches an orchestrator to research first, delegate to specialized subagents, keep proof, and iterate until the result is actually validated.

## Platform model: official surfaces first

Cursor official concepts: Ask, Agent, Plan, Debug, subagents, hooks, plugins, rules, skills/commands, and Cloud Agents.
This plugin adds its own operating wrappers on top: `interactive`, `autopilot-safe`, and `autopilot-full`.

## Plugin operating wrappers

These are plugin conventions, not official platform modes:

- `interactive`: discuss, research, compare, and converge with the user.
- `autopilot-safe`: continue without repeated approval for reversible work, but escalate destructive or irreversible decisions.
- `autopilot-full`: run the full pipeline with minimal interruption, while still escalating unsafe or irreversible decisions.

## Canonical `.whytcard` layout

Canonical project knowledge lives under `.whytcard/projects/<projectId>/`.

Base scaffold created by `wi-init-project`:

- `00_orchestrator/`
- `01_foundation/steps/S001-project-scaffold/`

Canonical working layout once real work starts:

- `pipeline/steps/` - execution steps, each with `instruction.md`, `acceptance.md`, and `evidence/`
- `research/` - official-doc research notes and caveats
- `brainstorms/` - interactive decision records
- `plans/` - execution plans
- `reviews/` - audit and review outputs
- `proofs/` - repo-level proof such as gates, screenshots, and walkthrough artifacts

`pipeline/steps/` is the source of truth for real execution. Older numbered phase folders are obsolete and must not be reused.

## Exhaustive-reading contract

If the user asks for exhaustive reading, you must:

1. Enumerate the requested corpus.
2. Read every requested item before claiming understanding of the whole.
3. State exactly what has been read and what has not yet been read.
4. Never say "I read everything", "I understand the full corpus", or similar after a partial read.

Partial reading is acceptable only if you label it precisely as partial.

## Command wrappers and skills

- `commands/*.md` are thin slash-command wrappers.
- `skills/*/SKILL.md` are the detailed operating manuals.
- Wrappers must stay short, explicit, and aligned with the corresponding skill.
- Use `subagent` as the primary term for delegated specialized work.

## Installation

Use `INSTALL.md` for the actual install flow, manifest behavior, and hook wiring details.
Use `AGENT.md` for the automated plug-and-play setup runbook.

Quick start:

- Windows: `.\scripts\install-plugin.ps1`
- Linux/macOS: `bash ./scripts/install-plugin.sh`

Then reload Cursor.

The installer is Cursor-only and also cleans known legacy conflicts (`whytcardAI-plugin` hooks/rules) so only current `whytcard-intelligence` behavior remains active.

## Quick verification

- In Cursor chat, type `/wi` and confirm the `/wi-*` commands are available.
- Run `/wi-init-project` once in a repo to create the base `.whytcard/projects/<id>/...` scaffold.
- Run `/wi-whytcard` only when you explicitly want the full end-to-end pipeline.

## Language

Internal docs stay in English. When interacting with Jerome, the orchestrator speaks French.

## License

MIT. See `LICENSE`.
