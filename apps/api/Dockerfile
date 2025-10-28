# ---------- builder ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /work
RUN corepack enable

# корень
COPY .npmrc ./
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./

# package.json нужных воркспейсов
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json

# сказать pnpm, что мы в CI
ENV CI=true

# Устанавливаем зависимости с кешём
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile

# исходники
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# сборка
RUN pnpm --filter @mnemos/api build

# собрать самодостаточный прод-бандл пакета
RUN pnpm --filter @mnemos/api deploy --prod /out

# ✅ Скопируем prisma схему прямо из исходников api в /out (без промежуточного ./prisma)
RUN mkdir -p /out/prisma && cp -r apps/api/prisma/* /out/prisma/

# ✅ ОДНА генерация Prisma Client — уже в /out
RUN pnpm --dir /out prisma:generate

# ---------- runtime ----------
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# кладём уже упакованный пакет
COPY --from=builder /out/ ./

EXPOSE 4000
CMD ["node", "dist/index.js"]
