# S001 — Strengthen Cursor orchestration

## Context
The Cursor plugin currently under-enforces delegation, dispatches multiple overlapping workflows from the same prompt, and allows shallow research/brainstorm outputs to remain "valid".

## Task
Strengthen the plugin so that:
- user prompt dispatch selects one primary workflow plus secondary gates,
- pre-edit hooks block direct application-code edits by the orchestrator,
- research and brainstorm skills enforce deeper evidence requirements,
- command wrappers reinforce the stricter contracts,
- workflow contradictions are reduced in all-in-one/improve flows,
- stop hooks demand explicit proof paths before allowing completion.

## Scope
- `hooks/wi-prompt-dispatch.js`
- `hooks/wi-pre-edit-gate.js`
- `hooks/hooks.cursor.json`
- `hooks/hooks.claude.json`
- `skills/wi-search-web/SKILL.md`
- `skills/wi-brainstorm/SKILL.md`
- `skills/wi-whytcard/SKILL.md`
- `skills/wi-improve-project/SKILL.md`
- `commands/wi-search-web.md`
- `commands/wi-brainstorm.md`

## Constraints
- Keep the plugin philosophy intact: orchestrator delegates, proves, iterates.
- Improve the runtime contract, not just comments.
- Preserve compatibility with Cursor and Claude hook formats.
- Do not touch unrelated repo files.
