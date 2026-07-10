FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY docker/.npmrc ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @meridian/api...

FROM base AS build
COPY --from=deps /app ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @meridian/shared build
RUN pnpm --filter @meridian/api exec prisma generate
RUN pnpm --filter @meridian/api build

FROM build AS seed
WORKDIR /app/apps/api
CMD ["pnpm", "prisma", "db", "seed"]

FROM node:22-alpine AS runtime
RUN addgroup -g 1001 -S meridian && adduser -S meridian -u 1001 -G meridian
WORKDIR /app
COPY --from=build --chown=meridian:meridian /app/apps/api/dist ./dist
COPY --from=build --chown=meridian:meridian /app/apps/api/package.json ./
COPY --from=build --chown=meridian:meridian /app/apps/api/prisma ./prisma
COPY --from=build --chown=meridian:meridian /app/apps/api/node_modules ./node_modules
COPY --from=build --chown=meridian:meridian /app/node_modules ./root_node_modules
COPY docker/api-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && mkdir -p /app/uploads && chown -R meridian:meridian /app
USER meridian
ENV NODE_ENV=production
ENV API_PORT=3001
ENV NODE_PATH=/app/node_modules:/app/root_node_modules
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["./entrypoint.sh"]
