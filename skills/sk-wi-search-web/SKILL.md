---
name: sk-wi-search-web
description: Deep web research on any topic. Searches multiple angles in parallel, synthesizes findings with sources. Use when you need current information, comparisons, or verified facts from the web.
---

# Search Web

Agent instruction manual for deep web research.

## Protocol

### 1. Define the question

One clear sentence. What do we need to know?

### 2. Hard gate

Do not produce a recommendation until all of these are true:

- You ran at least 3 distinct searches: one good angle, one bad/community angle, one data angle.
- You have at least 3 distinct sources total.
- You have at least 1 official source when recommending a product, API, framework, package, or vendor.
- You have at least 1 bad/community source showing pitfalls, failures, complaints, or migration pain.
- You have at least 1 data source for numbers, benchmarks, downloads, bundle size, release cadence, or maintenance signals.
- You can state a confidence level: `HIGH`, `MEDIUM`, or `LOW`.
- You can state explicit unknowns.

If any gate is missing, keep researching or say `Recommendation withheld: evidence incomplete.`

### 3. Good angle query

Search for:
- Official documentation
- Best practices from named experts/teams
- Successful implementations (with links)
- Current version numbers and changelogs

Run at least one explicit good-angle query.

### 4. Bad/community angle query

Search for:
- GitHub issues, bug reports
- Community complaints (Reddit, Stack Overflow, HN)
- Known pitfalls and anti-patterns
- Migration horror stories
- Breaking changes between versions

Run at least one explicit bad/community-angle query.

### 5. Data angle query

Gather numbers:
- Stars, downloads, npm trends
- Bundle size (bundlephobia)
- Benchmarks (cite source)
- Last release date, maintenance status
- Number of open issues vs closed

Run at least one explicit data-angle query.

### 6. Synthesis

```
What works (with sources) →
What fails (with sources) →
Recommendation (for our context) →
What we reject (and why)
```

Base confidence on the actual evidence quality:

- `HIGH` — hard gate fully satisfied, sources agree, unknowns are minor.
- `MEDIUM` — hard gate satisfied, but trade-offs or missing data still matter.
- `LOW` — recommendation is tentative or evidence is thin/conflicting.

## Output format

```markdown
# Research: {topic}

## Question
{One sentence}

## Queries run
- Good: {query}
- Bad: {query}
- Data: {query}

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

## Confidence
{HIGH|MEDIUM|LOW} — {Why}

## Unknowns
- {What is still uncertain}

## Rejected alternatives
{What we didn't choose and why}

## Sources
1. {Official source}
2. {Bad/community source}
3. {Data source}
4. {Additional sources if used}
```

## Save location

If in a project context: `.whytcard/projects/{id}/research/{topic}-{date}.md`
