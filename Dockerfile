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
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app /app
EXPOSE 3000 3001

# Default command (can be overridden in docker-compose)
CMD ["pnpm", "start"]
