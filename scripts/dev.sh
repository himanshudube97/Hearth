#!/bin/bash

# Hearth Development Script
# This script starts the database and runs migrations

set -e

echo "🌲 Starting Hearth development environment..."

# Start the database
echo "📦 Starting PostgreSQL..."
docker compose up db -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 3

# Check if database is ready
until docker compose exec db pg_isready -U hearth > /dev/null 2>&1; do
  echo "Waiting for database to be ready..."
  sleep 1
done

echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the development server
echo "🚀 Starting Next.js development server..."
npm run dev
