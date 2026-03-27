FROM node:20-alpine AS base

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Stage 1: Build
FROM base AS builder
RUN apk add --no-cache libc6-compat
COPY . .
RUN pnpm install
RUN pnpm db:generate
RUN pnpm build

# Stage 2: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app /app
EXPOSE 3000

# Start command
# We use pnpm -r start or specifically point to the dashboard
# Looking at package.json, we have turbo build, let's just use turbo start if available
# Actually, let's just go into the app directory
WORKDIR /app/apps/admin-dashboard
CMD ["pnpm", "start", "-p", "3000"]
