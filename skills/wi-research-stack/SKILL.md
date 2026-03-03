---
name: wi-research-stack
description: Compare tech stacks, libraries, or frameworks with real data. Dual-angle analysis for each option, comparison table, clear recommendation. Use before choosing a technology or when evaluating alternatives.
---

# Research Stack

Agent instruction manual for technology comparison.

## Protocol

### 1. Identify the options

From the user's request, list 2-4 options to compare. If the user only mentioned one, find 1-2 credible alternatives.

### 2. Research each option

For each option, gather:

**Official sources**
- Documentation quality and completeness
- Getting started experience
- API surface and learning curve

**Community health**
- GitHub stars and trend (growing/stable/declining)
- npm weekly downloads (or equivalent)
- Last release date and release frequency
- Number of open issues vs closed ratio
- Active maintainers count

**Technical data**
- Bundle size (bundlephobia or equivalent)
- Performance benchmarks (cite source)
- TypeScript support quality
- Framework compatibility

**Real-world feedback**
- Positive experiences (blog posts, case studies)
- Negative experiences (GitHub issues, Reddit complaints)
- Migration stories (from/to this option)

### 3. Build comparison table

```markdown
| Criteria | Option A | Option B | Option C |
|----------|----------|----------|----------|
| Stars | ... | ... | ... |
| Weekly downloads | ... | ... | ... |
| Bundle size | ... | ... | ... |
| Last release | ... | ... | ... |
| TS support | ... | ... | ... |
| Learning curve | ... | ... | ... |
| Maturity | ... | ... | ... |
```

### 4. Dual-angle per option

For each:
- **Good**: What it does best, where it shines
- **Bad**: Known pain points, limitations, risks

### 5. Recommend

Clear recommendation for the user's specific context:
- What we choose and why
- What we reject and why
- What conditions would change the recommendation

## Save location

`.whytcard/projects/{id}/research/stack-comparison-{topic}-{date}.md`
