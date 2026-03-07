#!/usr/bin/env node
/**
 * wi-pre-edit-gate — PreToolUse hook for Edit/Write/NotebookEdit
 *
 * Two roles:
 * 1. Deny direct application-code edits by the orchestrator
 * 2. Inject quality reminders (visual, version, research) for legitimate edits
 *
 * Blocks forbidden edits and injects context reminders for allowed ones.
 * Works on both Claude Code and Cursor via shared output module.
 */

const {
  handleStdin,
  injectContext,
  emptyResponse,
  denyAction,
  isVisualFile,
  loadConfig,
} = require("./lib/output");

const ORCHESTRATION_PATTERNS = [
  /(?:^|[/\\])hooks[/\\]/i,
  /(?:^|[/\\])rules[/\\]/i,
  /(?:^|[/\\])commands[/\\]/i,
  /(?:^|[/\\])skills[/\\]/i,
  /(?:^|[/\\])scripts[/\\]/i,
  /(?:^|[/\\])\.whytcard[/\\]/i,
  /(?:^|[/\\])\.cursor[/\\]/i,
  /(?:^|[/\\])\.claude[/\\]/i,
  /(?:^|[/\\])pipeline[/\\]/i,
  /wi-config\.json$/i,
  /package\.json$/i,
  /\.mdc$/i,
  /\.md$/i,
  /plugin\.json$/i,
  /hooks\.(?:cursor|claude)\.json$/i,
  /hooks\.json$/i,
  /manifest\.(?:json|ya?ml)$/i,
  /CLAUDE\.md$/i,
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
  const toolName = data.tool_name || "";
  const toolInput = data.tool_input || {};
  const filePath = getFilePath(toolInput);
  const filePathLower = filePath.toLowerCase();
  const cwd = data.cwd || process.cwd();
  const config = loadConfig(cwd);
  const reminders = [];

  if (isApplicationCode(filePath)) {
    return denyAction(
      "PreToolUse",
      `WC-DENY: Direct edit blocked for application code (${filePath}). As the orchestrator, delegate code changes to a subagent. Direct edits are reserved for orchestration/plugin files such as hooks/, rules/, commands/, skills/, scripts/, plugin manifests, .whytcard/, markdown, and .mdc.`
    );
  }

  if (config.visualVerification && isVisualFile(filePathLower)) {
    const vp = config.viewports || [375, 768, 1440];
    reminders.push(
      `WC-VISUAL: Visual file detected. After editing, evaluate with rules/visual-verify.mdc: screenshots at ${vp.length} viewports (${vp.join("/")}px), dark+light modes.`
    );
  }

  if (config.versionCheck && filePathLower.endsWith("package.json")) {
    const editContent = toolInput.new_string || toolInput.content || toolInput.insert || "";
    const isDependencyEdit =
      editContent.includes("dependencies") ||
      editContent.includes("devDependencies") ||
      editContent.includes("peerDependencies") ||
      editContent.includes("optionalDependencies") ||
      /["'][\w@/-]+["']\s*:\s*["']\^?~?[\d]/.test(editContent) ||
      editContent === "";
    if (isDependencyEdit) {
      reminders.push(
        "WC-VERSIONS: Dependency change detected. Evaluate with rules/version-check.mdc: verify latest version via live search, check maintenance, compare alternatives."
      );
    }
  }

  if (config.researchFirst && toolName === "Write" && !isOrchestrationFile(filePathLower)) {
    reminders.push(
      "WC-RESEARCH: New file creation. Evaluate with rules/research-first.mdc: was the approach researched? dual-angle? alternatives considered?"
    );
  }

  if (isOrchestrationFile(filePathLower)) {
    reminders.push(
      "WC-QUALITY: Allowed direct edit. Keep the orchestrator contract intact: preserve delegation rules, keep instructions executable, and require concrete evidence paths and gate commands."
    );
  }

  if (reminders.length > 0) {
    return injectContext("PreToolUse", reminders.join("\n"));
  }
  return emptyResponse();
});
