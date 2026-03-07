---
name: sk-wi-security-audit
description: Security vulnerability scan. Checks dependencies for CVEs, code for injection vectors, secrets in repo, and config weaknesses. OWASP Top 10 coverage. Use for security audits or before shipping.
---

# Security Audit

Agent instruction manual for security vulnerability scanning.

## Protocol

### 1. Dependency scan

- Check `package.json` / `Cargo.toml` / `requirements.txt` for known CVEs
- Run `npm audit` or equivalent
- Flag packages with no updates > 1 year
- Check for packages with known security advisories

### 2. Code pattern scan

Scan all source files for:

| Pattern | Risk | What to look for |
|---------|------|-----------------|
| SQL injection | Critical | String concatenation in queries, missing parameterization |
| XSS | Critical | `dangerouslySetInnerHTML`, unescaped user input in DOM |
| Command injection | Critical | `exec()`, `spawn()` with user input |
| Path traversal | High | User input in file paths without sanitization |
| CSRF | High | Missing CSRF tokens on state-changing endpoints |
| Insecure deserialization | High | `eval()`, `new Function()`, `JSON.parse` on untrusted input |
| SSRF | Medium | User-controlled URLs in server-side requests |

### 3. Secrets scan

Search for:
- API keys, tokens, passwords in source files
- `.env` files committed to git
- Hardcoded credentials in config files
- Private keys in the repository

### 4. Configuration weaknesses

Check for:
- CORS misconfiguration (wildcard origins)
- Missing security headers (CSP, HSTS, X-Frame-Options)
- Debug mode enabled in production config
- Weak authentication settings (no rate limiting, no token expiry)
- Missing input validation at API boundaries

### 5. OWASP Top 10 checklist

- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Authentication Failures
- [ ] A08: Data Integrity Failures
- [ ] A09: Logging Failures
- [ ] A10: SSRF

## Severity

| Level | Criteria |
|-------|----------|
| **CRITICAL** | Exploitable now. Data breach risk. Fix immediately. |
| **HIGH** | Exploitable with effort. Significant risk. Fix before shipping. |
| **MEDIUM** | Limited exploitability. Fix in next sprint. |
| **LOW** | Theoretical risk. Address when convenient. |

## Output format

```markdown
# Security Audit: {project}

## Summary
{Overall security posture in 2-3 sentences}

## CRITICAL
- [{file}:{line}] {vulnerability} — {impact} — {fix}

## HIGH
- [{file}:{line}] {vulnerability} — {impact} — {fix}

## MEDIUM / LOW
- ...

## OWASP Coverage
{Checklist results}

## Recommendations
{Priority-ordered action items}
```

## Save location

`.whytcard/projects/{id}/reviews/security-audit-{date}.md`
