FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS builder
RUN apt-get update && apt-get install -y libc6-dev
COPY . .
RUN pnpm install
RUN pnpm db:generate
RUN pnpm build

FROM base AS runner
RUN apt-get update && apt-get install -y ca-certificates libssl1.1
RUN groupadd -g 1000 nodejs && \
    useradd -s /bin/bash -u 1000 -g nodejs nodejs

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs
EXPOSE 3000 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
