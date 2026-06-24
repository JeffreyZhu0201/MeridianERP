# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile --filter @meridian/admin...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY apps/admin ./apps/admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @meridian/shared build
RUN pnpm --filter @meridian/ui build
RUN pnpm --filter @meridian/admin build

FROM node:22-alpine AS runtime
RUN addgroup -g 1001 -S meridian && adduser -S meridian -u 1001 -G meridian
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build --chown=meridian:meridian /app/apps/admin/.next/standalone ./
COPY --from=build --chown=meridian:meridian /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=meridian:meridian /app/apps/admin/public ./apps/admin/public
USER meridian
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "apps/admin/server.js"]
