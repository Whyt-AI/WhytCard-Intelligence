#!/usr/bin/env node
/**
 * wi-prompt-dispatch — UserPromptSubmit hook
 *
 * Analyzes the user's prompt keywords and injects dispatch hints
 * so the orchestrator knows which skills to give its agents.
 * Works on both Claude Code and Cursor via shared output module.
 */

const { handleStdin, injectContext, emptyResponse } = require("./lib/output");

// Keyword → dispatch hint mapping
// Each hint tells the orchestrator which skill to reference when creating agents
const DISPATCH_RULES = [
  // ── Brainstorm (interactive) ──
  [/\b(brainstorm\w*|ideate?\b|explor\w+\s+(?:idea|option|approach|solution)|think\s+through|weigh\s+(?:option|approach)|let'?s\s+think|on\s+(?:r[eé]fl[eé]chit?|pense)|what\s+(?:if|about)|should\s+(?:we|i)\s+(?:use|go\s+with|pick|choose))\b/i,
    "WI-DISPATCH: Brainstorm detected → use skills/wi-brainstorm/SKILL.md. Launch research agents in parallel, discuss with user, challenge assumptions, converge on approach."],

  // ── New project (autopilot) ──
  [/\b(new\s+project|from\s+scratch|scaffold|bootstrap|create\s+(?:a|an|the)\s+(?:app|tool|system|project|site)|init\w*\s+project|projet\s+complet|je\s+veux\s+un\s+(?:outil|projet|site))\b/i,
    "WI-DISPATCH: New project detected → use skills/wi-new-project/SKILL.md. Gather requirements, research stack, create pipeline, execute step by step."],

  // ── Improve project (autopilot) ──
  [/\b(improve|audit|refactor|clean\s*up|tech\s*debt|modernize|upgrade|optimize\s+(?:the\s+)?(?:code|project|app))\b/i,
    "WI-DISPATCH: Improve project detected → use skills/wi-improve-project/SKILL.md. Audit codebase, prioritize issues, create fix pipeline."],

  // ── Fix bug (autopilot) ──
  [/\b(bug|error|broken|failing|crash|fix|debug|doesn'?t\s+work|ne\s+(?:marche|fonctionne)\s+p(?:as|lus))\b/i,
    "WI-DISPATCH: Bug fix detected → use skills/wi-fix-bug/SKILL.md. Reproduce, isolate, diagnose root cause, fix, verify no regression."],

  // ── Add feature (autopilot) ──
  [/\b(add\s+(?:a\s+)?feature|new\s+feature|implement|ajoute\w*|cr[eé]e\w*\s+(?:un|une|le|la)|build\s+(?:a|the))\b/i,
    "WI-DISPATCH: Feature addition detected → use skills/wi-add-feature/SKILL.md. Analyze impact, decompose, create pipeline, execute with gates."],

  // ── Web research (utility) ──
  [/\b(research|compare|evaluate|which|best|alternative|recommend|pros.?cons|trade.?off|cherch\w+|renseign\w+)\b/i,
    "WI-DISPATCH: Research detected → use skills/wi-search-web/SKILL.md for deep research or skills/wi-research-stack/SKILL.md for tech comparison. Dual-angle: good + bad + data."],

  // ── Visual check (utility) ──
  [/\b(check\s+(?:the\s+)?(?:browser|ui|visual|page|site|localhost)|screenshot|viewport|responsive|v[eé]rif\w+\s+(?:le\s+)?(?:visuel|rendu))\b/i,
    "WI-DISPATCH: Visual check detected → use skills/wi-check-browser/SKILL.md. Navigate, screenshot 3 viewports, dark+light, evaluate as user."],

  // ── Codebase review (utility) ──
  [/\b(review|code\s*review|audit\s+(?:the\s+)?code|quality\s+check|pr\s+review)\b/i,
    "WI-DISPATCH: Code review detected → use skills/wi-review-codebase/SKILL.md. 6 dimensions: quality, types, security, perf, deps, tests."],

  // ── Security audit (utility) ──
  [/\b(security|vulnerabilit\w+|cve|owasp|injection|xss|csrf|s[eé]curit[eé])\b/i,
    "WI-DISPATCH: Security audit detected → use skills/wi-security-audit/SKILL.md. Scan deps, code patterns, secrets, config, OWASP Top 10."],

  // ── Performance audit (utility) ──
  [/\b(perf(?:ormance)?|slow|fast|speed|bundle\s*size|render|bottleneck|latenc\w+|lent|rapide)\b/i,
    "WI-DISPATCH: Performance audit detected → use skills/wi-perf-audit/SKILL.md. Bundle, render, server, network analysis. Top 5 bottlenecks."],

  // ── Stack research (utility) ──
  [/\b(stack|framework|library|package|which\s+(?:lib|framework|tool)|compar\w+\s+(?:lib|framework|package))\b/i,
    "WI-DISPATCH: Stack research detected → use skills/wi-research-stack/SKILL.md. Research each option, comparison table, dual-angle, recommend."],

  // ── Dependency management ──
  [/\b(install|add\s+(?:package|dependency)|npm|pnpm|bun|pip|cargo\s+add)\b/i,
    "WI-DISPATCH: Package task detected → verify latest versions via live search. Evaluate with rules/version-check.mdc."],

  // ── UI work ──
  [/\b(ui|component|page|visual|design|layout|style|theme)\b/i,
    "WI-DISPATCH: UI task detected → after agents complete, evaluate with rules/visual-verify.mdc. Screenshots mandatory."],

  // ── Deploy ──
  [/\b(deploy|ship|production|release|publish)\b/i,
    "WI-DISPATCH: Deploy detected → run review (skills/wi-review-codebase/SKILL.md) before shipping. Verify build, no errors, env vars set."],
];

handleStdin((data) => {
  const prompt = data.prompt || "";
  const hints = [];

  for (const [pattern, hint] of DISPATCH_RULES) {
    if (pattern.test(prompt)) {
      hints.push(hint);
    }
  }

  if (hints.length > 0) {
    return injectContext("UserPromptSubmit", hints.join("\n"));
  }
  return emptyResponse();
});
