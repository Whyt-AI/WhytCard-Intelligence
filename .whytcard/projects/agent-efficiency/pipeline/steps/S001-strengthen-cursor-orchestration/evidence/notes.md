# Notes

- Dispatch is now deterministic at the workflow level, but it still uses regex heuristics rather than semantic classification.
- The pre-edit gate now blocks direct application-code edits and preserves plugin/orchestration edits, which should reduce improper non-delegated coding in Cursor.
- Evidence expectations are stricter in both hook stop prompts and skill contracts, so shallow research and weak completion claims should be denied more often.
