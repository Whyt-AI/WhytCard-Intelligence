# WhytCard Intelligence

Standalone Cursor-only orchestration plugin.

The plugin teaches an orchestrator to research first, delegate to specialized subagents, keep proof, and iterate until the result is actually validated.

## Standalone promise

This plugin is standalone for Cursor in the packaging sense:

- no npm install
- no extra plugin required
- no MCP server required
- no external skill pack required
- no project-local `.cursor/` dependency required

It ships its own commands, skills, rules, agents, hooks, and helper scripts.
The global install alone is enough for correct Cursor behavior.
Project-local `.cursor/` sync is optional.
Runtime requirement: Cursor plus a working `node` command in `PATH`, because Cursor executes the shipped hook scripts through Node.js.

Global instruction note:

- WhytCard does not try to write Cursor's UI-managed `User Rules`.
- Instead, the installed `sessionStart` hook injects the WhytCard rule bundle at runtime for every chat session.
- If you want repo-visible official project rules, use project-local `.cursor/` sync.

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

Pipeline-first scaffold created by `wi-init-project`:

- `pipeline/plan.md`
- `pipeline/state.json`
- `pipeline/steps/S000-bootstrap-scaffold/`

Canonical supporting layout:

- `pipeline/steps/` - execution steps, each with `instruction.md`, `acceptance.md`, and `evidence/`
- `research/` - official-doc research notes and caveats
- `brainstorms/` - interactive decision records
- `plans/` - execution plans
- `reviews/` - audit and review outputs
- `proofs/` - repo-level proof such as gates, screenshots, and walkthrough artifacts

`pipeline/` is the execution spine. `pipeline/steps/` is the source of truth for real execution work. Older numbered phase folders are obsolete and must not be reused.

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
- Optional project-local sync: `.\scripts\install-plugin.ps1 -ProjectRoot "<repo>"` or `bash ./scripts/install-plugin.sh --project-root "<repo>"`

Then reload Cursor.

The installer is Cursor-only and also cleans known legacy conflicts (`whytcardAI-plugin` hooks/rules) so only current `whytcard-intelligence` behavior remains active.
It also validates merged `~/.cursor/hooks.json` so invalid event names or missing hook scripts fail fast.
It installs shipped WhytCard subagents into `~/.cursor/agents/` so the orchestrator has explicit delegation targets.
It injects the WhytCard orchestrator rules through the `sessionStart` hook instead of relying on Cursor `User Rules` storage.
If you pass a project root, it also syncs the plugin-managed assets into that repo's local `.cursor/` directory while intentionally keeping active hooks managed globally by default.

## Quick verification

- In Cursor chat, type `/wi` and confirm the `/wi-*` commands are available.
- In Cursor chat, type `/whytcard-` and confirm the shipped WhytCard subagents are available.
- Use `/wi-dispatch-step` and `/wi-review-step` to run the orchestrator loop step by step.
- Run `/wi-create-step` when you want a fast, clean pipeline step scaffold before delegating.
- Run `/wi-create-agent` only when a reusable specialist role is missing.
- Run `/wi-sync-project-cursor` when you want the current repo's `.cursor/` instructions/assets refreshed from the installed plugin.
- Run `node ./scripts/test-plugin.js` from the repo root to smoke-test the core hook contracts.
- Run `node ./scripts/audit-standalone.js` from the repo root to verify the plugin has no hidden external runtime/package dependencies.
- Run `/wi-init-project` once in a repo to create the base `.whytcard/projects/<id>/...` scaffold.
- Run `/wi-whytcard` only when you explicitly want the full end-to-end pipeline.

## Language

Internal docs stay in English. Match the user's language automatically in chat responses.

## License

MIT. See `LICENSE`.
