#!/usr/bin/env node
"use strict";

/**
 * Validate Cursor hooks.json integrity for WhytCard install.
 *
 * Current Cursor schema expects each hook event to map to an array of hook
 * objects, not nested matcher blocks.
 */

const fs = require("node:fs");
const path = require("node:path");

const [hooksPath] = process.argv.slice(2);
if (!hooksPath) {
  process.stderr.write("Usage: node validate-cursor-hooks.js <cursorHooksPath>\n");
  process.exit(1);
}

const VALID_EVENTS = new Set([
  "beforeShellExecution",
  "beforeMCPExecution",
  "afterShellExecution",
  "afterMCPExecution",
  "beforeReadFile",
  "afterFileEdit",
  "beforeTabFileRead",
  "afterTabFileEdit",
  "stop",
  "beforeSubmitPrompt",
  "afterAgentResponse",
  "afterAgentThought",
  "sessionStart",
  "sessionEnd",
  "preCompact",
  "subagentStart",
  "subagentStop",
  "preToolUse",
  "postToolUse",
  "postToolUseFailure",
]);

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

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
}

let doc;
try {
  doc = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
} catch (error) {
  fail(`Unable to parse hooks JSON at ${hooksPath}: ${error.message}`);
  process.exit(2);
}

if (!doc || typeof doc !== "object" || typeof doc.hooks !== "object") {
  fail("hooks.json must contain a top-level object with a hooks object.");
  process.exit(2);
}

let hasError = false;
for (const [eventName, entries] of Object.entries(doc.hooks)) {
  if (!VALID_EVENTS.has(eventName)) {
    hasError = true;
    fail(`Unsupported hook event: ${eventName}`);
    continue;
  }

  if (!Array.isArray(entries)) {
    hasError = true;
    fail(`Event ${eventName} must be an array of hook objects.`);
    continue;
  }

  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      hasError = true;
      fail(`Event ${eventName}[${index}] must be a hook object.`);
      continue;
    }

    if (Array.isArray(entry.hooks)) {
      hasError = true;
      fail(
        `Event ${eventName}[${index}] uses legacy nested matcher-block format; hooks must be flat objects with command/prompt at the top level.`,
      );
      continue;
    }

    const type = String(entry.type || "command");
    if (type === "prompt") {
      if (typeof entry.prompt !== "string" || !entry.prompt.trim()) {
        hasError = true;
        fail(`Event ${eventName}[${index}] prompt hook must provide a non-empty prompt string.`);
      }
      continue;
    }

    if (typeof entry.command !== "string" || !entry.command.trim()) {
      hasError = true;
      fail(`Event ${eventName}[${index}] command hook must provide a non-empty command string.`);
      continue;
    }

    const target = parseNodeTarget(entry.command);
    if (!target) continue;

    const normalized = target.replace(/\//g, path.sep);
    if (!fs.existsSync(target) && !fs.existsSync(normalized)) {
      hasError = true;
      fail(
        `Missing command target for event ${eventName}: ${entry.command} (resolved target: ${target})`,
      );
    }
  }
}

if (hasError) {
  process.exit(3);
}

process.stdout.write("OK\n");
