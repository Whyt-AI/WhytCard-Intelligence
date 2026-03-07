#!/usr/bin/env node
"use strict";

/**
 * wi-dispatch-step.js
 * Resolve the current or requested pipeline step into a concrete dispatch payload.
 *
 * Usage:
 *   node scripts/wi-dispatch-step.js "<projectId>"
 *   node scripts/wi-dispatch-step.js "<projectId>" "<stepId>"
 */

const fs = require("node:fs");
const path = require("node:path");

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

function rel(repoRoot, targetPath) {
  return path.relative(repoRoot, targetPath).replace(/\\/g, "/");
}

function getStepDirectoryName(step) {
  if (!step || !step.id || !step.slug) return "";
  return `${step.id}-${step.slug}`;
}

function pickStep(state, requestedStepId) {
  const steps = Array.isArray(state.steps) ? state.steps : [];
  if (requestedStepId) {
    return steps.find((step) => step && step.id === requestedStepId) || null;
  }

  const current = steps.find((step) => step && step.id === state.currentStep);
  if (current && current.status !== "PASSED") return current;

  const priority = ["FAILED", "BLOCKED", "PENDING", "IN_PROGRESS"];
  for (const status of priority) {
    const candidate = steps.find((step) => step && step.status === status);
    if (candidate) return candidate;
  }

  return steps.find((step) => step) || null;
}

function main() {
  const [rawProjectId, rawStepId] = process.argv.slice(2);
  const projectId = safeProjectId(rawProjectId);
  const requestedStepId = normalizeStepId(rawStepId);

  if (!projectId) {
    fail('Usage: node scripts/wi-dispatch-step.js "<projectId>" ["<stepId>"]', 2);
  }

  const repoRoot = process.cwd();
  const projectRoot = path.join(repoRoot, ".whytcard", "projects", projectId);
  const statePath = path.join(projectRoot, "pipeline", "state.json");
  if (!fs.existsSync(statePath)) {
    fail(`Missing pipeline state: ${statePath}`, 3);
  }

  const state = readJson(statePath);
  const step = pickStep(state, requestedStepId);
  if (!step) fail(`No dispatchable step found for project ${projectId}`, 4);

  const stepDirName = getStepDirectoryName(step);
  const stepRoot = path.join(projectRoot, "pipeline", "steps", stepDirName);
  const instructionPath = path.join(stepRoot, "instruction.md");
  const acceptancePath = path.join(stepRoot, "acceptance.md");
  const evidenceRoot = path.join(stepRoot, "evidence");

  if (!fs.existsSync(instructionPath)) {
    fail(`Missing instruction.md for step ${step.id}`, 5);
  }
  if (!fs.existsSync(acceptancePath)) {
    fail(`Missing acceptance.md for step ${step.id}`, 6);
  }

  const agentName = String(step.agent || "whytcard-implementer").trim();
  const invocation = agentName.startsWith("/") ? agentName : `/${agentName}`;
  const dispatchPrompt = [
    `Use ${invocation} for step ${step.id} (${step.title || step.slug}).`,
    `Read \`${rel(repoRoot, instructionPath)}\` and \`${rel(repoRoot, acceptancePath)}\` first.`,
    `Write proof into \`${rel(repoRoot, evidenceRoot)}\`.`,
    "Stay within the scope declared in the step contract.",
    "If blocked, record the blocker in evidence/notes.md before returning.",
  ].join(" ");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectId,
        stepId: step.id,
        slug: step.slug,
        title: step.title || step.slug,
        status: step.status || "PENDING",
        attempts: Number(step.attempts || 0),
        agent: agentName,
        invocation,
        projectRoot: rel(repoRoot, projectRoot),
        stepRoot: rel(repoRoot, stepRoot),
        instructionPath: rel(repoRoot, instructionPath),
        acceptancePath: rel(repoRoot, acceptancePath),
        evidenceRoot: rel(repoRoot, evidenceRoot),
        dispatchPrompt,
      },
      null,
      2,
    ) + "\n",
  );
}

main();
