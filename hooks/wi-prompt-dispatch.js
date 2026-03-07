#!/usr/bin/env node
/**
 * wi-prompt-dispatch — UserPromptSubmit hook
 *
 * Analyzes the user's prompt keywords and injects dispatch hints
 * so the orchestrator knows which skills to give its agents.
 * Works in Cursor via the shared output module.
 */

const { handleStdin, injectContext, emptyResponse } = require("./lib/output");

const PRIMARY_RULES = [
  {
    id: "whytcard",
    priority: 120,
    pattern:
      /\b(\/wi-whytcard|full\s+workflow|end-to-end\s+workflow|all-in-one\s+workflow|complete\s+pipeline)\b/i,
    skill: "skills/sk-wi-whytcard/SKILL.md",
    directive:
      "Run the full WhytCard workflow end-to-end: initialize KB, brainstorm with research, build and execute pipeline, and produce final review/proof artifacts.",
  },
  {
    id: "init_project",
    priority: 115,
    pattern:
      /\b(\/wi-init-project|init(?:ialize)?\s+(?:project|kb|knowledge\s+base)|create\s+(?:project\s+)?scaffold)\b/i,
    skill: "skills/sk-wi-init-project/SKILL.md",
    directive:
      "Run the init-project workflow. Create or repair the per-project .whytcard scaffold idempotently with no overwrites.",
  },
  {
    id: "brainstorm",
    priority: 110,
    pattern:
      /\b(brainstorm\w*|ideate?\b|explor\w+\s+(?:idea|option|approach|solution)|think\s+through|weigh\s+(?:option|approach)|let'?s\s+think|on\s+(?:r[eé]fl[eé]chit?|pense)|what\s+(?:if|about)|should\s+(?:we|i)\s+(?:use|go\s+with|pick|choose))\b/i,
    skill: "skills/sk-wi-brainstorm/SKILL.md",
    directive:
      "Run the interactive brainstorm workflow. Launch research subagents, compare multiple approaches, challenge assumptions, and converge with the user.",
  },
  {
    id: "new_project",
    priority: 100,
    pattern:
      /\b(new\s+project|from\s+scratch|scaffold|bootstrap|create\s+(?:a|an|the)\s+(?:app|tool|system|project|site)|init\w*\s+project|projet\s+complet|je\s+veux\s+un\s+(?:outil|projet|site))\b/i,
    skill: "skills/sk-wi-new-project/SKILL.md",
    directive:
      "Run the new-project workflow. Gather requirements, research the stack, scaffold the pipeline, and execute step by step.",
  },
  {
    id: "fix_bug",
    priority: 95,
    pattern:
      /\b(bug|error|broken|failing|crash|fix|debug|doesn'?t\s+work|ne\s+(?:marche|fonctionne)\s+p(?:as|lus))\b/i,
    skill: "skills/sk-wi-fix-bug/SKILL.md",
    directive:
      "Run the bug-fix workflow. Reproduce, isolate the root cause, fix it, and verify the regression path.",
  },
  {
    id: "add_feature",
    priority: 90,
    pattern:
      /\b(add\s+(?:a\s+)?feature|new\s+feature|implement|ajoute\w*|cr[eé]e\w*\s+(?:un|une|le|la)|build\s+(?:a|the))\b/i,
    skill: "skills/sk-wi-add-feature/SKILL.md",
    directive:
      "Run the feature workflow. Analyze impact, decompose into micro-actions, delegate implementation, and verify with evidence.",
  },
  {
    id: "improve_project",
    priority: 85,
    pattern:
      /\b(improve|audit|refactor|clean\s*up|tech\s*debt|modernize|upgrade|optimize\s+(?:the\s+)?(?:code|project|app))\b/i,
    skill: "skills/sk-wi-improve-project/SKILL.md",
    directive:
      "Run the project-improvement workflow. Audit the codebase, prioritize issues, create a fix pipeline, and execute with proofs.",
  },
  {
    id: "security_audit",
    priority: 80,
    pattern:
      /\b(security|vulnerabilit\w+|cve|owasp|injection|xss|csrf|s[eé]curit[eé])\b/i,
    skill: "skills/sk-wi-security-audit/SKILL.md",
    directive:
      "Run the security-audit workflow. Check dependencies, code paths, secrets, and config against concrete risks.",
  },
  {
    id: "performance_audit",
    priority: 75,
    pattern:
      /\b(perf(?:ormance)?|slow|fast|speed|bundle\s*size|render|bottleneck|latenc\w+|lent|rapide)\b/i,
    skill: "skills/sk-wi-perf-audit/SKILL.md",
    directive:
      "Run the performance-audit workflow. Measure bottlenecks, rank them, and propose fixes backed by data.",
  },
  {
    id: "code_review",
    priority: 70,
    pattern:
      /\b(review|code\s*review|audit\s+(?:the\s+)?code|quality\s+check|pr\s+review)\b/i,
    skill: "skills/sk-wi-review-codebase/SKILL.md",
    directive:
      "Run the codebase review workflow. Audit quality, types, security, performance, dependencies, and tests.",
  },
  {
    id: "research_stack",
    priority: 65,
    pattern:
      /\b(stack|framework|library|librair\w+|biblioth[eè]que|package|outil|which\s+(?:lib|framework|tool)|compar\w+\s+(?:lib|framework|package|outil|biblioth[eè]que))\b/i,
    skill: "skills/sk-wi-research-stack/SKILL.md",
    directive:
      "Run the stack-research workflow. Compare options with current data, risks, trade-offs, and a clear recommendation.",
  },
  {
    id: "search_web",
    priority: 60,
    pattern:
      /\b(research|compare|evaluate|which|best|alternative|recommend|pros.?cons|trade.?off|recherch\w*|cherch\w+|renseign\w+|meilleur\w*)\b/i,
    skill: "skills/sk-wi-search-web/SKILL.md",
    directive:
      "Run the web-research workflow. Gather official, bad/community, and data sources before recommending anything.",
  },
  {
    id: "check_browser",
    priority: 50,
    pattern:
      /\b(check\s+(?:the\s+)?(?:browser|ui|visual|page|site|localhost)|screenshot|viewport|responsive|v[eé]rif\w+\s+(?:le\s+)?(?:visuel|rendu))\b/i,
    skill: "skills/sk-wi-check-browser/SKILL.md",
    directive:
      "Run the visual-check workflow. Navigate, inspect the UI, and verify screenshots across required viewports and themes.",
  },
];

const COMMAND_TO_PRIMARY_ID = {
  "/wi-whytcard": "whytcard",
  "/wi-init-project": "init_project",
  "/wi-brainstorm": "brainstorm",
  "/wi-new-project": "new_project",
  "/wi-fix-bug": "fix_bug",
  "/wi-add-feature": "add_feature",
  "/wi-improve-project": "improve_project",
  "/wi-security-audit": "security_audit",
  "/wi-perf-audit": "performance_audit",
  "/wi-review-codebase": "code_review",
  "/wi-research-stack": "research_stack",
  "/wi-search-web": "search_web",
  "/wi-check-browser": "check_browser",
};

function findPrimaryRuleById(id) {
  return PRIMARY_RULES.find((rule) => rule.id === id) || null;
}

function extractSlashCommand(prompt) {
  const match = String(prompt || "")
    .toLowerCase()
    .match(/\/wi-[a-z-]+/);
  return match ? match[0] : null;
}

const SECONDARY_RULES = [
  {
    id: "research_gate",
    pattern:
      /\b(research|compare|evaluate|which|best|alternative|recommend|stack|framework|library|librair\w+|biblioth[eè]que|package|outil|pros.?cons|trade.?off|recherch\w*|cherch\w+|renseign\w+|meilleur\w*)\b/i,
    directive:
      "Before any recommendation, require official source + bad/community source + data source, at least 3 distinct sources total, explicit confidence, and explicit unknowns.",
  },
  {
    id: "version_gate",
    pattern:
      /\b(install|add\s+(?:package|dependency)|dependency|dependencies|package\.json|npm|pnpm|bun|pip|cargo\s+add|upgrade)\b/i,
    directive:
      "If dependencies are touched, verify latest versions and maintenance status via live research instead of memory.",
  },
  {
    id: "visual_gate",
    pattern:
      /\b(ui|component|page|visual|design|layout|style|theme|responsive|viewport|css|tsx|jsx|vue|svelte|html)\b/i,
    directive:
      "If visual files change, require screenshots at 375/768/1440px and dark/light modes before claiming success.",
  },
  {
    id: "execution_gate",
    pattern:
      /\b(run|build|test|validate|verify|proof|evidence|deploy|ship|production|release|publish)\b/i,
    directive:
      "Require concrete execution proof: exact gate commands, evidence paths, and screenshots when UI work is involved.",
  },
];

const GENERAL_GATES = [
  "PROACTIVE_CONTEXT: Gather missing repo, runtime, and official-doc context when it can materially improve correctness or execution.",
  "MAX_JUSTIFIED_KNOWLEDGE: If material uncertainty remains, continue reading, researching, diagnosing, or delegating. Do not answer from the first plausible assumption.",
];

function collectMatches(rules, prompt) {
  return rules
    .map((rule, index) => ({
      ...rule,
      index,
      matched: rule.pattern.test(prompt),
    }))
    .filter((rule) => rule.matched);
}

function selectPrimary(prompt) {
  const slashCommand = extractSlashCommand(prompt);
  if (slashCommand && COMMAND_TO_PRIMARY_ID[slashCommand]) {
    const selectedRule = findPrimaryRuleById(COMMAND_TO_PRIMARY_ID[slashCommand]);
    if (selectedRule) {
      return {
        selected: selectedRule,
        alternatives: [],
      };
    }
  }

  const matches = collectMatches(PRIMARY_RULES, prompt);
  if (matches.length === 0) {
    return null;
  }

  matches.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return left.index - right.index;
  });

  return {
    selected: matches[0],
    alternatives: matches.slice(1),
  };
}

function buildContext(prompt) {
  const primary = selectPrimary(prompt);
  const secondary = collectMatches(SECONDARY_RULES, prompt);

  const lines = ["WI-DISPATCH: Structured routing active."];

  if (primary) {
    lines.push(`PRIMARY_MODE: ${primary.selected.id}`);
    lines.push(`PRIMARY_SKILL: ${primary.selected.skill}`);
    lines.push(`PRIMARY_DIRECTIVE: ${primary.selected.directive}`);
    if (primary.alternatives.length > 0) {
      lines.push(
        `ALTERNATE_PRIMARY_MATCHES: ${primary.alternatives.map((rule) => rule.id).join(", ")}`,
      );
    }
  } else {
    lines.push("PRIMARY_MODE: general_orchestration");
    lines.push(
      "PRIMARY_DIRECTIVE: No specific workflow matched strongly enough. Stay in orchestrator mode, clarify routing if needed, and do not jump into direct implementation.",
    );
  }

  lines.push(
    "PRIMARY_NOTE: In the first response, commit to exactly one primary mode. Do not mix multiple primary workflows in the same opening reply; treat other matches as deferred context or gates.",
  );

  lines.push("GENERAL_GATES:");
  for (const gate of GENERAL_GATES) {
    lines.push(`- ${gate}`);
  }

  if (secondary.length > 0) {
    lines.push("SECONDARY_GATES:");
    for (const rule of secondary) {
      lines.push(`- ${rule.id}: ${rule.directive}`);
    }
  } else {
    lines.push("SECONDARY_GATES: none");
  }

  return lines.join("\n");
}

handleStdin((data) => {
  const prompt = data.prompt || "";
  const context = buildContext(prompt);
  return injectContext("UserPromptSubmit", context);
});
