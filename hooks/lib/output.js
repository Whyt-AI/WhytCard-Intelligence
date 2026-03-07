/**
 * Shared output utilities for WhytCard Intelligence hooks (Cursor-only).
 *
 * Detects the running platform and outputs the hook JSON payload.
 * This is the single source of truth for hook output format — no hook
 * script should construct JSON directly.
 *
 * Platform detection:
 *   - CURSOR_PLUGIN_ROOT env var → Cursor
 *   - __CURSOR_HOOKS__ env var → Cursor (alternative signal)
 *   - Neither → unknown, output Cursor-compatible format
 */

const fs = require("fs");
const path = require("path");

// ─── Platform detection ────────────────────────────────────────────────

/**
 * Detect which platform is running this hook.
 * Returns "cursor" | "unknown"
 */
function detectPlatform() {
  if (process.env.CURSOR_PLUGIN_ROOT || process.env.__CURSOR_HOOKS__) return "cursor";
  // Heuristic: check if we're inside a .cursor directory structure
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, ".cursor"))) return "cursor";
  return "unknown";
}

// ─── Output formatting ─────────────────────────────────────────────────

/**
 * Inject context into the AI agent's conversation.
 * This is the core function — used by session-start, pre-edit, post-edit, and prompt hooks.
 *
 * @param {string} eventName — The hook event (e.g., "SessionStart", "PreToolUse")
 * @param {string} context — The text to inject into the agent's context
 */
function injectContext(eventName, context) {
  const platform = detectPlatform();

  if (platform === "cursor" || platform === "unknown") {
    // Cursor-compatible format.
    // Unknown falls back to the same format for safe no-op behavior.
  }
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: context,
    },
  });
}

/**
 * Output an empty response (no action needed).
 */
function emptyResponse() {
  return JSON.stringify({});
}

/**
 * Block/deny an action with a reason.
 * Used by permission-granting hooks (PreToolUse, Stop).
 *
 * @param {string} eventName — The hook event
 * @param {string} reason — Why the action is blocked
 */
function denyAction(eventName, reason) {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

/**
 * Allow an action (explicit approval).
 *
 * @param {string} eventName — The hook event
 * @param {string} [reason] — Optional reason for allowing
 */
function allowAction(eventName, reason) {
  if (!reason) return emptyResponse();

  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      permissionDecision: "allow",
      permissionDecisionReason: reason,
    },
  });
}

// ─── Shared utilities ───────────────────────────────────────────────────

/**
 * File extensions that affect visual output and require screenshot verification.
 */
const VISUAL_EXTENSIONS = [
  ".tsx", ".jsx",                          // React components
  ".vue", ".svelte", ".astro",             // Other UI frameworks
  ".css", ".scss", ".sass", ".less",       // Stylesheets
  ".module.css", ".module.scss",           // CSS modules
  ".html",                                 // HTML templates
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
    process.stderr.write(`wi-config: failed to parse wi-config.json — ${err.message}\n`);
    return defaults;
  }
}

/**
 * Resolve the plugin root directory for Cursor hooks.
 * Falls back to deriving from __dirname of the calling script.
 */
function getPluginRoot() {
  return (
    process.env.CURSOR_PLUGIN_ROOT ||
    path.join(__dirname, "..", "..")
  );
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
  injectContext,
  emptyResponse,
  denyAction,
  allowAction,
  isVisualFile,
  loadConfig,
  getPluginRoot,
  handleStdin,
  VISUAL_EXTENSIONS,
};
