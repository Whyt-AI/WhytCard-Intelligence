#!/usr/bin/env node
/**
 * wi-pre-edit-gate — PreToolUse hook for Edit/Write/NotebookEdit
 *
 * Two roles:
 * 1. Remind the orchestrator to DELEGATE if it tries to edit application code
 * 2. Inject quality reminders (visual, version, research) for legitimate edits
 *
 * Does NOT block tool execution — injects context reminders.
 * Works on both Claude Code and Cursor via shared output module.
 */

const { handleStdin, injectContext, emptyResponse, isVisualFile, loadConfig } = require("./lib/output");

// Paths that are orchestration work (allowed for the orchestrator to edit directly)
const ORCHESTRATION_PATTERNS = [
  /\.whytcard[/\\]/i,
  /\.cursor[/\\]/i,
  /\.claude[/\\]/i,
  /pipeline[/\\]/i,
  /wi-config\.json$/i,
  /\.mdc$/i,
  /\.md$/i,
  /plugin\.json$/i,
  /hooks\.json$/i,
  /CLAUDE\.md$/i,
  /AGENTS\.md$/i,
];

// Paths that are application code (should be delegated to agents)
const APPLICATION_PATTERNS = [
  /[/\\]src[/\\]/i,
  /[/\\]app[/\\]/i,
  /[/\\]apps[/\\]/i,
  /[/\\]packages[/\\]/i,
  /[/\\]components[/\\]/i,
  /[/\\]lib[/\\]/i,
  /[/\\]services[/\\]/i,
  /[/\\]utils[/\\]/i,
  /[/\\]pages[/\\]/i,
  /[/\\]routes[/\\]/i,
  /[/\\]api[/\\]/i,
  /[/\\]server[/\\]/i,
  /[/\\]tests?[/\\]/i,
  /[/\\]__tests__[/\\]/i,
  /\.tsx$/i,
  /\.jsx$/i,
  /\.vue$/i,
  /\.svelte$/i,
  /\.rs$/i,
  /\.py$/i,
  /\.go$/i,
];

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
  const filePath = toolInput.file_path || "";
  const filePathLower = filePath.toLowerCase();
  const cwd = data.cwd || process.cwd();
  const config = loadConfig(cwd);
  const reminders = [];

  // ── Orchestrator delegation reminder ──
  if (isApplicationCode(filePath)) {
    reminders.push(
      `WC-ORCHESTRATOR: You are editing application code (${filePath}). As the orchestrator, you delegate code work to subagents. Create an agent with the relevant skill and delegate this task. Only edit .whytcard/, config files, and pipeline artifacts directly.`
    );
  }

  // ── Visual file → remind to evaluate with visual-verify grid ──
  if (config.visualVerification && isVisualFile(filePathLower)) {
    const vp = config.viewports || [375, 768, 1440];
    reminders.push(
      `WC-VISUAL: Visual file detected. After editing, evaluate with rules/visual-verify.mdc: screenshots at ${vp.length} viewports (${vp.join("/")}px), dark+light modes.`
    );
  }

  // ── package.json → remind to evaluate with version-check grid ──
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

  // ── New file creation → remind research-first evaluation ──
  if (config.researchFirst && toolName === "Write" && !isOrchestrationFile(filePathLower)) {
    reminders.push(
      "WC-RESEARCH: New file creation. Evaluate with rules/research-first.mdc: was the approach researched? dual-angle? alternatives considered?"
    );
  }

  if (reminders.length > 0) {
    return injectContext("PreToolUse", reminders.join("\n"));
  }
  return emptyResponse();
});
