# ─── CARENET AI Backend — Docker Image ───────────────────────────────────────
#
# Multi-stage build: compiles TypeScript in a build stage, then produces a
# lean production image. Deploy to Amazon ECS (Fargate) or Amazon EC2.
#
# Build:  docker build -t carenet-backend .
# Run:    docker run -p 5000:5000 --env-file .env carenet-backend

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for tsc)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript → dist/
COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Non-root user (security hardening for ECS)
RUN addgroup -S carenet && adduser -S carenet -G carenet
USER carenet

# Expose Express port
EXPOSE 5000

# Health check — ECS / ALB target group health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
