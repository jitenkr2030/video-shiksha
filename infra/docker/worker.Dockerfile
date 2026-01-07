FROM oven/bun:latest AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy source code
COPY src ./src

# Production image
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 bun
RUN adduser --system --uid 1001 bun

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p /app/uploads
RUN chown -R bun:bun /app/uploads

USER bun

EXPOSE 3001

CMD ["bun", "run", "dev"]