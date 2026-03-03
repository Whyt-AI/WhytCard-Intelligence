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
    "Usage: node install-cursor-hooks-merge.js <cursorHooksPath> <pluginName> <pluginInstallPath>\n"
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
  if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1);
  }
  return t.trim() || null;
}

function canonicalizeCommand(cmd) {
  return String(cmd || "").trim().replace(/\s+/g, " ");
}

function uniqueByCommand(entries) {
  const out = [];
  const seen = new Set();
  for (const e of entries || []) {
    const entry = e && typeof e === "object" ? e : null;
    const cmdKey = canonicalizeCommand(entry && entry.command);
    const promptKey =
      entry && entry.type === "prompt" && typeof entry.prompt === "string"
        ? `prompt:${entry.prompt.trim()}`
        : "";
    const key = cmdKey || promptKey;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

function pruneBrokenCommandEntries(entries) {
  const out = [];
  for (const e of entries || []) {
    if (!e || typeof e !== "object") continue;
    if (!e.command) {
      out.push(e);
      continue;
    }
    const target = parseNodeTarget(e.command);
    if (!target) {
      out.push(e);
      continue;
    }
    const normalized = target.replace(/\//g, path.sep);
    if (pathExists(target) || pathExists(normalized)) {
      out.push(e);
      continue;
    }
    // Drop broken command hook.
  }
  return out;
}

function loadStopPromptFromPlugin() {
  const hooksJsonPath = path.join(pluginInstallPath, "hooks", "hooks.cursor.json");
  const doc = readJsonOrDefault(hooksJsonPath, null);
  if (!doc || !doc.hooks || !doc.hooks.Stop) return null;
  const first = doc.hooks.Stop[0];
  const hook = first && first.hooks && first.hooks[0];
  const prompt = hook && hook.type === "prompt" ? hook.prompt : null;
  return typeof prompt === "string" && prompt.trim() ? prompt : null;
}

const hookScripts = {
  sessionStart: path.join(pluginInstallPath, "hooks", "wi-session-start.js"),
  beforeSubmitPrompt: path.join(pluginInstallPath, "hooks", "wi-prompt-dispatch.js"),
  preToolUse: path.join(pluginInstallPath, "hooks", "wi-pre-edit-gate.js"),
  postToolUse: path.join(pluginInstallPath, "hooks", "wi-post-edit-verify.js"),
};

for (const [k, p] of Object.entries(hookScripts)) {
  if (!pathExists(p)) {
    process.stderr.write(`ERROR: missing hook script for ${k}: ${p}\n`);
    process.exit(2);
  }
}

const stopPrompt = loadStopPromptFromPlugin();

const desired = {
  sessionStart: [
    {
      command: `node "${hookScripts.sessionStart}"`,
      _source: pluginName,
    },
  ],
  beforeSubmitPrompt: [
    {
      command: `node "${hookScripts.beforeSubmitPrompt}"`,
      _source: pluginName,
    },
  ],
  preToolUse: [
    {
      command: `node "${hookScripts.preToolUse}"`,
      matcher: "Edit|Write|NotebookEdit",
      _source: pluginName,
    },
  ],
  postToolUse: [
    {
      command: `node "${hookScripts.postToolUse}"`,
      matcher: "Edit|Write|NotebookEdit",
      _source: pluginName,
    },
  ],
  ...(stopPrompt
    ? {
        stop: [
          {
            type: "prompt",
            prompt: stopPrompt,
            _source: pluginName,
          },
        ],
      }
    : {}),
};

const prev = readJsonOrDefault(cursorHooksPath, { version: 1, hooks: {} });
const next = {
  version: 1,
  hooks: { ...(prev.hooks || {}) },
};

// Merge + prune per hook.
for (const [hookName, addEntries] of Object.entries(desired)) {
  const existing = Array.isArray(next.hooks[hookName]) ? next.hooks[hookName] : [];
  const merged = [...existing, ...addEntries];
  const pruned = pruneBrokenCommandEntries(merged);
  next.hooks[hookName] = uniqueByCommand(pruned);
}

// Also prune broken command entries in *all* hooks (keeps config clean).
for (const [hookName, entries] of Object.entries(next.hooks)) {
  if (!Array.isArray(entries)) continue;
  next.hooks[hookName] = uniqueByCommand(pruneBrokenCommandEntries(entries));
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

