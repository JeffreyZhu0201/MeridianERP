# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @meridian/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @meridian/shared build
WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runtime
RUN addgroup -g 1001 -S meridian && adduser -S meridian -u 1001 -G meridian
WORKDIR /app
COPY --from=build --chown=meridian:meridian /app/apps/api/dist ./dist
COPY --from=build --chown=meridian:meridian /app/apps/api/package.json ./
COPY --from=build --chown=meridian:meridian /app/apps/api/prisma ./prisma
COPY --from=build --chown=meridian:meridian /app/node_modules ./node_modules
COPY --from=build --chown=meridian:meridian /app/apps/api/node_modules ./apps_api_node_modules
USER meridian
ENV NODE_ENV=production
ENV API_PORT=3001
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
