---
description: Restart the Hearth Docker app and tail recent logs
allowed-tools: Bash
---

Restart the app container and show recent logs so we can confirm startup succeeded.

Run: `docker compose restart app && docker compose logs app --tail=40`

If the logs show errors (Prisma client mismatch, missing env vars, port conflicts), surface them at the top of your reply with a one-line diagnosis. Otherwise just confirm the app is back up.
