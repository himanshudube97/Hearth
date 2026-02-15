FROM node:20-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies (fresh install for Linux platform)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Start script: wait for db, push schema, start dev server
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run dev -- --hostname 0.0.0.0"]
