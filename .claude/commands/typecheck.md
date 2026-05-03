---
description: Run TypeScript type-check inside the Docker container
allowed-tools: Bash
---

Run TypeScript type-check against the live container and report results.

Run: `docker compose exec app npx tsc --noEmit`

If clean: reply "Typecheck passed." and nothing else.

If errors:
- Group by file
- Show file:line references using markdown links so they're clickable
- Show the first 10 errors only — if more, mention the total count
- Don't propose fixes unless I ask
