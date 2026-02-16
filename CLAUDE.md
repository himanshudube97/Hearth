# Hearth - Project Instructions

## Development Environment

**This project runs in Docker.** Always use Docker commands for development.

### Start the app
```bash
docker compose up -d
```

### Restart after code changes
```bash
docker compose restart app
```

### View logs
```bash
docker compose logs -f app
```

### Stop everything
```bash
docker compose down
```

### Database
- PostgreSQL runs in Docker container `hearth-db`
- App connects via `DATABASE_URL` in docker-compose.yml
- Run Prisma commands inside the container:
  ```bash
  docker compose exec app npx prisma migrate dev
  docker compose exec app npx prisma db seed
  ```

## App Info
- **URL**: http://localhost:3000
- **Stack**: Next.js 16, React 19, Prisma, PostgreSQL, TipTap, Framer Motion
- **Features**: Journal entries, mood tracking, doodles, song embeds, letters (self & friends), themes

## Letters Feature
The letters feature allows users to write time-delayed letters:

### Self Letters
- User writes a letter to their future self
- Letter "disappears into the universe" with a beautiful animation
- Minimum 1 week delay required
- When unlock date arrives, user sees a magical reveal modal on app open

### Friend Letters
- User writes a letter to a friend via email
- Minimum 1 week delay required
- When unlock date arrives, friend receives a beautiful HTML email
- Email includes CTA to write a letter back

### Required Environment Variables
```bash
RESEND_API_KEY=re_xxxxx          # For sending friend letters via email
CRON_SECRET=your-secret-here     # To protect the delivery cron endpoint
```

### Letter Delivery Cron
Letters are delivered via `/api/cron/deliver-letters`. Call this endpoint daily:
- Vercel Cron: Add to vercel.json
- External service: POST or GET with `Authorization: Bearer {CRON_SECRET}`
