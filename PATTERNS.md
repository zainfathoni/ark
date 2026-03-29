# PATTERNS.md

Conventions and lessons learned from building this project. Updated by the `compound-capture` skill after each cycle. Read by coding agents at session start.

> Entries older than 90 days are reviewed for relevance during weekly heartbeat.

## Conventions

### Viz Meta Tags (2026-03-29)
Every `viz/*.html` file MUST have `<meta name="viz-author">` and `<meta name="viz-date">` in `<head>`. The pre-commit hook uses these to auto-generate `viz/index.html`. Without them, the page shows "Unknown" author and no date.

## Gotchas

<!-- Things that broke or wasted time — avoid repeating these -->

## Preferred Approaches

<!-- Patterns that worked well — do more of these -->
