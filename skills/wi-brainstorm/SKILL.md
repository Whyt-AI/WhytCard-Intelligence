---
name: wi-brainstorm
description: Interactive brainstorm session with the user. Launch research agents to gather information, discuss findings, challenge assumptions, and converge on an approach. Use when the user wants to explore an idea, evaluate options, or think through a problem before building.
---

# Brainstorm

Interactive session. You (the orchestrator) and the user are the brain. Your research agents are your arms gathering information.

## Workflow

### 1. Identify research axes

From the user's request, extract 2-4 research questions that need answers before deciding on an approach. Ask the user if the axes look right.

### 2. Launch research agents in parallel

For each axis, create and launch a research agent:

- **Codebase agent** — Explore the existing code for relevant patterns, conventions, dependencies
- **Web research agent** — Search for current best practices, alternatives, known pitfalls (use the wi-search-web skill)
- **Stack research agent** — If technology choices are involved, compare options with real data (use the wi-research-stack skill)

Launch them in parallel. Each runs in an isolated context. Your context stays clean.

### 3. Present and discuss

When agents return:

- Synthesize findings into a clear summary
- Present to the user with your analysis
- Highlight trade-offs, risks, and recommendations
- Challenge weak assumptions — yours and the user's

### 4. Iterate

The user may redirect:

- "What about X instead?" → Launch a new research agent
- "I don't want mocks" → Note the constraint, adjust approach
- "Compare A vs B" → Launch a stack research agent

Keep going until you both converge.

### 5. Produce output

When the brainstorm converges:

- Write the brainstorm document to `.whytcard/projects/{id}/brainstorms/{topic}-{date}.md`
- Create the implementation plan in `.whytcard/projects/{id}/plans/{topic}-{date}.md`
- The plan contains the micro-action pipeline ready for agent execution

## Brainstorm document format

```markdown
# Brainstorm: {topic}

## Question
{The core question we explored}

## Research findings
{Summarized agent findings with sources}

## Options considered
{Each option with pros/cons/data}

## Decision
{What we chose and why}

## Constraints
{Non-negotiables from the user}

## Next steps
{Link to the plan}
```
