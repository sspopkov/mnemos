# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /work
RUN corepack enable

# Корневые файлы монорепы
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./

# package.json воркспейсов, нужных для резолюции и install
COPY packages/types/package.json packages/types/package.json
COPY apps/api/package.json apps/api/package.json

# сказать pnpm, что мы в CI
ENV CI=true

RUN pnpm install --frozen-lockfile

# исходники
COPY packages/types ./packages/types
COPY apps/api ./apps/api

WORKDIR /work/apps/api
# тут уже CI=true унаследовано
RUN pnpm build && pnpm prune --prod

# ---------- runtime ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /work/apps/api/dist ./dist
COPY --from=builder /work/apps/api/package.json ./
COPY --from=builder /work/apps/api/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/index.js"]
