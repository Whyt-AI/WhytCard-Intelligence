# Platform documentation synthesis

Date: 2026-03-06

Purpose: capture the official platform model that should drive this repo's documentation, plus a small set of clearly marked community caveats.

## Source policy

Primary sources:

- official Cursor docs
- official Claude Code docs

Secondary sources only:

- forum threads
- GitHub issues
- community reports

Community sources must never replace the official model. They are caveats only.

## Official Cursor sources

- Agent modes: https://cursor.com/docs/agent/modes
- Agent overview: https://cursor.com/help/ai-features/agent
- Subagents: https://cursor.com/docs/agent/subagents
- Hooks: https://cursor.com/docs/agent/hooks
- Plugins overview: https://cursor.com/docs/plugins
- Plugins reference: https://cursor.com/docs/reference/plugins
- Rules: https://cursor.com/help/customization/rules
- Cloud Agents: https://cursor.com/docs/background-agent
- Cloud Agents API: https://cursor.com/docs/background-agent/api/overview

### Official Cursor takeaways used in this repo

- Cursor has official modes such as Ask, Agent, Plan, and Debug.
- Cursor supports subagents, including isolated delegated work.
- Cursor supports hooks and plugin packaging.
- Cursor supports user-level and project-level hook configs.
- Cursor Cloud Agents are a distinct official surface and should not be collapsed into the local plugin model.

## Official Claude Code sources

- Subagents: https://docs.anthropic.com/en/docs/claude-code/subagents
- Hooks: https://docs.anthropic.com/en/docs/claude-code/hooks
- Hooks guide: https://docs.anthropic.com/en/docs/claude-code/hooks-guide
- Slash commands and skills: https://docs.anthropic.com/en/docs/claude-code/slash-commands
- Settings: https://docs.anthropic.com/en/docs/claude-code/settings
- CLI reference: https://docs.anthropic.com/en/docs/claude-code/cli-reference
- CLI usage: https://docs.anthropic.com/en/docs/claude-code/cli-usage

### Official Claude Code takeaways used in this repo

- Claude Code has official settings scopes and CLI workflows.
- Claude Code supports subagents with isolated context and specialized tool access.
- Claude Code supports hooks at multiple lifecycle points.
- Claude Code treats skills/slash commands as first-class extension points.
- Claude Code plugin/config behavior should be documented on its own terms, not as a mirror of Cursor.

## Repo-level interpretation that the docs should enforce

- Use `subagent` as the primary delegation term.
- Describe Cursor and Claude Code as overlapping but non-identical hosts.
- Document plugin wrappers `interactive`, `autopilot-safe`, and `autopilot-full` as repo conventions, not official platform modes.
- Keep the canonical project KB under `.whytcard/projects/<projectId>/`.
- State that `wi-init-project` creates the base scaffold:
  - `00_orchestrator/`
  - `01_foundation/steps/S001-project-scaffold/`
- State that real execution work belongs under:
  - `pipeline/steps/`
  - `research/`
  - `brainstorms/`
  - `plans/`
  - `reviews/`
  - `proofs/`
- Add an explicit exhaustive-reading rule: if the user requested full reading, never claim full understanding after partial reading; report exactly what was read and what remains unread.

## Repo-specific install and hook behavior to document accurately

- `.cursor-plugin/plugin.json` currently declares commands, skills, and rules.
- Cursor hooks in this repo are sourced from `hooks/hooks.cursor.json` but installed by script into `~/.cursor/hooks.json`.
- `.claude-plugin/plugin.json` declares Claude hooks via `hooks/hooks.claude.json`.
- The install scripts also update `~/.claude/plugins/installed_plugins.json` and `~/.claude/settings.json`.

This is an implementation detail of this repo, not a statement that Cursor and Claude Code have identical plugin-hook wiring.

## Community caveats (non-official)

These are useful implementation notes, not the core model.

### Cursor

- Windows/project-level hook reliability has multiple community reports:
  - https://forum.cursor.com/t/project-level-hooks-fail-to-execute-on-windows/144940
  - https://forum.cursor.com/t/hooks-not-working-on-windows/149509/3
  - https://forum.cursor.com/t/hooks-are-not-working-anymore/145016/2

Practical implication for this repo:

- installing Cursor hooks into `~/.cursor/hooks.json` is a defensible compatibility choice
- documentation must still say this is a repo choice, not the only official way

### Claude Code

- Plugin registration/enabled-state sync issues have community issue reports:
  - https://github.com/anthropics/claude-code/issues/12457
  - https://github.com/anthropics/claude-code/issues/17789
  - https://github.com/anthropics/claude-code/issues/20661
- Hook/plugin edge-case reports also exist:
  - https://github.com/anthropics/claude-code/issues/10875
  - https://github.com/anthropics/claude-code/issues/17621
  - https://github.com/anthropics/claude-code/issues/29991

Practical implication for this repo:

- writing both `installed_plugins.json` and `settings.json` during install is a defensible workaround
- documentation must label this as a caveat-driven implementation detail, not as official Claude behavior

## Documentation changes implied by this synthesis

- remove contradictory legacy KB paths from active guidance
- fix obsolete skill path examples such as `skills/search-web/...`
- make command wrappers short, consistent, and explicit
- keep official behavior and caveats in separate sections
- make the exhaustive-reading contract impossible to miss
