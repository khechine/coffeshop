FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY . .
RUN pnpm install
RUN pnpm db:generate
RUN pnpm build

FROM base AS runner
RUN apk add --no-cache libc6-compat openssl1.1-compat
RUN addgroup -g 1000 -S nodejs && \
    adduser -S nodejs -u 1000

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder --chown=nodejs:nodejs /app /app

USER nodejs
EXPOSE 3000 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
