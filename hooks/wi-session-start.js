#!/usr/bin/env node
/**
 * SessionStart hook — WhytCard Intelligence Orchestrator
 *
 * Injects the orchestrator identity, detected stack, and project config
 * into every conversation. Handles .whytcard onboarding if needed.
 * Works in Cursor via shared output module.
 */

const fs = require("fs");
const path = require("path");
const { sessionStartOutput, loadConfig, getPluginRoot } = require("./lib/output");
const {
  getDefaultGlobalRoot,
  getGlobalConfigPath,
  loadGlobalKbConfig,
  getGlobalProjectDir,
  hasLocalWhytcard,
} = require("./lib/whytcard-kb");

// ─── Load orchestrator identity ─────────────────────────────────────────

const pluginRoot = getPluginRoot();
let identity = "";
const identityCandidates = ["AGENTS.md", "README.md"];
for (const filename of identityCandidates) {
  const candidate = path.join(pluginRoot, filename);
  if (!fs.existsSync(candidate)) continue;
  try {
    identity = fs.readFileSync(candidate, "utf8").trim();
    break;
  } catch (err) {
    process.stderr.write(
      `wi-session-start: failed to load ${filename} — ${err.message}\n`,
    );
  }
}
if (!identity) {
  identity =
    "WhytCard orchestrator identity unavailable (missing AGENTS.md/README.md).";
}
const MAX_IDENTITY_CHARS = 3500;
if (identity.length > MAX_IDENTITY_CHARS) {
  identity = `${identity.slice(0, MAX_IDENTITY_CHARS)}\n\n[truncated: see AGENTS.md for full details]`;
}

// ─── Detect project stack ───────────────────────────────────────────────

function detectStack(cwd) {
  const signals = [];

  // Node/Frontend
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps["next"]) signals.push("nextjs");
      if (allDeps["react"]) signals.push("react");
      if (allDeps["vue"]) signals.push("vue");
      if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) signals.push("svelte");
      if (allDeps["tailwindcss"]) signals.push("tailwind");
      if (allDeps["@supabase/supabase-js"] || allDeps["@supabase/ssr"])
        signals.push("supabase");
      if (allDeps["stripe"]) signals.push("stripe");
      if (allDeps["next-intl"] || allDeps["i18next"] || allDeps["vue-i18n"])
        signals.push("i18n");
      if (allDeps["@radix-ui/react-dialog"] || allDeps["@radix-ui/themes"])
        signals.push("radix");
      if (allDeps["motion"] || allDeps["framer-motion"]) signals.push("motion");
      if (allDeps["playwright"] || allDeps["@playwright/test"])
        signals.push("playwright");
      if (allDeps["astro"]) signals.push("astro");
    } catch (err) {
      process.stderr.write(
        `wi-session-start: failed to parse package.json — ${err.message}\n`,
      );
    }
  }

  // Python
  for (const pyFile of ["requirements.txt", "pyproject.toml", "setup.py"]) {
    const pyPath = path.join(cwd, pyFile);
    if (fs.existsSync(pyPath)) {
      try {
        const content = fs.readFileSync(pyPath, "utf8").toLowerCase();
        if (content.includes("fastapi")) signals.push("fastapi");
        if (content.includes("django")) signals.push("django");
        if (content.includes("flask")) signals.push("flask");
        if (content.includes("groq")) signals.push("groq");
      } catch {
        /* ignore */
      }
    }
  }

  // Other languages
  if (fs.existsSync(path.join(cwd, "Cargo.toml"))) signals.push("rust");
  if (fs.existsSync(path.join(cwd, "go.mod"))) signals.push("go");
  if (
    fs.existsSync(path.join(cwd, "Dockerfile")) ||
    fs.existsSync(path.join(cwd, "docker-compose.yml"))
  ) {
    signals.push("docker");
  }

  // Monorepo: scan one level of subdirectories
  try {
    const entries = fs.readdirSync(cwd, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules"
      ) {
        const subPkg = path.join(cwd, entry.name, "package.json");
        if (fs.existsSync(subPkg)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(subPkg, "utf8"));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (allDeps["next"]) signals.push("nextjs");
            if (allDeps["react"]) signals.push("react");
            if (allDeps["vue"]) signals.push("vue");
          } catch {
            /* ignore */
          }
        }
      }
    }
  } catch {
    /* ignore */
  }

  return [...new Set(signals)];
}

// ─── Optional onboarding (auto, no commands) ───────────────────────────

function buildOnboardingContext(cwdPath) {
  if (hasLocalWhytcard(cwdPath)) return "";

  const globalRoot = getDefaultGlobalRoot();
  const globalCfgPath = getGlobalConfigPath(globalRoot);
  const globalCfg = loadGlobalKbConfig(globalRoot);
  const globalProjectDir = getGlobalProjectDir(globalRoot, cwdPath);

  if (!globalCfg) {
    return `

<WC-ONBOARDING>
This project has no WhytCard knowledge base yet.

Default recommendation: use a GLOBAL knowledge base (no clutter in repos).

Ask the user ONCE:
1) Knowledge base mode: GLOBAL (recommended) or LOCAL
2) If GLOBAL: where should the global root live? (default: ${globalRoot})

Then configure automatically:
- Create the global structure at {globalRoot}/projects/{projectSlug}-{projectId}/
- Create a .whytcard symlink in the repo pointing to the global directory
- Persist the choice in ${globalCfgPath}

Goal: after this onboarding, the user never repeats setup per project/session.
</WC-ONBOARDING>`;
  }

  const mode = globalCfg.mode || globalCfg.kbMode || "global";
  if (String(mode).toLowerCase() === "global") {
    return `

<WC-ONBOARDING>
WhytCard global knowledge base detected.
If this project has no .whytcard yet, attach it automatically:
- Ensure global project dir exists: ${globalProjectDir}
- Create symlink: .whytcard -> ${globalProjectDir}
- If symlink fails: fall back to LOCAL .whytcard.
</WC-ONBOARDING>`;
  }

  return `

<WC-ONBOARDING>
WhytCard config is set to LOCAL mode. This project has no .whytcard yet.
Create .whytcard/ in the repo and initialize index.md.
</WC-ONBOARDING>`;
}

// ─── Build context and output ───────────────────────────────────────────

const cwd = process.cwd();
const stack = detectStack(cwd);
const config = loadConfig(cwd);

const stackLine =
  stack.length > 0
    ? `\nDetected stack: ${stack.join(", ")}. Adapt your agents and pipeline to these technologies.`
    : "";

const configLine = `\nProject config: viewports=${JSON.stringify(config.viewports)}, visualVerification=${config.visualVerification}, darkModeCheck=${config.darkModeCheck}`;
const proactiveLine =
  "\nRuntime rule: Gather missing context proactively when it materially improves correctness or execution. If material uncertainty remains, keep reading, researching, or delegating; never stop at the first plausible answer.";
const delegationLine =
  "\nRuntime rule: Use subagents proactively for broad reading, deep research, review, diagnosis, and implementation when that reduces uncertainty or context load.";
const delegationMechanicsLine =
  "\nDelegation loop: identify the current step from `.whytcard/projects/{id}/pipeline/state.json`, refine `instruction.md` and `acceptance.md`, bootstrap a missing contract with `/wi-create-step`, resolve the dispatch with `/wi-dispatch-step`, invoke the right shipped WhytCard subagent (`/whytcard-researcher`, `/whytcard-planner`, `/whytcard-implementer`, `/whytcard-reviewer`, `/whytcard-visual-verifier`, `/whytcard-debugger`), then review the returned evidence with `/wi-review-step` before advancing the pipeline. If no reusable specialist fits, create one with `/wi-create-agent`.";
const routingLine =
  "\nRouting rule: If the prompt contains a /wi-* command, treat it as the primary mode and execute that workflow first. Keep one primary mode per turn; treat other concerns as secondary gates.";

const onboarding = buildOnboardingContext(cwd);

const context = `<WHYTCARD-ORCHESTRATOR>
${identity}
${stackLine}${configLine}${proactiveLine}${delegationLine}${delegationMechanicsLine}${routingLine}
</WHYTCARD-ORCHESTRATOR>`;

process.stdout.write(sessionStartOutput(context + onboarding));
