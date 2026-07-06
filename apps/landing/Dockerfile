# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/landing/package.json ./apps/landing/
RUN pnpm install --frozen-lockfile --filter @meridian/landing...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/landing ./apps/landing
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @meridian/landing build

FROM node:22-alpine AS runtime
RUN addgroup -g 1001 -S meridian && adduser -S meridian -u 1001 -G meridian
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3004
COPY --from=build --chown=meridian:meridian /app/apps/landing/.next/standalone ./
COPY --from=build --chown=meridian:meridian /app/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=build --chown=meridian:meridian /app/apps/landing/public ./apps/landing/public
USER meridian
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3004/ || exit 1
CMD ["node", "apps/landing/server.js"]
