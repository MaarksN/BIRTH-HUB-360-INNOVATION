# Multi-stage optimized Dockerfile for Web service (Next.js)
# Stage 1: Base with pnpm
FROM node:24-alpine AS base

WORKDIR /app

RUN npm install -g pnpm@9.15.9 && \
    pnpm config set store-dir /.pnpm-store

# Stage 2: Development
FROM base AS development

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/web

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3001

CMD ["pnpm", "dev"]

# Stage 3: Builder
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @birthub/web build

# Stage 4: Production (slim, optimized)
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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

# Copy built app from builder stage
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

# Set permissions
RUN chown -R node:nodejs /app && \
    chmod -R 555 /app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001 || exit 1

EXPOSE 3001

USER node

WORKDIR /app/apps/web

CMD ["pnpm", "start"]
