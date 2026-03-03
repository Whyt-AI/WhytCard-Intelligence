#!/usr/bin/env node
/**
 * Merge plugin registration into installed_plugins.json and settings.json.
 * Called by install-plugin.ps1 — avoids PowerShell JSON quirks.
 */
const fs = require("fs");

const [installedPath, settingsPath, pluginId, installPath] = process.argv.slice(2);
if (!installedPath || !settingsPath || !pluginId || !installPath) {
  console.error("Usage: node install-json-merge.js <installed_plugins.json> <settings.json> <pluginId> <installPath>");
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
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");

console.log("OK");
