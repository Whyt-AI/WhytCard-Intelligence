#!/usr/bin/env node
"use strict";

/**
 * wi-create-step.js
 * Create or repair a single pipeline step scaffold without overwriting.
 *
 * Usage:
 *   node scripts/wi-create-step.js "<projectId>" "<stepId>" "<slug>"
 *   node scripts/wi-create-step.js "<projectId>" "<stepId>" "<slug>" "<agentName>"
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeIfMissing(p, content) {
  if (fs.existsSync(p)) return false;
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
  return true;
}

function safeProjectId(input) {
  return String(input || "")
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function safeSlug(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function normalizeStepId(input) {
  const raw = String(input || "").trim().toUpperCase();
  if (!raw) return "";
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits) {
    return `S${digits.padStart(3, "0")}`;
  }
  const cleaned = raw.replace(/[^A-Z0-9_-]/g, "");
  return cleaned.startsWith("S") ? cleaned : `S${cleaned}`;
}

function safeAgentName(input) {
  const agent = String(input || "").trim();
  return agent || "whytcard-implementer";
}

function titleFromSlug(slug) {
  return String(slug || "")
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureProjectScaffold(repoRoot, projectId) {
  const initScriptPath = path.join(__dirname, "wi-init-project.js");
  const result = spawnSync(process.execPath, [initScriptPath, projectId], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "");
    process.exit(result.status || 1);
  }
}

function readJsonOrDefault(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(p, value) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function main() {
  const [rawProjectId, rawStepId, rawSlug, rawAgentName] = process.argv.slice(2);
  const projectId = safeProjectId(rawProjectId);
  const stepId = normalizeStepId(rawStepId);
  const slug = safeSlug(rawSlug);
  const agentName = safeAgentName(rawAgentName);

  if (!projectId || !stepId || !slug) {
    process.stderr.write(
      'Usage: node scripts/wi-create-step.js "<projectId>" "<stepId>" "<slug>" ["<agentName>"]\n',
    );
    process.exit(2);
  }

  const repoRoot = process.cwd();
  ensureProjectScaffold(repoRoot, projectId);

  const projRoot = path.join(repoRoot, ".whytcard", "projects", projectId);
  const statePath = path.join(projRoot, "pipeline", "state.json");
  const stepDirName = `${stepId}-${slug}`;
  const stepRoot = path.join(projRoot, "pipeline", "steps", stepDirName);
  const evidenceRoot = path.join(stepRoot, "evidence");
  const title = titleFromSlug(slug);
  const instructionPath = path.join(stepRoot, "instruction.md");
  const acceptancePath = path.join(stepRoot, "acceptance.md");
  const notesPath = path.join(evidenceRoot, "notes.md");
  const gateLogPath = path.join(evidenceRoot, "gate.log");

  ensureDir(evidenceRoot);

  writeIfMissing(
    instructionPath,
    [
      `# ${stepId}: ${title}`,
      "",
      `> Agent: ${agentName}`,
      `> Slug: ${slug}`,
      "> Status: DRAFT",
      "",
      "## Intent",
      "- Describe the exact micro-action this step should complete.",
      "",
      "## Why now",
      "- Explain why this step is the current dependency, bottleneck, or unlock.",
      "",
      "## Scope (allowed changes)",
      "- List exact files or globs the specialist may touch.",
      "",
      "## Context to read first",
      "- List the exact files, docs, or prior evidence to read before acting.",
      "",
      "## Micro-action",
      "- One verb. One bounded step.",
      "",
      "## Constraints",
      "- Stay inside scope.",
      "- Do not redesign the architecture in this step.",
      "- Write evidence under `evidence/`.",
      "- If blocked, explain the blocker in `evidence/notes.md`.",
      "",
      "## Expected evidence",
      "- `evidence/notes.md`",
      "- `evidence/gate.log` when commands are run",
      "- Any screenshot, log, or artifact required by acceptance",
      "",
    ].join("\n"),
  );

  writeIfMissing(
    acceptancePath,
    [
      `# Acceptance: ${stepId} ${title}`,
      "",
      "- [ ] Scope respected",
      "- [ ] Micro-action completed",
      "- [ ] Required gates run and captured in `evidence/`",
      "- [ ] Evidence paths are named and present",
      "- [ ] No placeholders, no mocks, no unsupported shortcuts",
      "",
    ].join("\n"),
  );

  writeIfMissing(
    notesPath,
    [
      "# Notes",
      "",
      "- Use this file for blockers, observations, or review notes tied to this step.",
      "",
    ].join("\n"),
  );
  writeIfMissing(gateLogPath, "");

  const state = readJsonOrDefault(statePath, {
    version: 1,
    projectId,
    createdAt: new Date().toISOString(),
    currentStep: stepId,
    currentPlan: "pipeline/plan.md",
    steps: [],
  });

  if (!Array.isArray(state.steps)) state.steps = [];
  const existingStep = state.steps.find((step) => step && step.id === stepId);
  if (!existingStep) {
    state.steps.push({
      id: stepId,
      slug,
      title,
      agent: agentName,
      status: "PENDING",
      attempts: 0,
      instructionPath: `pipeline/steps/${stepDirName}/instruction.md`,
      acceptancePath: `pipeline/steps/${stepDirName}/acceptance.md`,
    });
  }
  state.currentStep = stepId;
  writeJson(statePath, state);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        projectId,
        stepId,
        stepRoot: path.relative(repoRoot, stepRoot).replace(/\\/g, "/"),
        createdOrPresent: [
          path.relative(repoRoot, instructionPath).replace(/\\/g, "/"),
          path.relative(repoRoot, acceptancePath).replace(/\\/g, "/"),
          path.relative(repoRoot, notesPath).replace(/\\/g, "/"),
          path.relative(repoRoot, gateLogPath).replace(/\\/g, "/"),
          path.relative(repoRoot, statePath).replace(/\\/g, "/"),
        ],
      },
      null,
      2,
    ) + "\n",
  );
}

main();
