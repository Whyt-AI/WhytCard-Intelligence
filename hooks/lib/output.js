/**
 * Shared output utilities for WhytCard Intelligence hooks.
 *
 * Cursor hook contracts evolve. We prefer the official output fields documented
 * in Cursor docs (additional_context, permission, continue, etc.) so behavior
 * remains stable across updates.
 */

const fs = require("fs");
const path = require("path");

// ─── Platform detection ────────────────────────────────────────────────

/**
 * Detect which platform is running this hook.
 * Returns "cursor" | "unknown"
 */
function detectPlatform() {
  if (process.env.CURSOR_PLUGIN_ROOT || process.env.__CURSOR_HOOKS__)
    return "cursor";
  // Heuristic: check if we're inside a .cursor directory structure
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, ".cursor"))) return "cursor";
  return "unknown";
}

// ─── Output formatting ─────────────────────────────────────────────────

function stringify(payload) {
  return JSON.stringify(payload || {});
}

/**
 * Output an empty response (no action needed).
 */
function emptyResponse() {
  return stringify({});
}

/**
 * `sessionStart` output: inject startup context and optional env vars.
 */
function sessionStartOutput(additionalContext, env) {
  const payload = {};
  if (additionalContext) payload.additional_context = String(additionalContext);
  if (env && typeof env === "object" && Object.keys(env).length > 0) {
    payload.env = env;
  }
  return stringify(payload);
}

/**
 * `postToolUse` output: inject context after tool execution.
 */
function postToolUseContext(additionalContext) {
  if (!additionalContext) return emptyResponse();
  return stringify({ additional_context: String(additionalContext) });
}

/**
 * `preToolUse` deny response.
 *
 * `permission` controls tool execution. `user_message` is shown in the UI.
 * `agent_message` is fed back to the model for recovery behavior.
 */
function denyPreToolUse(reason, agentMessage) {
  const payload = {
    permission: "deny",
    user_message: String(reason || "Action denied by policy."),
  };
  if (agentMessage) payload.agent_message = String(agentMessage);
  return stringify(payload);
}

/**
 * `beforeSubmitPrompt` deny response.
 */
function denyBeforeSubmitPrompt(reason) {
  return stringify({
    continue: false,
    user_message: String(reason || "Prompt blocked by policy."),
  });
}

/**
 * `beforeSubmitPrompt` explicit allow response.
 */
function allowBeforeSubmitPrompt() {
  return stringify({ continue: true });
}

// ─── Shared utilities ───────────────────────────────────────────────────

/**
 * File extensions that affect visual output and require screenshot verification.
 */
const VISUAL_EXTENSIONS = [
  ".tsx",
  ".jsx", // React components
  ".vue",
  ".svelte",
  ".astro", // Other UI frameworks
  ".css",
  ".scss",
  ".sass",
  ".less", // Stylesheets
  ".module.css",
  ".module.scss", // CSS modules
  ".html", // HTML templates
];

/**
 * Check if a file path represents a visual/UI file.
 * @param {string} filePath — lowercase file path
 */
function isVisualFile(filePath) {
  return VISUAL_EXTENSIONS.some((ext) => filePath.endsWith(ext));
}

/**
 * Load per-project config from wi-config.json. Returns defaults if not found.
 * @param {string} cwd — current working directory
 */
function loadConfig(cwd) {
  const defaults = {
    visualVerification: true,
    viewports: [375, 768, 1440],
    darkModeCheck: true,
    researchFirst: true,
    versionCheck: true,
  };
  const configPath = path.join(cwd, "wi-config.json");
  if (!fs.existsSync(configPath)) return defaults;
  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { ...defaults, ...userConfig };
  } catch (err) {
    process.stderr.write(
      `wi-config: failed to parse wi-config.json — ${err.message}\n`,
    );
    return defaults;
  }
}

/**
 * Resolve the plugin root directory for Cursor hooks.
 * Falls back to deriving from __dirname of the calling script.
 */
function getPluginRoot() {
  return process.env.CURSOR_PLUGIN_ROOT || path.join(__dirname, "..", "..");
}

/**
 * Read stdin as a string, parse as JSON, then call handler.
 * Standard pattern for all hooks.
 * @param {function} handler — function(data) that returns a JSON string
 */
function handleStdin(handler) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (input += c));
  process.stdin.on("end", () => {
    let data;
    try {
      data = JSON.parse(input);
    } catch {
      process.stdout.write(emptyResponse());
      return;
    }
    try {
      const result = handler(data);
      process.stdout.write(result);
    } catch (err) {
      process.stderr.write(`wi-hook error: ${err.message}\n`);
      process.stdout.write(emptyResponse());
    }
  });
}

module.exports = {
  detectPlatform,
  emptyResponse,
  sessionStartOutput,
  postToolUseContext,
  denyPreToolUse,
  denyBeforeSubmitPrompt,
  allowBeforeSubmitPrompt,
  isVisualFile,
  loadConfig,
  getPluginRoot,
  handleStdin,
  VISUAL_EXTENSIONS,
};
