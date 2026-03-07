#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.join(__dirname, "..");

function fail(message) {
  process.stderr.write(`FAIL: ${message}\n`);
  process.exit(1);
}

function ensure(condition, message) {
  if (!condition) fail(message);
}

function runNodeScript(relativeScriptPath, input) {
  const scriptPath = path.join(repoRoot, relativeScriptPath);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    input: input ? JSON.stringify(input) : undefined,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    fail(
      `${relativeScriptPath} exited with ${result.status}: ${result.stderr || result.stdout}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout || "{}");
  } catch (error) {
    fail(`${relativeScriptPath} returned invalid JSON: ${error.message}`);
  }

  return parsed;
}

function runNodeCommand(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return result;
}

function runNodeCommandInCwd(args, cwd) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
  });
}

function testSessionStart() {
  const output = runNodeScript("hooks/wi-session-start.js");
  ensure(
    typeof output.additional_context === "string",
    "sessionStart must return additional_context",
  );
  ensure(
    output.additional_context.includes("<WHYTCARD-ORCHESTRATOR>"),
    "sessionStart additional_context must contain orchestrator context",
  );
  ensure(
    output.additional_context.includes("/whytcard-implementer"),
    "sessionStart must advertise shipped WhytCard subagents",
  );
  ensure(
    output.additional_context.includes("pipeline/state.json"),
    "sessionStart must describe the pipeline-first delegation loop",
  );
}

function testPromptDispatch() {
  const allowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-brainstorm improve this plugin",
  });
  ensure(allowed.continue === true, "beforeSubmitPrompt should allow valid /wi-* commands");

  const createStepAllowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-create-step create the next contract",
  });
  ensure(
    createStepAllowed.continue === true,
    "beforeSubmitPrompt should allow /wi-create-step",
  );

  const dispatchAllowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-dispatch-step run the current step",
  });
  ensure(
    dispatchAllowed.continue === true,
    "beforeSubmitPrompt should allow /wi-dispatch-step",
  );

  const reviewAllowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-review-step decide pass or fail",
  });
  ensure(
    reviewAllowed.continue === true,
    "beforeSubmitPrompt should allow /wi-review-step",
  );

  const createAgentAllowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-create-agent add a reusable specialist",
  });
  ensure(
    createAgentAllowed.continue === true,
    "beforeSubmitPrompt should allow /wi-create-agent",
  );

  const syncProjectCursorAllowed = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-sync-project-cursor refresh the local project assets",
  });
  ensure(
    syncProjectCursorAllowed.continue === true,
    "beforeSubmitPrompt should allow /wi-sync-project-cursor",
  );

  const denied = runNodeScript("hooks/wi-prompt-dispatch.js", {
    prompt: "/wi-brainstormx improve this plugin",
  });
  ensure(denied.continue === false, "beforeSubmitPrompt should block invalid /wi-* commands");
  ensure(
    typeof denied.user_message === "string" &&
      denied.user_message.includes("Unknown WhytCard command"),
    "beforeSubmitPrompt denial should explain the invalid command",
  );
}

function testPreEditGate() {
  const denied = runNodeScript("hooks/wi-pre-edit-gate.js", {
    tool_name: "Edit",
    tool_input: { file_path: "src/app.tsx" },
  });
  ensure(denied.permission === "deny", "preToolUse must deny direct app code edits");
  ensure(
    typeof denied.user_message === "string" &&
      denied.user_message.includes("Direct edit blocked"),
    "preToolUse denial should explain the block",
  );
  ensure(
    denied.user_message.includes("/whytcard-implementer"),
    "preToolUse denial should direct the orchestrator to a shipped subagent",
  );

  const allowed = runNodeScript("hooks/wi-pre-edit-gate.js", {
    tool_name: "Edit",
    tool_input: { file_path: "hooks/wi-session-start.js" },
  });
  ensure(
    Object.keys(allowed).length === 0,
    "preToolUse should no-op for allowed orchestration file edits",
  );
}

function testPostEditVerify() {
  const visual = runNodeScript("hooks/wi-post-edit-verify.js", {
    tool_input: { file_path: "src/app.tsx" },
  });
  ensure(
    typeof visual.additional_context === "string" &&
      visual.additional_context.includes("WC-POST-EDIT"),
    "postToolUse must inject additional_context for visual/app code files",
  );

  const nonVisual = runNodeScript("hooks/wi-post-edit-verify.js", {
    tool_input: { file_path: "hooks/wi-session-start.js" },
  });
  ensure(
    Object.keys(nonVisual).length === 0,
    "postToolUse should no-op for non-visual plugin file edits",
  );
}

function testValidator() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-plugin-test-"));
  const validHooksPath = path.join(tempDir, "hooks.valid.json");
  const invalidHooksPath = path.join(tempDir, "hooks.invalid.json");
  const nestedHooksPath = path.join(tempDir, "hooks.nested.json");
  const hookScriptPath = path.join(repoRoot, "hooks", "wi-session-start.js").replace(/\\/g, "/");

  fs.writeFileSync(
    validHooksPath,
    JSON.stringify(
      {
        version: 1,
        hooks: {
          sessionStart: [
            {
              type: "command",
              command: `node "${hookScriptPath}"`,
              timeout: 5,
            },
          ],
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  fs.writeFileSync(
    invalidHooksPath,
    JSON.stringify(
      {
        version: 1,
        hooks: {
          SessionStart: [
            {
              matcher: "",
              hooks: [{ type: "command", command: `node "${hookScriptPath}"`, timeout: 5 }],
            },
          ],
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  fs.writeFileSync(
    nestedHooksPath,
    JSON.stringify(
      {
        version: 1,
        hooks: {
          sessionStart: [
            {
              matcher: "",
              hooks: [{ type: "command", command: `node "${hookScriptPath}"`, timeout: 5 }],
            },
          ],
        },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  const valid = runNodeCommand(["scripts/validate-cursor-hooks.js", validHooksPath]);
  ensure(valid.status === 0, "validate-cursor-hooks should accept valid hook configs");
  ensure((valid.stdout || "").includes("OK"), "validator should print OK on success");

  const invalid = runNodeCommand(["scripts/validate-cursor-hooks.js", invalidHooksPath]);
  ensure(invalid.status !== 0, "validate-cursor-hooks should reject invalid event names");
  ensure(
    (invalid.stderr || "").includes("Unsupported hook event"),
    "validator should explain invalid hook event names",
  );

  const nested = runNodeCommand(["scripts/validate-cursor-hooks.js", nestedHooksPath]);
  ensure(nested.status !== 0, "validate-cursor-hooks should reject legacy nested hook format");
  ensure(
    (nested.stderr || "").includes("legacy nested matcher-block format"),
    "validator should explain legacy nested hook format failures",
  );
}

function testHooksMergeMigration() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-hooks-merge-test-"));
  const hooksPath = path.join(tempDir, "hooks.json");
  const legacyHooks = {
    version: 1,
    hooks: {
      sessionStart: [
        {
          matcher: "",
          hooks: [
            {
              type: "command",
              command: 'node "$CURSOR_PLUGIN_ROOT/hooks/wi-session-start.js"',
              timeout: 10,
            },
          ],
        },
      ],
      preToolUse: [
        {
          matcher: "Edit|Write|NotebookEdit",
          hooks: [
            {
              type: "command",
              command: 'node "$CURSOR_PLUGIN_ROOT/hooks/wi-pre-edit-gate.js"',
              timeout: 5,
            },
          ],
        },
      ],
    },
  };
  fs.writeFileSync(hooksPath, JSON.stringify(legacyHooks, null, 2) + "\n", "utf8");

  const merge = runNodeCommand([
    "scripts/install-cursor-hooks-merge.js",
    hooksPath,
    "whytcard-intelligence",
    repoRoot,
  ]);
  ensure(merge.status === 0, "install-cursor-hooks-merge should migrate legacy nested hook configs");

  const merged = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  ensure(
    typeof merged.hooks.sessionStart?.[0]?.command === "string",
    "merged sessionStart hooks must be flat command objects",
  );
  ensure(
    !Array.isArray(merged.hooks.sessionStart?.[0]?.hooks),
    "merged sessionStart hook must not keep nested hooks arrays",
  );
  ensure(
    merged.hooks.preToolUse?.[0]?.matcher === "Edit|Write|NotebookEdit",
    "merged preToolUse hook must preserve matcher on the flat hook object",
  );
}

function testStandaloneAudit() {
  const audit = runNodeCommand(["scripts/audit-standalone.js"]);
  ensure(audit.status === 0, "audit-standalone should pass");
  ensure(
    (audit.stdout || "").includes("OK: standalone audit passed"),
    "audit-standalone should print a success marker",
  );
}

function testInitProjectScaffold() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-init-test-"));
  const projectId = "smoke-layout";
  const planPath = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "plan.md",
  );
  const statePath = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "state.json",
  );
  const instructionPath = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "steps",
    "S000-bootstrap-scaffold",
    "instruction.md",
  );

  const firstRun = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "wi-init-project.js"), projectId],
    tempDir,
  );
  ensure(firstRun.status === 0, "wi-init-project should initialize the scaffold");
  ensure(fs.existsSync(planPath), "wi-init-project must create pipeline/plan.md");
  ensure(fs.existsSync(statePath), "wi-init-project must create pipeline/state.json");
  ensure(
    fs.existsSync(instructionPath),
    "wi-init-project must create the S000 bootstrap instruction",
  );

  const originalPlan = fs.readFileSync(planPath, "utf8");
  const sentinelPlan = `${originalPlan}\nSENTINEL\n`;
  fs.writeFileSync(planPath, sentinelPlan, "utf8");

  const secondRun = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "wi-init-project.js"), projectId],
    tempDir,
  );
  ensure(secondRun.status === 0, "wi-init-project should remain idempotent");
  ensure(
    fs.readFileSync(planPath, "utf8") === sentinelPlan,
    "wi-init-project must not overwrite existing pipeline files",
  );
}

function testCreateStepHelper() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-step-test-"));
  const projectId = "smoke-step";
  const stepId = "S010";
  const slug = "feature-login-form";
  const stepRoot = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "steps",
    `${stepId}-${slug}`,
  );
  const instructionPath = path.join(stepRoot, "instruction.md");
  const acceptancePath = path.join(stepRoot, "acceptance.md");
  const notesPath = path.join(stepRoot, "evidence", "notes.md");
  const statePath = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "state.json",
  );

  const firstRun = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-create-step.js"),
      projectId,
      stepId,
      slug,
      "whytcard-implementer",
    ],
    tempDir,
  );
  ensure(firstRun.status === 0, "wi-create-step should create a step scaffold");
  ensure(fs.existsSync(instructionPath), "wi-create-step must create instruction.md");
  ensure(fs.existsSync(acceptancePath), "wi-create-step must create acceptance.md");
  ensure(fs.existsSync(notesPath), "wi-create-step must create evidence/notes.md");

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  ensure(state.currentStep === stepId, "wi-create-step must set the current step");
  ensure(
    Array.isArray(state.steps) &&
      state.steps.some((step) => step.id === stepId && step.slug === slug),
    "wi-create-step must register the step in pipeline/state.json",
  );

  const originalInstruction = fs.readFileSync(instructionPath, "utf8");
  const sentinelInstruction = `${originalInstruction}\nSENTINEL\n`;
  fs.writeFileSync(instructionPath, sentinelInstruction, "utf8");

  const secondRun = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-create-step.js"),
      projectId,
      stepId,
      slug,
      "whytcard-implementer",
    ],
    tempDir,
  );
  ensure(secondRun.status === 0, "wi-create-step should remain idempotent");
  ensure(
    fs.readFileSync(instructionPath, "utf8") === sentinelInstruction,
    "wi-create-step must not overwrite an existing instruction contract",
  );
}

function testDispatchAndStateLoop() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-loop-test-"));
  const projectId = "smoke-loop";

  const createFirst = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-create-step.js"),
      projectId,
      "S010",
      "feature-login-form",
      "whytcard-implementer",
    ],
    tempDir,
  );
  ensure(createFirst.status === 0, "first loop step should be created");

  const createSecond = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-create-step.js"),
      projectId,
      "S020",
      "review-login-form",
      "whytcard-reviewer",
    ],
    tempDir,
  );
  ensure(createSecond.status === 0, "second loop step should be created");

  const dispatch = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "wi-dispatch-step.js"), projectId, "S010"],
    tempDir,
  );
  ensure(dispatch.status === 0, "wi-dispatch-step should resolve a step");
  const dispatchPayload = JSON.parse(dispatch.stdout || "{}");
  ensure(
    dispatchPayload.invocation === "/whytcard-implementer",
    "wi-dispatch-step should expose the right specialist invocation",
  );

  const markInProgress = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-update-step-state.js"),
      projectId,
      "S010",
      "IN_PROGRESS",
      "Dispatched",
    ],
    tempDir,
  );
  ensure(markInProgress.status === 0, "wi-update-step-state should mark step in progress");

  const statePath = path.join(
    tempDir,
    ".whytcard",
    "projects",
    projectId,
    "pipeline",
    "state.json",
  );
  let state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  let step = state.steps.find((entry) => entry.id === "S010");
  ensure(step.status === "IN_PROGRESS", "step should be marked IN_PROGRESS");
  ensure(step.attempts === 1, "starting a step should increment attempts");
  ensure(state.currentStep === "S010", "currentStep should remain on active step");

  const markFailed = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-update-step-state.js"),
      projectId,
      "S010",
      "FAILED",
      "Need better instruction",
    ],
    tempDir,
  );
  ensure(markFailed.status === 0, "wi-update-step-state should mark step failed");
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  step = state.steps.find((entry) => entry.id === "S010");
  ensure(step.status === "FAILED", "step should be marked FAILED");
  ensure(state.currentStep === "S010", "failed step should stay current");

  const markPassed = runNodeCommandInCwd(
    [
      path.join(repoRoot, "scripts", "wi-update-step-state.js"),
      projectId,
      "S010",
      "PASSED",
      "Reviewed and accepted",
    ],
    tempDir,
  );
  ensure(markPassed.status === 0, "wi-update-step-state should mark step passed");
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  ensure(state.currentStep === "S020", "passing a step should advance to the next incomplete step");
}

function testCreateAgentHelper() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-agent-test-"));
  const agentName = "whytcard-rust-api";
  const description = "Rust API specialist. Use when implementing reusable Axum or Actix request and response contracts.";
  const agentPath = path.join(tempDir, "agents", `${agentName}.md`);

  const firstRun = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "wi-create-agent.js"), agentName, description],
    tempDir,
  );
  ensure(firstRun.status === 0, "wi-create-agent should create an agent file");
  ensure(fs.existsSync(agentPath), "wi-create-agent must create the agent markdown file");
  let content = fs.readFileSync(agentPath, "utf8");
  ensure(content.includes(`name: ${agentName}`), "agent file must declare the normalized name");

  const sentinel = `${content}\nSENTINEL\n`;
  fs.writeFileSync(agentPath, sentinel, "utf8");

  const secondRun = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "wi-create-agent.js"), agentName, description],
    tempDir,
  );
  ensure(secondRun.status === 0, "wi-create-agent should remain idempotent");
  content = fs.readFileSync(agentPath, "utf8");
  ensure(content === sentinel, "wi-create-agent must not overwrite an existing agent file");
}

function testSyncProjectCursorHelper() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "whytcard-project-cursor-test-"));
  const projectRoot = path.join(tempDir, "demo-project");
  const localCursorRoot = path.join(projectRoot, ".cursor");
  const staleCommandPath = path.join(localCursorRoot, "commands", "wi-create-agent.md");
  const syncedCommandPath = path.join(localCursorRoot, "commands", "wi-sync-project-cursor.md");
  const syncedSkillPath = path.join(
    localCursorRoot,
    "skills",
    "sk-wi-sync-project-cursor",
    "SKILL.md",
  );
  const syncedScriptPath = path.join(localCursorRoot, "scripts", "sync-project-cursor.js");
  const syncedHookPath = path.join(localCursorRoot, "hooks", "wi-session-start.js");

  fs.mkdirSync(path.dirname(staleCommandPath), { recursive: true });
  fs.writeFileSync(staleCommandPath, "STALE\n", "utf8");

  const syncRun = runNodeCommandInCwd(
    [path.join(repoRoot, "scripts", "sync-project-cursor.js"), projectRoot],
    repoRoot,
  );
  ensure(syncRun.status === 0, "sync-project-cursor should sync a repo-local .cursor tree");
  ensure(fs.existsSync(syncedCommandPath), "sync-project-cursor must copy wi-sync-project-cursor command");
  ensure(fs.existsSync(syncedSkillPath), "sync-project-cursor must copy sk-wi-sync-project-cursor");
  ensure(fs.existsSync(syncedScriptPath), "sync-project-cursor must copy its own helper script");
  ensure(fs.existsSync(syncedHookPath), "sync-project-cursor must copy hook implementation files");

  const staleContent = fs.readFileSync(staleCommandPath, "utf8");
  ensure(staleContent !== "STALE\n", "sync-project-cursor must refresh stale plugin-managed project files");
}

function testShippedAgents() {
  const agentsDir = path.join(repoRoot, "agents");
  const expectedAgents = [
    "whytcard-researcher.md",
    "whytcard-planner.md",
    "whytcard-implementer.md",
    "whytcard-reviewer.md",
    "whytcard-visual-verifier.md",
    "whytcard-debugger.md",
  ];

  ensure(fs.existsSync(agentsDir), "agents directory must exist");

  for (const agentFile of expectedAgents) {
    const fullPath = path.join(agentsDir, agentFile);
    ensure(fs.existsSync(fullPath), `missing shipped agent: ${agentFile}`);
    const content = fs.readFileSync(fullPath, "utf8");
    ensure(content.startsWith("---"), `${agentFile} must start with YAML frontmatter`);
    ensure(
      content.includes(`name: ${agentFile.replace(/\.md$/, "")}`),
      `${agentFile} must declare a matching agent name`,
    );
  }
}

function main() {
  testSessionStart();
  testPromptDispatch();
  testPreEditGate();
  testPostEditVerify();
  testValidator();
  testHooksMergeMigration();
  testStandaloneAudit();
  testInitProjectScaffold();
  testCreateStepHelper();
  testDispatchAndStateLoop();
  testCreateAgentHelper();
  testSyncProjectCursorHelper();
  testShippedAgents();
  process.stdout.write("OK: plugin smoke tests passed\n");
}

main();
