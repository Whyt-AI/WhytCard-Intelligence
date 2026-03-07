---
name: wi-brainstorm
description: Interactive brainstorm session with the user. Launch research agents to gather information, discuss findings, challenge assumptions, and converge on an approach. Use when the user wants to explore an idea, evaluate options, or think through a problem before building.
---

# Brainstorm

Mode: `interactive`

Interactive session. You and the user are the brain. Research subagents gather the missing information.

## Hard contract

- Official docs are the primary source.
- Community posts are allowed only as clearly labeled caveats.
- If the user requested exhaustive reading, list the requested corpus and do not claim full understanding until all requested items were read.
- Produce at least 3 approaches unless the user explicitly narrows the scope.

## Workflow

### 1. Read the required context

Before brainstorming, read the requested repo and documentation context that is required for a trustworthy discussion.

If the reading is incomplete, say exactly what remains unread.

### 2. Identify research axes

From the user's request, extract 2-4 research questions that need answers before deciding on an approach. Ask the user if the axes look right.

### 3. Launch research subagents in parallel

For each axis, create and launch a research subagent:

- **Codebase subagent** - Explore the existing code for relevant patterns, conventions, dependencies
- **Web research subagent** - Search for official docs first, then alternatives and caveats (use the `wi-search-web` skill)
- **Stack research subagent** - If technology choices are involved, compare options with real data (use the `wi-research-stack` skill)

Launch them in parallel. Each runs in an isolated context. Your context stays clean.

Save each research result to `.whytcard/projects/{id}/research/{topic}-{axis}-{date}.md`.

### 4. Build approaches

Before any decision, define at least 3 distinct approaches.

For each approach, capture:

- What it is
- Why it fits
- Why it can fail
- Dependencies/prerequisites
- Migration cost

Do not converge on a decision with fewer than 3 approaches unless the user explicitly narrows the scope.

### 5. Stress-test and discuss

When subagents return:

- Synthesize findings into a clear summary
- Present at least 3 approaches to the user with your analysis
- Highlight trade-offs, risks, and recommendations
- Challenge weak assumptions - yours and the user's
- Separate official platform behavior from community caveats
- Stress-test each approach on:
  - Scale and growth
  - Edge cases and failure modes
  - Migration cost and rollback complexity
  - Operational burden and maintenance cost

### 6. Iterate

The user may redirect:

- "What about X instead?" -> Launch a new research subagent
- "I don't want mocks" -> Note the constraint, adjust approach
- "Compare A vs B" -> Launch a stack research subagent

Keep going until you both converge.

### 7. Produce output

When the brainstorm converges:

- Write the brainstorm document to `.whytcard/projects/{id}/brainstorms/{topic}-{date}.md`
- Create the implementation plan in `.whytcard/projects/{id}/plans/{topic}-{date}.md`
- The plan contains the micro-action pipeline ready for execution under `.whytcard/projects/{id}/pipeline/steps/`

## Brainstorm document format

```markdown
# Brainstorm: {topic}

## Question
{The core question we explored}

## Research findings
{Summarized subagent findings with sources}

## Official behavior
{What the official docs say}

## Community caveats
{Useful caveats, clearly labeled as non-official}

## Approaches considered
### Approach 1
{Description, pros, cons, data, risks}

### Approach 2
{Description, pros, cons, data, risks}

### Approach 3
{Description, pros, cons, data, risks}

## Decision
{What we chose and why}

## Rejections
- {Approach rejected and why}

## Constraints
{Non-negotiables from the user}

## Open questions
- {What still needs confirmation}

## Sources
1. {Source}
2. {Source}
3. {Source}

## Next steps
{Link to the plan and expected `pipeline/steps/` entries}
```
