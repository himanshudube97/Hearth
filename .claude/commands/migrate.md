---
description: Walk through a Prisma migration following Hearth's additive-only rule
---

Help me create a Prisma migration following Hearth's rules from CLAUDE.md.

**Hard rules — do not violate:**
1. Never create a migration that deletes data. All changes must be additive (new columns with defaults, new optional fields, new tables).
2. If Prisma warns about data loss when generating, STOP. Propose an additive alternative instead of accepting the destructive migration.

**Steps:**
1. First, ask me in one sentence what the schema change is for, so the migration name is descriptive (e.g., `add_letter_archive_flag`).
2. Show me the current diff in `prisma/schema.prisma` (`git diff prisma/schema.prisma`) and confirm it looks additive before generating.
3. Run: `docker compose exec app npx prisma migrate dev --name <descriptive-name>`
4. After generation, show me the generated SQL file path and its contents so I can review before it's applied to dev.
5. Confirm `docker compose exec app npx prisma generate` succeeded so the client is in sync.
6. Tell me if I need to restart the app container (`/restart`) for the new client to load.
