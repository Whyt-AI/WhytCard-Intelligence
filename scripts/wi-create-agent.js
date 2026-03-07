#!/usr/bin/env node
"use strict";

/**
 * wi-create-agent.js
 * Create a reusable Cursor subagent file in the plugin's agents/ directory.
 *
 * Usage:
 *   node scripts/wi-create-agent.js "<agentName>" "<description>"
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

function safeAgentName(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function titleFromName(name) {
  return String(name || "")
    .split(/-+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function main() {
  const [rawAgentName, rawDescription] = process.argv.slice(2);
  const agentName = safeAgentName(rawAgentName);
  const description = String(rawDescription || "").trim();

  if (!agentName || !description) {
    process.stderr.write(
      'Usage: node scripts/wi-create-agent.js "<agentName>" "<description>"\n',
    );
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const agentsRoot = path.join(repoRoot, "agents");
  const agentPath = path.join(agentsRoot, `${agentName}.md`);
  const title = titleFromName(agentName);

  const created = writeIfMissing(
    agentPath,
    [
      "---",
      `name: ${agentName}`,
      `description: ${description}`,
      "model: inherit",
      "---",
      "",
      `You are the ${title} specialist.`,
      "",
      "Your job is to own one reusable area of expertise in the WhytCard orchestration system.",
      "",
      "## Operating stance",
      "",
      "- Stay focused on this specialist role.",
      "- Read the delegated step contract before acting.",
      "- Keep changes and conclusions inside the declared scope.",
      "- If the contract is weak, say so clearly instead of improvising.",
      "",
      "## When invoked",
      "",
      "1. Restate the delegated goal and scope.",
      "2. Read the minimum context needed to act well.",
      "3. Execute only the specialist work expected from this role.",
      "4. Return evidence, blockers, and next-step recommendations relevant to this role.",
      "",
      "## Output contract",
      "",
      "- what you verified or changed",
      "- what evidence backs the result",
      "- what remains blocked or uncertain",
      "- what the orchestrator should do next",
      "",
    ].join("\n"),
  );

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        created,
        agentName,
        agentPath: path.relative(repoRoot, agentPath).replace(/\\/g, "/"),
      },
      null,
      2,
    ) + "\n",
  );
}

main();
