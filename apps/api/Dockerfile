# syntax=docker/dockerfile:1.7
# ---------- base ----------
FROM node:20-bookworm-slim AS base
WORKDIR /work
ENV CI=true
RUN corepack enable

# ---------- deps (кеш по lockfile) ----------
FROM base AS deps
# корень
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./
# воркспейсы, нужные для API
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json
# оффлайн-кеш зависимостей
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm fetch --prod

# ---------- build ----------
FROM base AS build
# подтягиваем оффлайн-репо зависимостей
COPY --from=deps /work /work
# исходники только нужных пакетов
COPY packages/types ./packages/types
COPY apps/api ./apps/api
# prisma нужна в apps/api/prisma
# оффлайн установка только для API-пакета
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm -F @mnemos/api install --offline --frozen-lockfile
# билд кода
RUN pnpm -F @mnemos/api build
# упаковываем прод-набор в /out
RUN pnpm -F @mnemos/api deploy --prod /out
# prisma client нужен в /out: генерим ОДИН раз здесь
RUN pnpm --dir /out prisma:generate
# убедимся, что схема миграций присутствует
RUN mkdir -p /out/prisma && cp -r apps/api/prisma/* /out/prisma/

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/ ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
