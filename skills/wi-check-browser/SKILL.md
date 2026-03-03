---
name: wi-check-browser
description: Visual verification via browser. Navigate to a URL, take screenshots at 3 viewports, check dark/light modes, evaluate UI quality. Use after any UI modification or when verifying a deployed page.
---

# Check Browser

Agent instruction manual for visual UI verification.

## Protocol

### 1. Navigate

Open the target URL (localhost, staging, or production).

### 2. Screenshot at 3 viewports

| Viewport | Width | Purpose |
|----------|-------|---------|
| Mobile | 375px | Phone experience |
| Tablet | 768px | Tablet/small laptop |
| Desktop | 1440px | Full desktop |

### 3. Theme check

If the app supports themes:
- Screenshot in light mode at all 3 viewports
- Screenshot in dark mode at all 3 viewports

### 4. Evaluate as a user

For each screenshot, answer:
- Is the layout correct? No overflow, no cut content?
- Is the typography readable? Proper hierarchy?
- Is the spacing consistent? No cramped or floating elements?
- Is it professional? Would you be proud to ship this?
- Is it accessible? Sufficient contrast? Focus indicators visible?

### 5. Report

For each issue found:
- Viewport where it occurs
- Exact location on the page
- What's wrong
- Suggested fix

### 6. Save

Save screenshots to `.whytcard/projects/{id}/proofs/screenshots/` with naming:
```
{page}-mobile-light.png
{page}-mobile-dark.png
{page}-tablet-light.png
{page}-tablet-dark.png
{page}-desktop-light.png
{page}-desktop-dark.png
```
