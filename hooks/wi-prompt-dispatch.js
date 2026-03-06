#!/usr/bin/env node
/**
 * wi-prompt-dispatch — UserPromptSubmit hook
 *
 * Analyzes the user's prompt keywords and injects dispatch hints
 * so the orchestrator knows which skills to give its agents.
 * Works on both Claude Code and Cursor via shared output module.
 */

const { handleStdin, injectContext, emptyResponse } = require("./lib/output");

const PRIMARY_RULES = [
  {
    id: "brainstorm",
    priority: 110,
    pattern: /\b(brainstorm\w*|ideate?\b|explor\w+\s+(?:idea|option|approach|solution)|think\s+through|weigh\s+(?:option|approach)|let'?s\s+think|on\s+(?:r[eé]fl[eé]chit?|pense)|what\s+(?:if|about)|should\s+(?:we|i)\s+(?:use|go\s+with|pick|choose))\b/i,
    skill: "skills/wi-brainstorm/SKILL.md",
    directive: "Run the interactive brainstorm workflow. Launch research subagents, compare multiple approaches, challenge assumptions, and converge with the user.",
  },
  {
    id: "new_project",
    priority: 100,
    pattern: /\b(new\s+project|from\s+scratch|scaffold|bootstrap|create\s+(?:a|an|the)\s+(?:app|tool|system|project|site)|init\w*\s+project|projet\s+complet|je\s+veux\s+un\s+(?:outil|projet|site))\b/i,
    skill: "skills/wi-new-project/SKILL.md",
    directive: "Run the new-project workflow. Gather requirements, research the stack, scaffold the pipeline, and execute step by step.",
  },
  {
    id: "fix_bug",
    priority: 95,
    pattern: /\b(bug|error|broken|failing|crash|fix|debug|doesn'?t\s+work|ne\s+(?:marche|fonctionne)\s+p(?:as|lus))\b/i,
    skill: "skills/wi-fix-bug/SKILL.md",
    directive: "Run the bug-fix workflow. Reproduce, isolate the root cause, fix it, and verify the regression path.",
  },
  {
    id: "add_feature",
    priority: 90,
    pattern: /\b(add\s+(?:a\s+)?feature|new\s+feature|implement|ajoute\w*|cr[eé]e\w*\s+(?:un|une|le|la)|build\s+(?:a|the))\b/i,
    skill: "skills/wi-add-feature/SKILL.md",
    directive: "Run the feature workflow. Analyze impact, decompose into micro-actions, delegate implementation, and verify with evidence.",
  },
  {
    id: "improve_project",
    priority: 85,
    pattern: /\b(improve|audit|refactor|clean\s*up|tech\s*debt|modernize|upgrade|optimize\s+(?:the\s+)?(?:code|project|app))\b/i,
    skill: "skills/wi-improve-project/SKILL.md",
    directive: "Run the project-improvement workflow. Audit the codebase, prioritize issues, create a fix pipeline, and execute with proofs.",
  },
  {
    id: "security_audit",
    priority: 80,
    pattern: /\b(security|vulnerabilit\w+|cve|owasp|injection|xss|csrf|s[eé]curit[eé])\b/i,
    skill: "skills/wi-security-audit/SKILL.md",
    directive: "Run the security-audit workflow. Check dependencies, code paths, secrets, and config against concrete risks.",
  },
  {
    id: "performance_audit",
    priority: 75,
    pattern: /\b(perf(?:ormance)?|slow|fast|speed|bundle\s*size|render|bottleneck|latenc\w+|lent|rapide)\b/i,
    skill: "skills/wi-perf-audit/SKILL.md",
    directive: "Run the performance-audit workflow. Measure bottlenecks, rank them, and propose fixes backed by data.",
  },
  {
    id: "code_review",
    priority: 70,
    pattern: /\b(review|code\s*review|audit\s+(?:the\s+)?code|quality\s+check|pr\s+review)\b/i,
    skill: "skills/wi-review-codebase/SKILL.md",
    directive: "Run the codebase review workflow. Audit quality, types, security, performance, dependencies, and tests.",
  },
  {
    id: "research_stack",
    priority: 65,
    pattern: /\b(stack|framework|library|librair\w+|biblioth[eè]que|package|outil|which\s+(?:lib|framework|tool)|compar\w+\s+(?:lib|framework|package|outil|biblioth[eè]que))\b/i,
    skill: "skills/wi-research-stack/SKILL.md",
    directive: "Run the stack-research workflow. Compare options with current data, risks, trade-offs, and a clear recommendation.",
  },
  {
    id: "search_web",
    priority: 60,
    pattern: /\b(research|compare|evaluate|which|best|alternative|recommend|pros.?cons|trade.?off|recherch\w*|cherch\w+|renseign\w+|meilleur\w*)\b/i,
    skill: "skills/wi-search-web/SKILL.md",
    directive: "Run the web-research workflow. Gather official, bad/community, and data sources before recommending anything.",
  },
  {
    id: "check_browser",
    priority: 50,
    pattern: /\b(check\s+(?:the\s+)?(?:browser|ui|visual|page|site|localhost)|screenshot|viewport|responsive|v[eé]rif\w+\s+(?:le\s+)?(?:visuel|rendu))\b/i,
    skill: "skills/wi-check-browser/SKILL.md",
    directive: "Run the visual-check workflow. Navigate, inspect the UI, and verify screenshots across required viewports and themes.",
  },
];

const SECONDARY_RULES = [
  {
    id: "research_gate",
    pattern: /\b(research|compare|evaluate|which|best|alternative|recommend|stack|framework|library|librair\w+|biblioth[eè]que|package|outil|pros.?cons|trade.?off|recherch\w*|cherch\w+|renseign\w+|meilleur\w*)\b/i,
    directive: "Before any recommendation, require official source + bad/community source + data source, at least 3 distinct sources total, explicit confidence, and explicit unknowns.",
  },
  {
    id: "version_gate",
    pattern: /\b(install|add\s+(?:package|dependency)|dependency|dependencies|package\.json|npm|pnpm|bun|pip|cargo\s+add|upgrade)\b/i,
    directive: "If dependencies are touched, verify latest versions and maintenance status via live research instead of memory.",
  },
  {
    id: "visual_gate",
    pattern: /\b(ui|component|page|visual|design|layout|style|theme|responsive|viewport|css|tsx|jsx|vue|svelte|html)\b/i,
    directive: "If visual files change, require screenshots at 375/768/1440px and dark/light modes before claiming success.",
  },
  {
    id: "execution_gate",
    pattern: /\b(run|build|test|validate|verify|proof|evidence|deploy|ship|production|release|publish)\b/i,
    directive: "Require concrete execution proof: exact gate commands, evidence paths, and screenshots when UI work is involved.",
  },
];

function collectMatches(rules, prompt) {
  return rules
    .map((rule, index) => ({ ...rule, index, matched: rule.pattern.test(prompt) }))
    .filter((rule) => rule.matched);
}

function selectPrimary(prompt) {
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

  if (!primary && secondary.length === 0) {
    return "";
  }

  const lines = ["WI-DISPATCH: Structured routing active."];

  if (primary) {
    lines.push(`PRIMARY_MODE: ${primary.selected.id}`);
    lines.push(`PRIMARY_SKILL: ${primary.selected.skill}`);
    lines.push(`PRIMARY_DIRECTIVE: ${primary.selected.directive}`);
    if (primary.alternatives.length > 0) {
      lines.push(
        `ALTERNATE_PRIMARY_MATCHES: ${primary.alternatives.map((rule) => rule.id).join(", ")}`
      );
    }
  } else {
    lines.push("PRIMARY_MODE: general_orchestration");
    lines.push(
      "PRIMARY_DIRECTIVE: No specific workflow matched strongly enough. Stay in orchestrator mode, clarify routing if needed, and do not jump into direct implementation."
    );
  }

  lines.push(
    "PRIMARY_NOTE: In the first response, commit to exactly one primary mode. Do not mix multiple primary workflows in the same opening reply; treat other matches as deferred context or gates."
  );

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

  if (!context) {
    return emptyResponse();
  }

  return injectContext("UserPromptSubmit", context);
});
