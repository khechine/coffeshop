FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x,native"
COPY . .
RUN rm -rf node_modules .pnpm-store pnpm-lock.yaml
RUN pnpm install --force
# Clean all old Prisma binaries and cache
RUN find . -name "*.so.node" -delete
RUN find . -name ".prisma" -type d -exec rm -rf {} + 2>/dev/null || true
RUN pnpm --filter "@coffeeshop/database" exec prisma generate
RUN pnpm build

FROM base AS runner
RUN apk add --no-cache libc6-compat ca-certificates openssl
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs
EXPOSE 3000 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
