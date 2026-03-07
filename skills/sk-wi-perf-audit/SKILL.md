---
name: sk-wi-perf-audit
description: Performance analysis and optimization. Analyzes bundle size, render cycles, database queries, API response times, image optimization, and lazy loading. Identifies top bottlenecks with specific fixes. Use for performance audits or before shipping.
---

# Performance Audit

Agent instruction manual for performance analysis and optimization.

## Protocol

### 1. Bundle analysis

- Check bundle size (total and per-chunk)
- Identify large dependencies and their alternatives
- Check for duplicate packages in the dependency tree
- Verify tree-shaking is working (no unused exports bundled)
- Check code splitting configuration

### 2. Render performance

For frontend projects:

| Check | What to look for |
|-------|-----------------|
| Unnecessary re-renders | Components re-rendering without prop/state changes |
| Missing memoization | Expensive computations without `useMemo`/`memo` |
| Large component trees | Components that should be split or lazy-loaded |
| Layout thrashing | DOM reads/writes interleaved in loops |
| Image optimization | Unoptimized images, missing `width`/`height`, no lazy loading |
| Font loading | Render-blocking fonts, no `font-display` strategy |

### 3. Server performance

For backend projects:

| Check | What to look for |
|-------|-----------------|
| N+1 queries | Loops that trigger individual database queries |
| Missing indexes | Queries on unindexed columns |
| Connection pooling | Database connections not pooled |
| Caching | Repeated expensive computations without caching |
| Payload size | API responses returning unnecessary data |
| Compression | Missing gzip/brotli on responses |

### 4. Network performance

- API waterfall: sequential requests that could be parallel
- Missing prefetch/preload for critical resources
- Unnecessary API calls (data already available)
- WebSocket vs polling analysis where applicable
- CDN configuration for static assets

### 5. Build and deployment

- Development vs production build differences
- Source maps configuration
- Asset hashing for cache busting
- Static generation vs server rendering analysis
- Edge deployment opportunities

## Severity

| Level | Criteria |
|-------|----------|
| **CRITICAL** | Visible to users. Page load > 3s, interaction delay > 100ms, layout shift. Fix immediately. |
| **HIGH** | Measurable impact. Bundle > 500KB, unnecessary network requests. Fix before shipping. |
| **MEDIUM** | Optimization opportunity. Saves 10-30% in a metric. Fix in next sprint. |
| **LOW** | Minor improvement. Nice to have. Address when convenient. |

## Output format

```markdown
# Performance Audit: {project}

## Summary
{Overall performance posture in 2-3 sentences}

## Top 5 Bottlenecks
1. [{file}:{line}] {issue} — {measured impact} — {fix}
2. ...

## CRITICAL
- [{file}:{line}] {issue} — {impact} — {fix}

## HIGH
- [{file}:{line}] {issue} — {impact} — {fix}

## MEDIUM / LOW
- ...

## Metrics
| Metric | Current | Target |
|--------|---------|--------|
| Bundle size | ... | ... |
| First paint | ... | ... |
| TTI | ... | ... |

## Recommendations
{Priority-ordered optimization steps}
```

## Save location

`.whytcard/projects/{id}/reviews/perf-audit-{date}.md`
