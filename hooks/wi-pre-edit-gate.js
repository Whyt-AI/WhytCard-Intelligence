#!/usr/bin/env node
/**
 * wi-pre-edit-gate — PreToolUse hook for Edit/Write/NotebookEdit
 *
 * This hook enforces one critical guardrail:
 * - deny direct application-code edits by the orchestrator
 *
 * Notes:
 * - Cursor preToolUse official schema focuses on permission decisions.
 * - Advisory reminders are emitted in postToolUse where additional_context is supported.
 */

const { handleStdin, emptyResponse, denyPreToolUse } = require("./lib/output");

const ORCHESTRATION_PATTERNS = [
  /(?:^|[/\\])hooks[/\\]/i,
  /(?:^|[/\\])rules[/\\]/i,
  /(?:^|[/\\])commands[/\\]/i,
  /(?:^|[/\\])skills[/\\]/i,
  /(?:^|[/\\])scripts[/\\]/i,
  /(?:^|[/\\])\.whytcard[/\\]/i,
  /(?:^|[/\\])\.cursor[/\\]/i,
  /(?:^|[/\\])pipeline[/\\]/i,
  /wi-config\.json$/i,
  /package\.json$/i,
  /\.mdc$/i,
  /\.md$/i,
  /plugin\.json$/i,
  /hooks\.cursor\.json$/i,
  /hooks\.json$/i,
  /manifest\.(?:json|ya?ml)$/i,
  /AGENTS\.md$/i,
];

const APPLICATION_PATTERNS = [
  /(?:^|[/\\])src[/\\]/i,
  /(?:^|[/\\])app[/\\]/i,
  /(?:^|[/\\])apps[/\\]/i,
  /(?:^|[/\\])packages[/\\]/i,
  /(?:^|[/\\])components[/\\]/i,
  /(?:^|[/\\])lib[/\\]/i,
  /(?:^|[/\\])services[/\\]/i,
  /(?:^|[/\\])utils[/\\]/i,
  /(?:^|[/\\])pages[/\\]/i,
  /(?:^|[/\\])routes[/\\]/i,
  /(?:^|[/\\])api[/\\]/i,
  /(?:^|[/\\])server[/\\]/i,
  /(?:^|[/\\])tests?[/\\]/i,
  /(?:^|[/\\])__tests__[/\\]/i,
  /\.tsx$/i,
  /\.jsx$/i,
  /\.vue$/i,
  /\.svelte$/i,
  /\.rs$/i,
  /\.py$/i,
  /\.go$/i,
];

function getFilePath(toolInput) {
  return (
    toolInput.file_path ||
    toolInput.path ||
    toolInput.target_file ||
    toolInput.target_notebook ||
    ""
  );
}

function isOrchestrationFile(filePath) {
  return ORCHESTRATION_PATTERNS.some((p) => p.test(filePath));
}

function isApplicationCode(filePath) {
  if (isOrchestrationFile(filePath)) return false;
  return APPLICATION_PATTERNS.some((p) => p.test(filePath));
}

handleStdin((data) => {
  const toolInput = data.tool_input || {};
  const filePath = getFilePath(toolInput);

  if (isApplicationCode(filePath)) {
    const reason = `WC-DENY: Direct edit blocked for application code (${filePath}). As the orchestrator, keep your hands off target code: create or refine the current step contract in .whytcard, bootstrap it with /wi-create-step if needed, resolve and mark the step with /wi-dispatch-step, then delegate execution to a shipped WhytCard subagent such as /whytcard-implementer, /whytcard-debugger, or /whytcard-reviewer. If no reusable specialist fits, add one with /wi-create-agent. Direct edits are reserved for orchestration/plugin files such as hooks/, rules/, commands/, skills/, agents/, scripts/, plugin manifests, .whytcard/, markdown, and .mdc.`;
    return denyPreToolUse(reason, reason);
  }

  return emptyResponse();
});
