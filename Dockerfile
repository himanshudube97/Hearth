# ==================== BASE ====================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for Prisma and native modules
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ==================== DEPS ====================
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# ==================== DEV ====================
FROM base AS dev

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/prisma ./prisma

EXPOSE 3000

# Start dev server
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]

# ==================== BUILDER ====================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ==================== PRODUCTION ====================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node server.js"]
