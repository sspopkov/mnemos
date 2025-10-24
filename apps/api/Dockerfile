# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /work
RUN corepack enable

# Корневые файлы монорепы
COPY .npmrc ./
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./

# package.json воркспейсов, нужных для резолюции и install
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json

# сказать pnpm, что мы в CI
ENV CI=true

# установка по локфайлу (теперь .npmrc уже на месте => настроек достаточно)
RUN pnpm install --frozen-lockfile

# после pnpm install --frozen-lockfile
RUN pnpm -F @mnemos/api prisma:generate

# исходники
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# сборка API (ts -> dist)
RUN pnpm --filter @mnemos/api build

# главное: собрать самодостаточный прод-бандл пакета
RUN pnpm --filter @mnemos/api deploy --prod /out

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# кладём уже упакованный пакет
COPY --from=builder /out/ ./

EXPOSE 4000
CMD ["node", "dist/index.js"]
