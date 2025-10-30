# Mnemos

Mnemos — это монорепозиторий, объединяющий REST API на Fastify, web-клиент на React и общее хранилище типов.
Проект ориентирован на демонстрацию полнофункциональной аутентификации, управления записями пользователя и работы с
обновляемыми refresh-токенами.

## Архитектура

- **`apps/api`** — Fastify-сервис с Prisma ORM, JWT-аутентификацией и автоматической генерацией OpenAPI-спецификации.
- **`apps/web`** — SPA на React + Vite, использующая MUI, React Query, Zustand и notistack.
- **`packages/types`** — общие типы, генерируемые из OpenAPI при помощи Orval, доступны как workspace-пакет.
- **`deploy/compose.yml`** — пример docker-compose для API и PostgreSQL.

### Стек

| Слой            | Технологии                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Язык            | TypeScript 5                                                               |
| Build/Dev       | pnpm workspace, Turborepo, Vite, tsx                                       |
| Backend         | Fastify 5, Prisma, PostgreSQL, @fastify/swagger, bcrypt, JWT               |
| Frontend        | React 19, React Router, React Query, Material UI, Emotion, Zustand         |
| Типы/инструменты| Orval, Prettier, ESLint, TypeScript project references                     |

## Структура репозитория

```
apps/
  api/          # Код REST API, Prisma-схема и плагины
  web/          # Vite-приложение
packages/
  types/        # Общие типы и OpenAPI-генерация
deploy/
  compose.yml   # Базовый docker-compose для prod/dev окружения
```

## Требования

- Node.js >= 20
- pnpm >= 10 (указан в `packageManager`)
- Docker (опционально, для локального PostgreSQL через `deploy/compose.yml`)

## Установка

```bash
pnpm install
```

## Переменные окружения

Для `apps/api` ожидается файл `.env` (можно создать на основе примера ниже):

```
HOST=0.0.0.0
PORT=4000
DATABASE_URL=postgresql://mnemos:supersecret@localhost:5432/mnemos
JWT_ACCESS_SECRET=dev-access-secret
JWT_ACCESS_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
REFRESH_ABSOLUTE_MAX_DAYS=30
REFRESH_COOKIE_NAME=mnemos-refresh
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
CORS_ORIGIN=http://localhost:5173
```

> Значения `REFRESH_TOKEN_TTL_DAYS` и `REFRESH_ABSOLUTE_MAX_DAYS` задаются в днях; при dev-запуске по умолчанию используются
> укороченные интервалы (1 минута для access-токена и несколько минут для refresh), см. `apps/api/src/env.ts`.

## Подготовка базы данных

```bash
cd apps/api
pnpm prisma:migrate:dev   # накатывает миграции
pnpm prisma:generate      # генерирует Prisma Client
```

Для запуска PostgreSQL локально можно использовать `docker compose`:

```bash
docker compose -f deploy/compose.yml up -d db
```

## Разработка

```bash
pnpm dev
```

Команда запускает API (`http://localhost:4000`) и web-клиент (`http://localhost:5173`) параллельно через `concurrently`.
Swagger UI доступен по `http://localhost:4000/docs`, JSON-спецификация — на `/docs/json`.

### Локальный запуск сервисов

- **API**: `pnpm -F @mnemos/api dev`
- **Web**: `pnpm -F @mnemos/web dev`

## Сборка и проверка

| Команда                         | Назначение                                |
| ------------------------------- | ----------------------------------------- |
| `pnpm build`                    | Сборка всех пакетов через Turborepo       |
| `pnpm -F @mnemos/api build`     | Сборка Fastify-приложения                 |
| `pnpm -F @mnemos/web build`     | Prod-сборка фронтенда                     |
| `pnpm lint`                     | ESLint для всех пакетов                   |
| `pnpm typecheck`                | Проверка типов TypeScript                 |
| `pnpm format`                   | Проверка форматирования Prettier          |
| `pnpm format:write`             | Автоисправление форматирования            |

## Генерация типов по OpenAPI

После запуска API можно экспортировать спецификацию и обновить общий пакет типов:

```bash
pnpm -F @mnemos/api swagger:export  # сохраняет swagger.json в packages/types
pnpm -F @mnemos/types gen:api       # Orval генерирует типы и React Query хуки
```

## Особенности реализации

### API (`apps/api`)

- JWT-аутентификация с access- и refresh-токенами, refresh хранится в HTTP-only cookie (`/api/auth`).
- Refresh-сессии сохраняются в таблице `RefreshSession` (Prisma) с поддержкой sliding window и абсолютного срока жизни.
- CRUD для сущности `Record` с ограничением по пользователю.
- Плагины Fastify разделены по файлам (`plugins/errors`, `plugins/auth`) для переиспользования логики.
- Автоматическая регистрация схем TypeBox и экспорт описания ошибок (`errorResponses`).

### Web (`apps/web`)

- Управление доступом через `RequireAuth` и bootstrap refresh-запроса при инициализации (`refresh()` в `App.tsx`).
- Общий `httpClient` на базе Axios с перехватчиками для автообновления access-токена и повторного выполнения запросов.
- React Query используется для загрузки данных и инвалидации кэша, Zustand — для auth- и user preferences store.
- Тема Material UI переключается между светлой/тёмной через локальное хранилище (`useUserPreferencesStore`).
- Страницы: главная панель, CRUD по записям, формы входа/регистрации и sandbox для уведомлений (только в dev-режиме).

### Пакет типов (`packages/types`)

- Хранит OpenAPI-спецификацию (`swagger.json`) и декларативные типы для переиспользования между сервисами.
- Orval генерирует декларации и React Query хуки, которые импортируются на фронтенде.

## Деплой

- `deploy/compose.yml` предоставляет базовую схему развёртывания: сервис API и PostgreSQL с томом для данных.
- Перед сборкой контейнера API выполните `pnpm -F @mnemos/api build` и соберите образ (например, `docker build -t mnemos-api apps/api`).
- Для миграций в production используйте `pnpm -F @mnemos/api prisma:migrate:deploy` внутри контейнера.

