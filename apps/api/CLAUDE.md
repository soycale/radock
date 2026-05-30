# Radock — API

Koa REST + WebSocket API. See root `CLAUDE.md` for full task specs and project overview.

## Stack
- **Framework**: Koa 3.x + `@koa/router` + `@koa/cors` + `koa-body`
- **Validation**: `zod`
- **Database**: PostgreSQL 16 via **Kysely** with `CamelCasePlugin`
- **DB types**: `kysely-codegen` (auto-generated, never edit manually)
- **Auth**: `firebase-admin` — verifies Firebase ID tokens
- **Real-time**: `socket.io` server + `finnhub` WS client
- **Notifications**: `firebase-admin.messaging()` for FCM
- **Logging**: `pino` + `pino-pretty`
- **Tests**: `vitest`
- **Module system**: ESM (`"type": "module"`, NodeNext)
- **Dev runner**: `tsx watch --env-file=.env src/index.ts`

## Local Database
PostgreSQL 16 via Docker Compose:
```bash
cd apps/api
docker compose up -d     # start
docker compose down      # stop
docker compose logs db   # check logs
```
Connection string: `postgres://postgres:postgres@localhost:5432/radock`

## Migrations
Requires `golang-migrate` installed: `brew install golang-migrate`

```bash
pnpm migrate create <name>   # create up/down SQL files in data/migrations/
pnpm migrate up              # run all pending
pnpm migrate down <N>        # roll back N steps
pnpm migrate status          # clean / dirty / no migration
```

Migration files: `data/migrations/<timestamp>_<name>.up.sql` and `.down.sql`.
Always wrap SQL in `begin;` / `commit;`.

**No audit tables or triggers** in this project — keep migrations simple.

## DB Types
`src/data/db.ts` is auto-generated. Never edit it manually.
```bash
pnpm --filter @radock/api data:generate
```
Run this after every migration. With `CamelCasePlugin` + `--camel-case`:
- DB columns `snake_case` → TypeScript properties `camelCase`
- Public schema tables use just the table name as key (e.g. `"alerts"`)

## Module Pattern
```
src/modules/{domain}/
  routes/
    {resource}.schemas.ts    → Zod schemas + inferred TS types (XxxDto)
    {resource}.handlers.ts   → handler factories: (service) => async (ctx) => void
    {resource}.router.ts     → createXxxRouter(service): Router  (sets prefix)
  services/
    {resource}.service.ts    → business logic, throws HttpError subclasses
  data/
    {resource}.repository.ts → Kysely queries, plain class taking AppDatabase
  {domain}.setup.ts          → wire up module, export factory
```

No DI container in this project. Services are instantiated in `src/index.ts` and passed as deps.

## Services (non-module, cross-cutting)
```
src/services/
  finnhub.service.ts          → Finnhub WS client, emits 'price' events (EventEmitter)
  socket.service.ts           → Socket.IO server, verifies Firebase token on connect
  alert-evaluator.service.ts  → checks alerts on price tick, sends FCM
src/application/
  firebase.ts                 → firebase-admin singleton init
```

## Auth Middleware
`src/middleware/auth.middleware.ts`:
- Reads `Authorization: Bearer <firebase-id-token>`
- Calls `firebaseAdmin.auth().verifyIdToken(token)`
- Sets `ctx.state.user = { uid: string, email: string | undefined }`
- Throws `UnauthorizedError` (401) on missing / expired / invalid token

## Error Handling
Always throw subclasses from `src/shared/errors.ts`:
```typescript
throw new BadRequestError('...')    // 400
throw new UnauthorizedError('...')  // 401
throw new ForbiddenError('...')     // 403
throw new NotFoundError('...')      // 404
throw new ConflictError('...')      // 409
```
The error middleware in `src/middleware/error.middleware.ts` catches all `HttpError` instances
and returns `{ error: string, statusCode: number }` JSON with the correct HTTP status.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | `{ status: 'ok', uptime: number }` |
| GET | `/quotes` | Public | Current `StockQuoteDto[]` for all 10 symbols (parallel Finnhub REST calls) |
| GET | `/candles/:symbol` | Public | Historical OHLCV — query params: `resolution`, `from`, `to` (unix) |
| POST | `/alerts` | Auth | Create price alert — body: `CreateAlertDto` |
| GET | `/alerts` | Auth | List user's active alerts → `AlertDto[]` |
| DELETE | `/alerts/:id` | Auth | Delete alert (own only) → 204 |

## Socket.IO
- Attaches to the same HTTP server as Koa (different path)
- Auth middleware on connection: verifies `socket.handshake.auth.token` as Firebase ID token
- Emits `price_update` (`PriceUpdateEvent` from `@radock/types`) to all connected clients

## Path Aliases
```
#application/* → src/application/*
#middleware/*  → src/middleware/*
#modules/*     → src/modules/*
#shared/*      → src/shared/*
#data/*        → src/data/*
#services/*    → src/services/*
```
All imports use `.js` extension (NodeNext ESM), e.g. `import { x } from '#shared/errors.js'`

## Key Files
- `src/index.ts` — entry point; wires all services together, starts HTTP server
- `src/application/configuration.ts` — reads + validates all env vars
- `src/application/database.ts` — Kysely instance + `AppDatabase` type
- `src/application/server.ts` — Koa app factory, mounts all routers
- `src/application/firebase.ts` — firebase-admin singleton
- `src/data/db.ts` — auto-generated Kysely DB interface (never edit)
- `src/shared/errors.ts` — HttpError subclasses
- `src/middleware/auth.middleware.ts` — Firebase token guard
- `src/middleware/error.middleware.ts` — uniform error response

## Environment Variables
```
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/radock
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FINNHUB_API_KEY=your-finnhub-api-key
```

## Commands
```bash
pnpm dev            # tsx watch --env-file=.env src/index.ts
pnpm build          # tsc
pnpm test           # vitest run
pnpm type-check     # tsc --noEmit
pnpm data:generate  # regenerate src/data/db.ts from live schema
```
