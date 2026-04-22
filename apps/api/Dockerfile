# Multi-stage optimized Dockerfile for API service
# Stage 1: Base with pnpm
FROM node:24-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@9.15.9 && \
    pnpm config set store-dir /.pnpm-store

# Stage 2: Development (includes source code)
FROM base AS development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/api

EXPOSE 3000
ENV NODE_ENV=development

CMD ["pnpm", "dev"]

# Stage 3: Builder
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @birthub/api build

# Stage 4: Production (slim, optimized)
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm@9.15.9 && \
    pnpm config set store-dir /.pnpm-store

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

# Set permissions
RUN chown -R node:nodejs /app && \
    chmod -R 555 /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

USER node

CMD ["node", "dist/apps/api/src/server.js"]
