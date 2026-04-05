FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS builder
RUN apt-get update && apt-get install -y libc6-dev python3 make g++ && rm -rf /var/lib/apt/lists/*
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
COPY . .
RUN rm -rf node_modules .pnpm-store pnpm-lock.yaml
RUN pnpm install --force
# Clean all old Prisma binaries and cache
RUN find . -name "*.so.node" -delete
RUN find . -name ".prisma" -type d -exec rm -rf {} + 2>/dev/null || true
RUN pnpm --filter "@coffeeshop/database" exec prisma generate --schema prisma/schema.prisma
RUN pnpm build

FROM base AS runner
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && \
    useradd -s /bin/bash -u 1001 -g nodejs nodejs && \
    mkdir -p /home/nodejs/.cache/node/corepack/v1 && \
    chown -R nodejs:nodejs /home/nodejs

WORKDIR /app
ENV NODE_ENV production
ENV HOME=/home/nodejs

COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs
EXPOSE 3000 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
