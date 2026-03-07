#!/usr/bin/env node
"use strict";

/**
 * Merge WhytCard Intelligence hooks into Cursor user-level hooks.json.
 *
 * Cursor native hooks config location (Windows): %USERPROFILE%\.cursor\hooks.json
 * Docs: https://cursor.com/docs/agent/hooks
 *
 * Goals:
 * - Install WhytCard Intelligence hooks globally (no marketplace required)
 * - Idempotent merge (no duplicates)
 * - Prune broken command hooks (commands pointing to missing scripts), regardless of source
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

function readJsonOrDefault(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function pathExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function parseNodeTarget(command) {
  const s = String(command || "").trim();
  if (!s.toLowerCase().startsWith("node ")) return null;
  let t = s.slice(5).trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1);
  }
  return t.trim() || null;
}

function canonicalizeCommand(cmd) {
  return String(cmd || "")
    .trim()
    .replace(/\s+/g, " ");
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function hookKey(hook) {
  if (!hook || typeof hook !== "object") return "invalid";
  const type = String(hook.type || "");
  if (type === "command") return `command:${canonicalizeCommand(hook.command)}`;
  if (type === "prompt") return `prompt:${String(hook.prompt || "").trim()}`;
  return `other:${JSON.stringify(hook)}`;
}

function uniqueHooks(hooks) {
  const out = [];
  const seen = new Set();
  for (const hook of hooks || []) {
    const key = hookKey(hook);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hook);
  }
  return out;
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

function resolveCursorPluginRootInCommand(command) {
  const normalizedInstallPath = pluginInstallPath.replace(/\\/g, "/");
  return String(command || "").replace(
    /\$CURSOR_PLUGIN_ROOT/g,
    normalizedInstallPath,
  );
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
  for (const [eventName, matcherBlocks] of Object.entries(doc.hooks)) {
    if (!Array.isArray(matcherBlocks)) continue;
    desired[eventName] = [];
    for (const block of matcherBlocks) {
      if (!block || typeof block !== "object" || !Array.isArray(block.hooks))
        continue;
      const normalizedBlock = {
        matcher: String(block.matcher || ""),
        hooks: [],
      };
      for (const hook of block.hooks) {
        if (!hook || typeof hook !== "object") continue;
        const nextHook = clone(hook);
        if (nextHook.type === "command") {
          nextHook.command = resolveCursorPluginRootInCommand(nextHook.command);
          const target = parseNodeTarget(nextHook.command);
          if (target) {
            const normalized = target.replace(/\//g, path.sep);
            if (!pathExists(target) && !pathExists(normalized)) {
              process.stderr.write(
                `ERROR: hook command target missing for ${eventName}: ${nextHook.command}\n`,
              );
              process.exit(2);
            }
          }
        }
        nextHook._source = pluginName;
        normalizedBlock.hooks.push(nextHook);
      }
      normalizedBlock.hooks = uniqueHooks(normalizedBlock.hooks);
      if (normalizedBlock.hooks.length > 0) {
        desired[eventName].push(normalizedBlock);
      }
    }
  }
  return desired;
}

function cleanHooksInBlock(block) {
  if (!block || typeof block !== "object" || !Array.isArray(block.hooks))
    return null;

  const keptHooks = [];
  for (const hook of block.hooks) {
    if (!hook || typeof hook !== "object") continue;
    if (isLegacyConflictHook(hook)) continue;
    if (hook.type !== "command") {
      keptHooks.push(hook);
      continue;
    }
    const target = parseNodeTarget(hook.command);
    if (!target) {
      keptHooks.push(hook);
      continue;
    }
    const normalized = target.replace(/\//g, path.sep);
    if (!pathExists(target) && !pathExists(normalized)) {
      continue;
    }
    keptHooks.push(hook);
  }

  const unique = uniqueHooks(keptHooks);
  if (unique.length === 0) return null;
  return {
    ...block,
    matcher: String(block.matcher || ""),
    hooks: unique,
  };
}

function mergeMatcherBlocks(existingBlocks, desiredBlocks) {
  const out = [];
  const matcherToIndex = new Map();

  for (const block of existingBlocks || []) {
    const cleaned = cleanHooksInBlock(block);
    if (!cleaned) continue;
    const matcher = String(cleaned.matcher || "");
    matcherToIndex.set(matcher, out.length);
    out.push(cleaned);
  }

  for (const desiredBlock of desiredBlocks || []) {
    const cleanedDesired = cleanHooksInBlock(desiredBlock);
    if (!cleanedDesired) continue;
    const matcher = String(cleanedDesired.matcher || "");
    if (!matcherToIndex.has(matcher)) {
      matcherToIndex.set(matcher, out.length);
      out.push(cleanedDesired);
      continue;
    }
    const idx = matcherToIndex.get(matcher);
    const mergedHooks = uniqueHooks([
      ...(out[idx].hooks || []),
      ...(cleanedDesired.hooks || []),
    ]);
    out[idx] = { ...out[idx], hooks: mergedHooks };
  }

  return out
    .map((block) => cleanHooksInBlock(block))
    .filter((block) => block !== null);
}

const desired = loadDesiredHooksFromTemplate();

const prev = readJsonOrDefault(cursorHooksPath, { version: 1, hooks: {} });
const next = {
  version: 1,
  hooks: {},
};

const allEventNames = new Set([
  ...Object.keys(prev.hooks || {}),
  ...Object.keys(desired),
]);

for (const eventName of allEventNames) {
  const existingBlocks = Array.isArray(prev.hooks?.[eventName])
    ? prev.hooks[eventName]
    : [];
  const desiredBlocks = Array.isArray(desired[eventName])
    ? desired[eventName]
    : [];
  const merged = mergeMatcherBlocks(existingBlocks, desiredBlocks);
  if (merged.length > 0) {
    next.hooks[eventName] = merged;
  }
}

// Final safety pass in case any legacy/broken entries remain.
for (const [eventName, blocks] of Object.entries(next.hooks)) {
  if (!Array.isArray(blocks)) continue;
  const cleanedBlocks = blocks
    .map((block) => cleanHooksInBlock(block))
    .filter((block) => block !== null);
  if (cleanedBlocks.length > 0) {
    next.hooks[eventName] = cleanedBlocks;
  } else {
    delete next.hooks[eventName];
  }
}

// Backup if changing.
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
  } catch {}
}

writeJson(cursorHooksPath, next);
process.stdout.write("OK\n");
