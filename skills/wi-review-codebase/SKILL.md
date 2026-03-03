---
name: wi-review-codebase
description: Full codebase health check across 6 dimensions. Scans code quality, type safety, security, performance, dependencies, and test coverage. Produces a prioritized report. Use for auditing existing projects.
---

# Review Codebase

Agent instruction manual for a comprehensive codebase audit.

## Protocol

Run each dimension. For each, produce findings with severity.

### Dimension 1: Code quality

- Dead code (unused functions, unreachable branches)
- Duplication (copy-pasted logic)
- Naming (unclear variables, misleading function names)
- Complexity (deeply nested logic, functions > 50 lines)
- Consistency (mixed patterns, inconsistent style)

### Dimension 2: Type safety

- `any` usage (explicit or implicit)
- Type assertions (`as`, `as unknown as`)
- Suppressions (`@ts-ignore`, `@ts-nocheck`)
- Weak config (`strict: false`, `skipLibCheck: true`)
- Missing return types on exported functions

### Dimension 3: Security

- Hardcoded secrets (API keys, tokens, passwords)
- Injection vectors (SQL, XSS, command injection)
- Unsafe patterns (`eval`, `new Function`, `dangerouslySetInnerHTML`)
- Missing input validation at system boundaries
- Dependency vulnerabilities (known CVEs)

### Dimension 4: Performance

- N+1 queries (database or API)
- Unnecessary re-renders (React: missing memo, inline objects in props)
- Large bundle imports (importing entire libraries for one function)
- Missing lazy loading (routes, heavy components, images)
- Synchronous blocking operations

### Dimension 5: Dependencies

- Outdated packages (major versions behind)
- Unmaintained packages (no release > 1 year)
- Redundant packages (multiple libraries doing the same thing)
- Missing lockfile integrity

### Dimension 6: Test coverage

- Untested critical paths (auth, payment, data mutation)
- Skipped tests (`test.skip`, `.only`)
- Missing edge case coverage
- Tests that test implementation instead of behavior

## Severity levels

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Must fix. Security vulnerability, data loss risk, broken functionality. |
| **MAJOR** | Should fix. Performance bottleneck, significant tech debt, reliability risk. |
| **MINOR** | Nice to fix. Code style, minor optimization, readability. |
| **INFO** | Observation. No immediate action needed. |

## Output format

```markdown
# Codebase Review: {project}

## Summary
{Overall health assessment in 2-3 sentences}

## Findings

### CRITICAL
- [{file}:{line}] {description} — {suggested fix}

### MAJOR
- [{file}:{line}] {description} — {suggested fix}

### MINOR
- [{file}:{line}] {description} — {suggested fix}

### INFO
- {observation}

## Scores
| Dimension | Grade | Notes |
|-----------|-------|-------|
| Code quality | A-F | ... |
| Type safety | A-F | ... |
| Security | A-F | ... |
| Performance | A-F | ... |
| Dependencies | A-F | ... |
| Test coverage | A-F | ... |
```

## Save location

`.whytcard/projects/{id}/reviews/codebase-review-{date}.md`

If the `reviews/` folder is missing, initialize the per-project structure first using `wi-init-project`.
