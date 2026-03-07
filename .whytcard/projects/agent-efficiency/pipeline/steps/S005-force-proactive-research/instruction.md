# S005 - Force proactive research

## Context
The most important remaining improvement is not another feature. It is making the orchestrator consistently more useful and proactive.

The plugin should push the agent toward:
- proactive context gathering,
- ongoing official-doc and repo research when uncertainty remains,
- maximum justified knowledge before conclusions,
- zero supposition,
- proactive delegation when deep reading, review, or implementation is needed.

## Task
Strengthen the always-loaded instructions and runtime hooks so the default behavior becomes more proactive and more evidence-driven.

## Scope
- `AGENTS.md`
- `CLAUDE.md`
- `rules/orchestrator-identity.mdc`
- `rules/research-first.mdc`
- `rules/execution-tracking.mdc` if needed
- `hooks/wi-session-start.js`
- `hooks/wi-prompt-dispatch.js`
- `hooks/wi-pre-edit-gate.js` if useful
- `hooks/hooks.cursor.json`
- `hooks/hooks.claude.json`
- `README.md` only if needed for truthful docs

## Required behavior
- State that the agent must proactively gather missing context when it would materially improve the answer or execution.
- State that the agent must continue researching when uncertainty remains and the answer would otherwise rely on assumption.
- Require a "maximum justified knowledge" posture, not a "first plausible answer" posture.
- Reinforce proactive subagent usage for broad reading, deep research, reviews, and implementation.
- Reflect this both in human-readable docs and in injected runtime hook context.

## Constraints
- Do not bloat the docs with vague motivational text.
- Keep the requirements operational and checkable.
- Preserve the existing exhaustive-reading contract and evidence-first model.
