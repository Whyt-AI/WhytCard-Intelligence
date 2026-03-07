#!/usr/bin/env node
"use strict";

/**
 * sync-project-cursor.js
 * Synchronize WhytCard plugin-managed assets into a project's local `.cursor/`.
 *
 * This keeps repo-local instructions, rules, commands, agents, hooks, and helper
 * scripts aligned with the installed plugin, without relying on project-level
 * active hooks.json.
 *
 * Usage:
 *   node scripts/sync-project-cursor.js "<projectRoot>"
 *   node scripts/sync-project-cursor.js
 */

const fs = require("node:fs");
const path = require("node:path");

const pluginRoot = path.join(__dirname, "..");

const ASSET_GROUPS = [
  {
    sourceDir: "commands",
    targetDir: "commands",
    match: (name) => /^wi-.*\.md$/i.test(name),
  },
  {
    sourceDir: "skills",
    targetDir: "skills",
    match: (name) => /^sk-wi-/i.test(name),
    directoryMode: true,
  },
  {
    sourceDir: "agents",
    targetDir: "agents",
    match: (name) => /^whytcard-.*\.md$/i.test(name),
  },
  {
    sourceDir: "rules",
    targetDir: "rules",
    match: (name) =>
      /^(orchestrator-identity|execution-tracking|visual-verify|version-check|research-first|brainstorm)\.mdc$/i.test(
        name,
      ),
  },
  {
    sourceDir: "hooks",
    targetDir: "hooks",
    match: (name) =>
      /^wi-.*\.js$/i.test(name) ||
      /^hooks\.(cursor|claude)\.json$/i.test(name) ||
      /^lib$/i.test(name),
    directoryMode: (name) => /^lib$/i.test(name),
  },
  {
    sourceDir: "scripts",
    targetDir: "scripts",
    match: (name) =>
      /^wi-.*\.js$/i.test(name) ||
      /^install-.*\.(ps1|sh|js)$/i.test(name) ||
      /^(validate-cursor-hooks|test-plugin|sync-project-cursor|audit-standalone)\.js$/i.test(name),
  },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function rel(from, target) {
  return path.relative(from, target).replace(/\\/g, "/");
}

function main() {
  const projectRootArg = process.argv[2];
  const projectRoot = path.resolve(projectRootArg || process.cwd());
  const cursorRoot = path.join(projectRoot, ".cursor");
  ensureDir(cursorRoot);

  const copied = [];

  for (const group of ASSET_GROUPS) {
    const sourceRoot = path.join(pluginRoot, group.sourceDir);
    if (!fs.existsSync(sourceRoot)) continue;

    const targetRoot = path.join(cursorRoot, group.targetDir);
    ensureDir(targetRoot);

    for (const existingName of fs.readdirSync(targetRoot)) {
      if (group.match(existingName)) {
        removeIfExists(path.join(targetRoot, existingName));
      }
    }

    for (const entryName of fs.readdirSync(sourceRoot)) {
      if (!group.match(entryName)) continue;
      const sourcePath = path.join(sourceRoot, entryName);
      const isDirectory =
        typeof group.directoryMode === "function"
          ? group.directoryMode(entryName)
          : Boolean(group.directoryMode);
      const targetPath = path.join(targetRoot, entryName);

      removeIfExists(targetPath);
      if (isDirectory) {
        copyRecursive(sourcePath, targetPath);
      } else {
        copyRecursive(sourcePath, targetPath);
      }
      copied.push(rel(projectRoot, targetPath));
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectRoot,
        cursorRoot: rel(projectRoot, cursorRoot),
        copied,
        note: "Project-local .cursor assets synced. Active hooks remain managed globally in ~/.cursor/hooks.json unless you intentionally wire project-level hooks yourself.",
      },
      null,
      2,
    ) + "\n",
  );
}

main();
