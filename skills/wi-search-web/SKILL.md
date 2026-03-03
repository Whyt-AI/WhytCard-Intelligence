---
name: wi-search-web
description: Deep web research on any topic. Searches multiple angles in parallel, synthesizes findings with sources. Use when you need current information, comparisons, or verified facts from the web.
---

# Search Web

Agent instruction manual for deep web research.

## Protocol

### 1. Define the question

One clear sentence. What do we need to know?

### 2. Good angle

Search for:
- Official documentation
- Best practices from named experts/teams
- Successful implementations (with links)
- Current version numbers and changelogs

### 3. Bad angle

Search for:
- GitHub issues, bug reports
- Community complaints (Reddit, Stack Overflow, HN)
- Known pitfalls and anti-patterns
- Migration horror stories
- Breaking changes between versions

### 4. Data angle

Gather numbers:
- Stars, downloads, npm trends
- Bundle size (bundlephobia)
- Benchmarks (cite source)
- Last release date, maintenance status
- Number of open issues vs closed

### 5. Synthesis

```
What works (with sources) →
What fails (with sources) →
Recommendation (for our context) →
What we reject (and why)
```

## Output format

```markdown
# Research: {topic}

## Question
{One sentence}

## Good angle
{Findings with source links}

## Bad angle
{Findings with source links}

## Data
| Metric | Value | Source |
|--------|-------|--------|
| ... | ... | ... |

## Recommendation
{Clear recommendation with reasoning}

## Rejected alternatives
{What we didn't choose and why}
```

## Save location

If in a project context: `.whytcard/projects/{id}/research/{topic}-{date}.md`
