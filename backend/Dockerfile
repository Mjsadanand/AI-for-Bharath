# ─── CARENET AI Backend — Docker Image ───────────────────────────────────────
# Multi-stage: compile TypeScript → lean production image
#
# Build:  docker build -t carenet-backend .
# Run:    docker run -p 5000:5000 --env-file .env carenet-backend

# ── Stage 1: Compile TypeScript ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup -S carenet && adduser -S carenet -G carenet
USER carenet

EXPOSE 5000

# Health check for AWS ECS / ALB / App Runner
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
