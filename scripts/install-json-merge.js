#!/usr/bin/env node
/**
 * Merge plugin registration into installed_plugins.json and settings.json.
 * Called by install-plugin.ps1 — avoids PowerShell JSON quirks.
 */
const fs = require("fs");
const path = require("path");

const [installedPath, settingsPath, pluginId, installPath] =
  process.argv.slice(2);
if (!installedPath || !settingsPath || !pluginId || !installPath) {
  console.error(
    "Usage: node install-json-merge.js <installed_plugins.json> <settings.json> <pluginId> <installPath>",
  );
  process.exit(1);
}

const entry = { scope: "user", installPath };

// installed_plugins.json
let installed = { version: 2, plugins: {} };
try {
  installed = JSON.parse(fs.readFileSync(installedPath, "utf8"));
} catch {}
installed.plugins = installed.plugins || {};
installed.plugins[pluginId] = [entry]; // merge: garde les autres plugins
fs.writeFileSync(installedPath, JSON.stringify(installed, null, 2), "utf8");

// settings.json
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
} catch {}
settings.enabledPlugins = settings.enabledPlugins || {};
settings.enabledPlugins[pluginId] = true;

// Prune broken user-level hooks that point to missing files.
// Prevents stale command hooks from crashing the host hook runner.
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

function pathExists(p) {
  if (!p) return false;
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function pruneBrokenHooks(hooksRoot) {
  if (!hooksRoot || typeof hooksRoot !== "object")
    return { hooks: hooksRoot, removed: 0 };
  let removed = 0;
  const next = {};

  for (const [eventName, matchers] of Object.entries(hooksRoot)) {
    if (!Array.isArray(matchers)) {
      next[eventName] = matchers;
      continue;
    }

    const keptMatchers = [];
    for (const matcherBlock of matchers) {
      const block =
        matcherBlock && typeof matcherBlock === "object"
          ? { ...matcherBlock }
          : matcherBlock;
      if (!block || typeof block !== "object" || !Array.isArray(block.hooks)) {
        keptMatchers.push(block);
        continue;
      }

      const keptHooks = [];
      for (const h of block.hooks) {
        const hook = h && typeof h === "object" ? h : null;
        if (!hook || hook.type !== "command") {
          keptHooks.push(h);
          continue;
        }
        const target = parseNodeTarget(hook.command);
        if (!target) {
          keptHooks.push(h);
          continue;
        }

        // Normalize common Windows forward-slash paths (works fine for existsSync too).
        const normalized = target.replace(/\//g, path.sep);
        if (!pathExists(normalized) && !pathExists(target)) {
          removed += 1;
          continue;
        }
        keptHooks.push(h);
      }

      if (keptHooks.length > 0) {
        block.hooks = keptHooks;
        keptMatchers.push(block);
      } else {
        removed += 1;
      }
    }

    if (keptMatchers.length > 0) next[eventName] = keptMatchers;
  }

  return { hooks: next, removed };
}

const beforeHooks = settings.hooks;
const pruned = pruneBrokenHooks(beforeHooks);
if (pruned.removed > 0) {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    fs.writeFileSync(
      `${settingsPath}.bak-${ts}`,
      JSON.stringify(settings, null, 2),
      "utf8",
    );
  } catch {}
  settings.hooks = pruned.hooks;
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");

console.log("OK");
