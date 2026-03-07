#!/usr/bin/env node
"use strict";

/**
 * audit-standalone.js
 * Verify the plugin remains standalone for Cursor packaging:
 * - no external npm/package dependencies in hook/install/runtime scripts
 * - no machine-specific hardcoded paths or user names in shipped files
 * - no references to local MCP-only tooling in the plugin itself
 */

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");

const SCRIPT_ROOTS = [
  path.join(repoRoot, "hooks"),
  path.join(repoRoot, "scripts"),
];

const TEXT_ROOTS = [
  repoRoot,
];

const ALLOWED_BARE_MODULES = new Set([
  "fs",
  "path",
  "os",
  "crypto",
  "child_process",
]);

const TEXT_FILE_EXTENSIONS = new Set([
  ".js",
  ".json",
  ".md",
  ".mdc",
  ".ps1",
  ".sh",
]);

const FORBIDDEN_TEXT_PATTERNS = [
  { pattern: /C:\\Users\\/i, label: "hardcoded Windows user path" },
  { pattern: /\/Users\//, label: "hardcoded macOS user path" },
  { pattern: /Jerome/i, label: "hardcoded local username" },
  { pattern: /AppData[\\/]/i, label: "hardcoded AppData path" },
  { pattern: /globalStorage[\\/]/i, label: "hardcoded Cursor globalStorage path" },
  { pattern: /whytcard\.db/i, label: "hardcoded local WhytCard DB path" },
  { pattern: /\bCallMcpTool\b/, label: "plugin should not depend on MCP tool calls" },
  { pattern: /\bbrainConsult\b/, label: "plugin should not depend on Brain MCP at runtime" },
  { pattern: /\bclear_thought\b/, label: "plugin should not depend on Clear Thought MCP at runtime" },
  { pattern: /\buser-whytcard\b/, label: "plugin should not reference local MCP server ids" },
  { pattern: /\buser-clear-thought\b/, label: "plugin should not reference local MCP server ids" },
];

function fail(message) {
  process.stderr.write(`FAIL: ${message}\n`);
  process.exit(1);
}

function walk(dirPath, visitor) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, visitor);
      continue;
    }
    visitor(fullPath);
  }
}

function auditScriptRequires() {
  const requireRegex = /require\(\s*["']([^"']+)["']\s*\)/g;

  for (const root of SCRIPT_ROOTS) {
    walk(root, (filePath) => {
      if (path.extname(filePath) !== ".js") return;
      const source = fs.readFileSync(filePath, "utf8");
      for (const match of source.matchAll(requireRegex)) {
        const specifier = match[1];
        if (
          specifier.startsWith("./") ||
          specifier.startsWith("../") ||
          specifier.startsWith("node:") ||
          ALLOWED_BARE_MODULES.has(specifier)
        ) {
          continue;
        }

        fail(
          `Non-standalone module import in ${path.relative(repoRoot, filePath)}: ${specifier}`,
        );
      }
    });
  }
}

function auditTextFiles() {
  for (const root of TEXT_ROOTS) {
    walk(root, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (!TEXT_FILE_EXTENSIONS.has(ext)) return;

      const relPath = path.relative(repoRoot, filePath).replace(/\\/g, "/");
      if (relPath.startsWith(".cursor/")) return;
      if (relPath === "scripts/audit-standalone.js") return;

      const source = fs.readFileSync(filePath, "utf8");
      for (const entry of FORBIDDEN_TEXT_PATTERNS) {
        if (entry.pattern.test(source)) {
          fail(`${entry.label} found in ${relPath}`);
        }
      }
    });
  }
}

function main() {
  auditScriptRequires();
  auditTextFiles();
  process.stdout.write("OK: standalone audit passed\n");
}

main();
