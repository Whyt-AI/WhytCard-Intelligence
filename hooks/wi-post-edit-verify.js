#!/usr/bin/env node
/**
 * wi-post-edit-verify — PostToolUse hook for Edit/Write/NotebookEdit
 *
 * After a file is edited, reminds the orchestrator to:
 * - Evaluate visual work with the visual-verify grid
 * - Check agent evidence for application code changes
 *
 * Works in Cursor via the shared output module.
 */

const {
  handleStdin,
  postToolUseContext,
  emptyResponse,
  isVisualFile,
} = require("./lib/output");

const ORCHESTRATION_PATTERNS = [
  /(?:^|[/\\])hooks[/\\]/i,
  /(?:^|[/\\])rules[/\\]/i,
  /(?:^|[/\\])commands[/\\]/i,
  /(?:^|[/\\])skills[/\\]/i,
  /(?:^|[/\\])scripts[/\\]/i,
  /(?:^|[/\\])\.whytcard[/\\]/i,
  /(?:^|[/\\])\.cursor[/\\]/i,
  /wi-config\.json$/i,
  /\.mdc$/i,
  /\.md$/i,
  /plugin\.json$/i,
  /hooks\.cursor\.json$/i,
  /hooks\.json$/i,
  /manifest\.(?:json|ya?ml)$/i,
  /AGENTS\.md$/i,
];

function isOrchestrationFile(filePath) {
  return ORCHESTRATION_PATTERNS.some((pattern) => pattern.test(filePath));
}

handleStdin((data) => {
  const toolInput = data.tool_input || {};
  const filePath = toolInput.file_path || "";
  const filePathLower = filePath.toLowerCase();
  const reminders = [];

  // Visual file edited → remind to evaluate with visual-verify grid
  if (isVisualFile(filePathLower)) {
    reminders.push(
      `WC-POST-EDIT: Visual file "${filePath}" was modified. Evaluate with rules/visual-verify.mdc before declaring done: screenshots at 3 viewports (375/768/1440px), dark+light modes, evaluate as a user.`,
    );
  }

  // Application code edited → remind to verify evidence
  const appCodePattern = /\.(tsx?|jsx?|vue|svelte|rs|py|go)$/i;
  if (
    appCodePattern.test(filePathLower) &&
    !isOrchestrationFile(filePathLower) &&
    !/\.whytcard/i.test(filePathLower)
  ) {
    reminders.push(
      `WC-POST-EDIT: Application code modified. Verify agent evidence: lint clean? type-check clean? tests pass? Save proof to .whytcard/ pipeline. Use rules/execution-tracking.mdc to evaluate.`,
    );
  }

  if (reminders.length > 0) {
    return postToolUseContext(reminders.join("\n"));
  }
  return emptyResponse();
});
