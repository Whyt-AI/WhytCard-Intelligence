#!/usr/bin/env node
/**
 * wi-prompt-dispatch — beforeSubmitPrompt hook
 *
 * Cursor docs currently treat beforeSubmitPrompt as a validation hook
 * (`continue` + `user_message`). To keep behavior robust, this script validates
 * /wi-* command names and avoids undocumented context-injection behavior here.
 */

const {
  handleStdin,
  allowBeforeSubmitPrompt,
  denyBeforeSubmitPrompt,
} = require("./lib/output");

const KNOWN_COMMANDS = new Set([
  "/wi-whytcard",
  "/wi-init-project",
  "/wi-create-step",
  "/wi-create-agent",
  "/wi-sync-project-cursor",
  "/wi-dispatch-step",
  "/wi-review-step",
  "/wi-brainstorm",
  "/wi-new-project",
  "/wi-fix-bug",
  "/wi-add-feature",
  "/wi-improve-project",
  "/wi-security-audit",
  "/wi-perf-audit",
  "/wi-review-codebase",
  "/wi-research-stack",
  "/wi-search-web",
  "/wi-check-browser",
]);

function extractWhytcardCommands(prompt) {
  return String(prompt || "")
    .toLowerCase()
    .match(/\/wi-[a-z-]+/g);
}

handleStdin((data) => {
  const prompt = data.prompt || "";
  const commands = extractWhytcardCommands(prompt) || [];
  const unknownCommands = commands.filter((command) => !KNOWN_COMMANDS.has(command));

  if (unknownCommands.length > 0) {
    const knownList = [...KNOWN_COMMANDS].join(", ");
    return denyBeforeSubmitPrompt(
      `Unknown WhytCard command(s): ${unknownCommands.join(", ")}. Use one of: ${knownList}`,
    );
  }

  return allowBeforeSubmitPrompt();
});
