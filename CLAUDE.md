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
- **Features**: Journal entries, mood tracking, doodles, song embeds, letters to self, themes
