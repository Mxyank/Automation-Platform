# ============================================
# CloudForge DevOps Platform - Dockerfile
# Multi-stage build for production deployment
# ============================================

# Stage 1: Base - Install dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# Stage 2: Builder - Build frontend and backend
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build

# Stage 3: Production - Minimal runtime image
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

RUN chown -R appuser:nodejs /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]