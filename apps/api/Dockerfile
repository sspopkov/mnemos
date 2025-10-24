# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /work
RUN corepack enable

# корень
COPY .npmrc ./
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./

# ВАЖНО: схема и миграции нужны уже на этапе generate
COPY apps/api/prisma ./prisma

# package.json нужных воркспейсов
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json

# сказать pnpm, что мы в CI
ENV CI=true

# установка по локфайлу (теперь .npmrc уже на месте => настроек достаточно)
RUN pnpm install --frozen-lockfile

# исходники
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# теперь, когда prisma/ и исходники на месте — генерим клиент
RUN pnpm -F @mnemos/api prisma:generate

# сборка
RUN pnpm --filter @mnemos/api build

# главное: собрать самодостаточный прод-бандл пакета
RUN pnpm --filter @mnemos/api deploy --prod /out

# дополнительно убедимся, что prisma/ попадёт в /out
RUN mkdir -p /out/prisma && cp -r prisma/* /out/prisma/

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# кладём уже упакованный пакет
COPY --from=builder /out/ ./

EXPOSE 4000
CMD ["node", "dist/index.js"]
