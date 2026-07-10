FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY docker/.npmrc ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @meridian/admin...

FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app ./
COPY tsconfig.base.json ./
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
  CMD node -e "fetch('http://127.0.0.1:3000/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/admin/server.js"]
