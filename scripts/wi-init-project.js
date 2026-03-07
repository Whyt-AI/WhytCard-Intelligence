#!/usr/bin/env node
"use strict";

/**
 * wi-init-project.js
 * Create a per-project .whytcard scaffold (no overwrites).
 *
 * Usage:
 *   node scripts/wi-init-project.js "<projectId>"
 *   node scripts/wi-init-project.js
 *
 * Notes:
 * - Creates files only if missing (idempotent).
 * - Keeps content generic (plugin-owned templates), no Whytcard-specific data.
 * - Uses a pipeline-first layout where `pipeline/` is the execution spine.
 */

const fs = require("node:fs");
const path = require("node:path");

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

function main() {
  const rawId = process.argv[2];
  const fallbackId = path.basename(process.cwd());
  const projectId = safeProjectId(rawId) || safeProjectId(fallbackId);
  if (!projectId) {
    process.stderr.write("Usage: node scripts/wi-init-project.js \"<projectId>\"\n");
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const kbRoot = path.join(repoRoot, ".whytcard");
  const projRoot = path.join(kbRoot, "projects", projectId);

  const pipelineRoot = path.join(projRoot, "pipeline");
  const bootstrapStepRoot = path.join(
    pipelineRoot,
    "steps",
    "S000-bootstrap-scaffold",
  );

  // Directories (pipeline-first scaffold + canonical supporting dirs)
  for (const d of [
    kbRoot,
    path.join(kbRoot, "projects"),
    projRoot,
    pipelineRoot,
    path.join(pipelineRoot, "steps"),
    bootstrapStepRoot,
    path.join(bootstrapStepRoot, "evidence"),
    path.join(projRoot, "research"),
    path.join(projRoot, "brainstorms"),
    path.join(projRoot, "plans"),
    path.join(projRoot, "reviews"),
    path.join(projRoot, "proofs"),
  ]) {
    ensureDir(d);
  }

  // Files (generic, minimal, meant to be filled during conversation)
  writeIfMissing(
    path.join(pipelineRoot, "plan.md"),
    [
      "# Active Pipeline Plan",
      "",
      `> Project: ${projectId}`,
      `> Created: ${new Date().toISOString()}`,
      "> Status: DESIGNING",
      "",
      "## Objective (one sentence)",
      "-",
      "",
      "## Constraints (non-negotiable)",
      "- 0 warnings, 0 errors",
      "- No dead code, no duplication",
      "- No mocks/placeholders for real behavior",
      "",
      "## Pipeline contract",
      "- `pipeline/state.json` is the current execution state.",
      "- `pipeline/steps/` contains executable step contracts.",
      "- `plans/` stores supporting plan artifacts and revisions.",
      "",
      "## Next steps",
      "- Fill `plans/` with the first execution plan revision if needed.",
      "- Update `pipeline/state.json` as steps are delegated and validated.",
      "",
    ].join("\n")
  );

  writeIfMissing(
    path.join(pipelineRoot, "state.json"),
    JSON.stringify(
      {
        version: 1,
        projectId,
        createdAt: new Date().toISOString(),
        currentStep: "S000",
        currentPlan: "pipeline/plan.md",
        steps: [
          {
            id: "S000",
            slug: "bootstrap-scaffold",
            title: "Create pipeline-first .whytcard scaffold",
            agent: "orchestrator",
            status: "PENDING",
            attempts: 0,
            instructionPath:
              "pipeline/steps/S000-bootstrap-scaffold/instruction.md",
            acceptancePath:
              "pipeline/steps/S000-bootstrap-scaffold/acceptance.md",
          },
        ],
      },
      null,
      2
    ) + "\n"
  );

  writeIfMissing(
    path.join(bootstrapStepRoot, "instruction.md"),
    [
      "# S000: Bootstrap scaffold",
      "",
      "## Intent",
      "Create a clean, reproducible, pipeline-first `.whytcard` project structure that can drive future delegation and verification.",
      "",
      "## Scope (allowed changes)",
      `- .whytcard/projects/${projectId}/**`,
      "",
      "## Micro-action",
      "- Ensure `pipeline/state.json`, `pipeline/plan.md`, and the bootstrap step exist without overwriting existing work.",
      "",
      "## Constraints",
      "- Must be idempotent (safe to re-run)",
      "- No project-specific business content inside the plugin templates",
      "- `pipeline/steps/` is the only execution step tree",
      "",
    ].join("\n")
  );

  writeIfMissing(
    path.join(bootstrapStepRoot, "acceptance.md"),
    [
      "# Acceptance: S000 Bootstrap scaffold",
      "",
      "- [ ] `.whytcard/projects/<projectId>/pipeline/plan.md` exists",
      "- [ ] `.whytcard/projects/<projectId>/pipeline/state.json` exists and is valid JSON",
      "- [ ] `instruction.md` and `acceptance.md` exist for `S000-bootstrap-scaffold`",
      "- [ ] supporting directories exist: `research/`, `brainstorms/`, `plans/`, `reviews/`, `proofs/`",
      "- [ ] Re-running init does not overwrite existing files",
      "",
    ].join("\n")
  );

  process.stdout.write(`OK: initialized .whytcard/projects/${projectId}\n`);
}

main();

