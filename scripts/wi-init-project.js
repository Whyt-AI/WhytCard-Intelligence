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

  // Directories (base scaffold + canonical working dirs)
  for (const d of [
    kbRoot,
    path.join(kbRoot, "projects"),
    projRoot,
    path.join(projRoot, "00_orchestrator"),
    path.join(projRoot, "01_foundation", "steps", "S001-project-scaffold"),
    path.join(projRoot, "01_foundation", "steps", "S001-project-scaffold", "evidence"),
    path.join(projRoot, "pipeline", "steps"),
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
    path.join(projRoot, "00_orchestrator", "master_plan.md"),
    [
      "# Master Plan",
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
      "## Next steps",
      "- Fill state_machine.json and create the next step instruction/acceptance",
      "",
    ].join("\n")
  );

  writeIfMissing(
    path.join(projRoot, "00_orchestrator", "state_machine.json"),
    JSON.stringify(
      {
        version: 1,
        projectId,
        startDate: new Date().toISOString().slice(0, 10),
        currentPhase: "01_foundation",
        phases: [
          {
            id: "01_foundation",
            name: "Foundation",
            status: "PENDING",
            steps: [
              {
                id: "S001",
                slug: "project-scaffold",
                title: "Create .whytcard project scaffold",
                agent: "orchestrator",
                status: "PENDING",
                attempts: 0,
              },
            ],
          },
        ],
      },
      null,
      2
    ) + "\n"
  );

  writeIfMissing(
    path.join(projRoot, "01_foundation", "steps", "S001-project-scaffold", "instruction.md"),
    [
      "# S001: Project scaffold",
      "",
      "## Intent",
      "Create a clean, reproducible .whytcard project structure that will be filled step-by-step during discussion.",
      "",
      "## Scope (allowed changes)",
      `- .whytcard/projects/${projectId}/**`,
      "",
      "## Micro-action",
      "- Ensure the scaffold exists (directories + minimal files) without overwriting existing work.",
      "",
      "## Constraints",
      "- Must be idempotent (safe to re-run)",
      "- No project-specific business content inside the plugin templates",
      "",
    ].join("\n")
  );

  writeIfMissing(
    path.join(projRoot, "01_foundation", "steps", "S001-project-scaffold", "acceptance.md"),
    [
      "# Acceptance: S001 Project scaffold",
      "",
      "- [ ] `.whytcard/projects/<projectId>/00_orchestrator/master_plan.md` exists",
      "- [ ] `.whytcard/projects/<projectId>/00_orchestrator/state_machine.json` exists and is valid JSON",
      "- [ ] `instruction.md` and `acceptance.md` exist for S001",
      "- [ ] Re-running init does not overwrite existing files",
      "",
    ].join("\n")
  );

  process.stdout.write(`OK: initialized .whytcard/projects/${projectId}\n`);
}

main();

