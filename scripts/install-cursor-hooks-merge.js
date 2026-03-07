#!/usr/bin/env node
"use strict";

/**
 * Merge WhytCard Intelligence hooks into Cursor user-level hooks.json.
 *
 * Cursor expects each hook event to map to an array of hook objects:
 *   { command: "...", timeout?: number, matcher?: string }
 * or prompt-based variants:
 *   { type: "prompt", prompt: "...", timeout?: number, matcher?: string }
 *
 * Older WhytCard installs wrote nested matcher blocks. This script migrates any
 * legacy nested format it encounters while merging the current desired hooks.
 */

const fs = require("node:fs");
const path = require("node:path");

const [cursorHooksPath, pluginName, pluginInstallPath] = process.argv.slice(2);
if (!cursorHooksPath || !pluginName || !pluginInstallPath) {
  process.stderr.write(
    "Usage: node install-cursor-hooks-merge.js <cursorHooksPath> <pluginName> <pluginInstallPath>\n",
  );
  process.exit(1);
}

function readJsonOrDefault(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function pathExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch {
    return false;
  }
}

function parseNodeTarget(command) {
  const text = String(command || "").trim();
  if (!text.toLowerCase().startsWith("node ")) return null;
  let target = text.slice(5).trim();
  if (
    (target.startsWith('"') && target.endsWith('"')) ||
    (target.startsWith("'") && target.endsWith("'"))
  ) {
    target = target.slice(1, -1);
  }
  return target || null;
}

function canonicalizeCommand(command) {
  return String(command || "")
    .trim()
    .replace(/\s+/g, " ");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeEventName(eventName) {
  const name = String(eventName || "").trim();
  const map = {
    SessionStart: "sessionStart",
    UserPromptSubmit: "beforeSubmitPrompt",
    PreToolUse: "preToolUse",
    PostToolUse: "postToolUse",
    Stop: "stop",
  };
  return map[name] || name;
}

function resolveCursorPluginRootInCommand(command) {
  const normalizedInstallPath = pluginInstallPath.replace(/\\/g, "/");
  return String(command || "").replace(
    /\$CURSOR_PLUGIN_ROOT/g,
    normalizedInstallPath,
  );
}

function isLegacyConflictHook(hook) {
  if (!hook || typeof hook !== "object") return false;
  const src = String(hook._source || "").toLowerCase();
  if (src === "whytcardai-plugin" || src === "whytcard-ai-plugin") return true;
  const cmd = String(hook.command || "").toLowerCase();
  return (
    cmd.includes("\\plugins\\whytcardai-plugin\\") ||
    cmd.includes("/plugins/whytcardai-plugin/")
  );
}

function hookKey(hook) {
  if (!hook || typeof hook !== "object") return "invalid";
  const type = String(hook.type || "command");
  const matcher = JSON.stringify(hook.matcher ?? "");
  const timeout = Number.isFinite(hook.timeout) ? hook.timeout : "";
  if (type === "prompt") {
    return `prompt:${String(hook.prompt || "").trim()}:${matcher}:${timeout}`;
  }
  return `command:${canonicalizeCommand(hook.command)}:${matcher}:${timeout}`;
}

function uniqueHooks(hooks) {
  const seen = new Set();
  const out = [];
  for (const hook of hooks || []) {
    const key = hookKey(hook);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hook);
  }
  return out;
}

function normalizeHookEntry(entry, inheritedMatcher = "", options = {}) {
  if (!entry || typeof entry !== "object") return [];

  // Migrate legacy nested matcher blocks: { matcher, hooks: [...] }
  if (Array.isArray(entry.hooks)) {
    const blockMatcher = String(entry.matcher || inheritedMatcher || "");
    return entry.hooks.flatMap((innerHook) =>
      normalizeHookEntry(innerHook, blockMatcher, options),
    );
  }

  const hook = clone(entry);
  if (!hook.matcher && inheritedMatcher) hook.matcher = inheritedMatcher;

  const type = String(hook.type || "command");
  if (type === "command" || !hook.type) {
    hook.type = "command";
    if (
      options.resolvePluginRoot ||
      String(hook.command || "").includes("$CURSOR_PLUGIN_ROOT")
    ) {
      hook.command = resolveCursorPluginRootInCommand(hook.command);
    }
    const target = parseNodeTarget(hook.command);
    if (target) {
      const normalized = target.replace(/\//g, path.sep);
      if (!pathExists(target) && !pathExists(normalized)) {
        if (options.strictMissingTarget) {
          process.stderr.write(
            `ERROR: hook command target missing: ${hook.command}\n`,
          );
          process.exit(2);
        }
      }
    }
  }

  if (options.tagSource) {
    hook._source = pluginName;
  }
  return [hook];
}

function cleanHook(hook) {
  if (!hook || typeof hook !== "object") return null;
  if (isLegacyConflictHook(hook)) return null;

  const cleaned = clone(hook);
  const type = String(cleaned.type || "command");

  if (type === "prompt") {
    if (typeof cleaned.prompt !== "string" || !cleaned.prompt.trim()) {
      return null;
    }
    cleaned.type = "prompt";
    return cleaned;
  }

  cleaned.type = "command";
  if (typeof cleaned.command !== "string" || !cleaned.command.trim()) {
    return null;
  }

  const target = parseNodeTarget(cleaned.command);
  if (target) {
    const normalized = target.replace(/\//g, path.sep);
    if (!pathExists(target) && !pathExists(normalized)) {
      return null;
    }
  }

  return cleaned;
}

function flattenEventHooks(entries, options = {}) {
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry) => normalizeHookEntry(entry, "", options));
}

function loadDesiredHooksFromTemplate() {
  const hooksJsonPath = path.join(
    pluginInstallPath,
    "hooks",
    "hooks.cursor.json",
  );
  const doc = readJsonOrDefault(hooksJsonPath, null);
  if (!doc || typeof doc !== "object" || !doc.hooks) {
    process.stderr.write(
      `ERROR: invalid hooks template: ${hooksJsonPath} (missing hooks object)\n`,
    );
    process.exit(3);
  }

  const desired = {};
  for (const [eventName, entries] of Object.entries(doc.hooks)) {
    const normalizedEventName = normalizeEventName(eventName);
    desired[normalizedEventName] = uniqueHooks(
      flattenEventHooks(entries, {
        resolvePluginRoot: true,
        strictMissingTarget: true,
        tagSource: true,
      })
        .map((hook) => cleanHook(hook))
        .filter(Boolean),
    );
  }
  return desired;
}

function mergeHookArrays(existingHooks, desiredHooks) {
  return uniqueHooks(
    [...(existingHooks || []), ...(desiredHooks || [])]
      .map((hook) => cleanHook(hook))
      .filter(Boolean),
  );
}

const desired = loadDesiredHooksFromTemplate();
const prev = readJsonOrDefault(cursorHooksPath, { version: 1, hooks: {} });
const prevHooksNormalized = {};

for (const [eventName, entries] of Object.entries(prev.hooks || {})) {
  const normalizedEventName = normalizeEventName(eventName);
  prevHooksNormalized[normalizedEventName] = mergeHookArrays(
    prevHooksNormalized[normalizedEventName] || [],
    flattenEventHooks(entries),
  );
}

const next = { version: 1, hooks: {} };
const allEventNames = new Set([
  ...Object.keys(prevHooksNormalized),
  ...Object.keys(desired),
]);

for (const eventName of allEventNames) {
  const merged = mergeHookArrays(
    prevHooksNormalized[eventName] || [],
    desired[eventName] || [],
  );
  if (merged.length > 0) {
    next.hooks[eventName] = merged;
  }
}

const prevText = (() => {
  try {
    return fs.readFileSync(cursorHooksPath, "utf8");
  } catch {
    return "";
  }
})();
const nextText = JSON.stringify(next, null, 2) + "\n";
if (prevText !== nextText && prevText) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  try {
    fs.writeFileSync(`${cursorHooksPath}.bak-${ts}`, prevText, "utf8");
  } catch {
    // Best-effort backup only.
  }
}

writeJson(cursorHooksPath, next);
process.stdout.write("OK\n");
