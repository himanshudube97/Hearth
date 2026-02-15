#!/bin/bash

# Hearth Quick Start Script
# Just run: npm run up

set -e

echo ""
echo "🌲 Hearth — a meditative journal that listens"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  echo ""
  echo "After starting Docker, run: npm run up"
  exit 1
fi

# Start database
echo "📦 Starting PostgreSQL database..."
docker compose up db -d

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
sleep 2
until docker compose exec db pg_isready -U hearth > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Database is ready!"

# Generate Prisma client and push schema
echo "🔧 Setting up database..."
npx prisma generate
npx prisma db push

echo ""
echo "🌿 Starting development server..."
echo "   Open http://localhost:3000 in your browser"
echo ""
echo "   Press Ctrl+C to stop"
echo ""

# Start the dev server
npm run dev
