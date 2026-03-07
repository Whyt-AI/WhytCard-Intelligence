#!/usr/bin/env node
"use strict";

/**
 * wi-update-step-state.js
 * Update one pipeline step status and keep currentStep in sync.
 *
 * Usage:
 *   node scripts/wi-update-step-state.js "<projectId>" "<stepId>" "<status>"
 *   node scripts/wi-update-step-state.js "<projectId>" "<stepId>" "<status>" "<note>"
 */

const fs = require("node:fs");
const path = require("node:path");

const VALID_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "PASSED",
  "FAILED",
  "BLOCKED",
]);

function safeProjectId(input) {
  return String(input || "")
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normalizeStepId(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits) return `S${digits.padStart(3, "0")}`;
  const cleaned = raw.replace(/[^A-Z0-9_-]/g, "");
  return cleaned.startsWith("S") ? cleaned : `S${cleaned}`;
}

function fail(message, code = 1) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(code);
}

function readJson(pathname) {
  try {
    return JSON.parse(fs.readFileSync(pathname, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON at ${pathname}: ${error.message}`, 2);
  }
}

function writeJson(pathname, value) {
  fs.writeFileSync(pathname, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function rel(repoRoot, targetPath) {
  return path.relative(repoRoot, targetPath).replace(/\\/g, "/");
}

function nextIncompleteStepId(steps, currentId) {
  const list = Array.isArray(steps) ? steps : [];
  const currentIndex = list.findIndex((step) => step && step.id === currentId);
  const ordered = currentIndex >= 0 ? [...list.slice(currentIndex + 1), ...list.slice(0, currentIndex)] : list;

  const candidate = ordered.find(
    (step) => step && step.status !== "PASSED",
  );
  return candidate ? candidate.id : currentId;
}

function main() {
  const [rawProjectId, rawStepId, rawStatus, rawNote] = process.argv.slice(2);
  const projectId = safeProjectId(rawProjectId);
  const stepId = normalizeStepId(rawStepId);
  const status = String(rawStatus || "").trim().toUpperCase();
  const note = String(rawNote || "").trim();

  if (!projectId || !stepId || !VALID_STATUSES.has(status)) {
    fail(
      'Usage: node scripts/wi-update-step-state.js "<projectId>" "<stepId>" "<PENDING|IN_PROGRESS|PASSED|FAILED|BLOCKED>" ["<note>"]',
      2,
    );
  }

  const repoRoot = process.cwd();
  const statePath = path.join(
    repoRoot,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "state.json",
  );
  if (!fs.existsSync(statePath)) fail(`Missing pipeline state: ${statePath}`, 3);

  const state = readJson(statePath);
  if (!Array.isArray(state.steps)) state.steps = [];
  const step = state.steps.find((entry) => entry && entry.id === stepId);
  if (!step) fail(`Step ${stepId} not found in pipeline/state.json`, 4);

  const now = new Date().toISOString();
  if (status === "IN_PROGRESS") {
    step.attempts = Number(step.attempts || 0) + 1;
  }

  step.status = status;
  step.updatedAt = now;
  if (note) step.lastNote = note;

  if (!Array.isArray(state.history)) state.history = [];
  state.history.push({
    at: now,
    stepId,
    status,
    note: note || "",
  });

  state.updatedAt = now;
  state.currentStep =
    status === "PASSED"
      ? nextIncompleteStepId(state.steps, stepId)
      : stepId;

  writeJson(statePath, state);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectId,
        stepId,
        status,
        attempts: Number(step.attempts || 0),
        currentStep: state.currentStep,
        statePath: rel(repoRoot, statePath),
      },
      null,
      2,
    ) + "\n",
  );
}

main();
