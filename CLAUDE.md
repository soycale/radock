# Radock

## Overview
Radock is a full-stack mobile application for real-time stock price monitoring and price alerts.
Users track 10 major stocks with live prices, explore historical charts, and set price alerts that
trigger FCM push notifications the moment a stock exceeds their target price.

**Distribution:** iOS IPA (Ad Hoc / TestFlight) + Android APK  
**EAS owner:** soycale  
**Bundle ID:** com.soycale.radock

---

## Stack & Rationale

### API (`apps/api`)
| Package | Why |
|---------|-----|
| Koa 3.x + @koa/router | Lightweight, async-first Node HTTP framework |
| TypeScript + ESM (NodeNext) | Type safety, modern module system |
| Kysely + kysely-codegen | Type-safe SQL query builder; codegen keeps TS types in sync with DB schema automatically |
| zod | Runtime request validation with typed inference |
| firebase-admin | Two jobs: verify Firebase ID tokens (auth) + send FCM push notifications |
| finnhub | Official Finnhub JS SDK — WebSocket subscription + REST quotes/candles |
| socket.io | Real-time price broadcasting from backend to mobile clients |
| pino | Structured JSON logging, low overhead |
| PostgreSQL 16 | Stores price alerts |
| golang-migrate | SQL migration runner (same pattern as prior projects) |
| vitest | Unit + integration tests |

### Mobile (`apps/mobile`)
| Package | Why |
|---------|-----|
| Expo SDK 55 | Managed workflow — EAS Build handles native compilation without ejecting |
| Expo Router 55.x | File-based routing, tab + stack navigation |
| NativeWind v4 + Tailwind v3 | Utility-first styling, consistent `rd-*` design tokens |
| Zustand + expo-secure-store | Minimal state management, encrypted token persistence |
| Firebase JS SDK | Email/password auth via Firebase Auth |
| socket.io-client | Connects to backend, receives `price_update` events |
| victory-native | SVG line charts for historical price data (uses react-native-svg, bundled in Expo) |
| expo-notifications | FCM (Android) + APNs (iOS) push notification handler |

### Monorepo
| Tool | Why |
|------|-----|
| pnpm workspaces | Efficient package deduplication across apps |
| Turborepo | Parallel task running, build caching |

---

## Architecture

```
┌─────────────────────┐   Socket.IO (live prices)   ┌────────────────────────┐
│   React Native      │◄──────────────────────────► │   Koa API              │
│   (Expo Mobile)     │                              │   + Socket.IO server   │
│                     │   REST (alerts CRUD)         │                        │
│                     │◄──────────────────────────► │  ┌──────────────────┐  │
└─────────────────────┘                              │  │  Finnhub WS      │  │
                                                     │  │  Client          │  │
        FCM Push                                     │  └──────────────────┘  │
        Notification                                 │  ┌──────────────────┐  │
             │          Firebase Admin SDK           │  │  PostgreSQL 16   │  │
             └────────────────────────────────────►  │  │  (alerts table)  │  │
                                                     │  └──────────────────┘  │
                                                     └────────────────────────┘
```

**Real-time price flow:**
1. Backend opens a single Finnhub WebSocket connection and subscribes to all 10 symbols
2. On each trade event → emits `price_update` via Socket.IO to all connected mobile clients
3. Mobile `useSocket` hook receives events → updates Zustand `prices.store`

**Alert notification flow:**
1. Same price tick triggers the alert evaluator service
2. Queries active alerts where `symbol = X AND target_price <= current_price`
3. Sends FCM notification per match via `firebase-admin.messaging().send()`
4. Marks matched alerts as `is_active = false`

---

## Tracked Symbols (hardcoded — v1)

```typescript
// packages/types/src/index.ts
export const TRACKED_SYMBOLS = [
  'AAPL',  // Apple
  'MSFT',  // Microsoft
  'GOOGL', // Alphabet
  'AMZN',  // Amazon
  'TSLA',  // Tesla
  'META',  // Meta
  'NVDA',  // NVIDIA
  'NFLX',  // Netflix
  'UBER',  // Uber
  'SPOT',  // Spotify
] as const
export type StockSymbol = typeof TRACKED_SYMBOLS[number]
```

"More coming soon" is shown in the UI footer. No user-managed watchlist in v1.

---

## Monorepo Structure

```
radock/
├── apps/
│   ├── api/        → Koa REST + WebSocket API  — see apps/api/CLAUDE.md
│   └── mobile/     → Expo mobile app           — see apps/mobile/CLAUDE.md
├── packages/
│   └── types/      → Shared TypeScript types (DTOs, constants, events)
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Key Commands

```bash
# Root
pnpm dev                              # run all apps in parallel
pnpm build                            # build all apps
pnpm test                             # run all tests

# Scoped
pnpm --filter @radock/api dev
pnpm --filter @radock/mobile dev

# Migrations (from root, delegates to apps/api)
pnpm migrate create <name>
pnpm migrate up
pnpm migrate down <N>
pnpm migrate status

# DB types — run after every migration
pnpm --filter @radock/api data:generate
```

---

## Environment Variables

### `apps/api/.env`
```
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/radock
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FINNHUB_API_KEY=your-finnhub-api-key
```

### `apps/mobile/.env.local`
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your-web-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
```

---

## Business Rules

### Price Alerts
- A user can have multiple active alerts for the same symbol
- An alert fires when `current_price >= target_price`
- Alert is **one-shot**: after triggering, `is_active` is set to `false` — no repeat notifications
- `fcm_token` is captured at alert creation time and used to target that specific device
- Deleting an alert is a hard delete (no soft delete needed)

### Real-time Updates
- Backend maintains **one** Finnhub WS connection shared across all clients (not per-client)
- Mobile clients receive **all** symbol updates (no per-symbol rooms in v1)
- On app foreground, Socket.IO reconnects automatically

### Quotes endpoint
- `GET /quotes` fetches current price for all 10 symbols via Finnhub REST in parallel
- Called on mobile app mount to populate prices before the WS kicks in

---

## Conventions
- TypeScript strict null checks enabled; general `strict` mode off
- `experimentalDecorators` + `emitDecoratorMetadata` enabled (API)
- Kysely uses `CamelCasePlugin` — DB columns snake_case → camelCase in TypeScript
- All API imports use `.js` extension (NodeNext ESM convention)
- Validation via Zod — `.safeParse()` then throw `BadRequestError` on failure
- No DI container (unlike Carulla) — services instantiated directly and passed as deps
- Error middleware handles all thrown HttpError subclasses uniformly

---

## Task Checklist

Update this file as tasks are completed.

### Phase 1 — Foundation
- [x] **1.1** Monorepo scaffold
- [ ] **1.2** API: Koa server skeleton
- [ ] **1.3** API: Firebase Auth middleware
- [ ] **1.4** Mobile: Expo skeleton
- [ ] **1.5** Mobile: Login + auth store

### Phase 2 — API Core
- [ ] **2.1** API: Alerts migration
- [ ] **2.2** API: Alerts CRUD
- [ ] **2.3** API: Finnhub WebSocket client
- [ ] **2.4** API: Socket.IO broadcaster
- [ ] **2.5** API: FCM alert notifications

### Phase 3 — Mobile Screens
- [ ] **3.1** Mobile: Stock list screen
- [ ] **3.2** Mobile: Stock detail + chart
- [ ] **3.3** Mobile: Alerts list screen
- [ ] **3.4** Mobile: Create alert form

### Phase 4 — Polish & Deploy
- [ ] **4.1** Mobile: FCM push notification registration
- [ ] **4.2** API: Railway deployment config
- [ ] **4.3** EAS build config

---

# Task Specifications

Each task = one Claude Code session = one focused commit. Do not implement anything outside the task's scope — leave adjacent work for the next session.

---

## Task 1.1 — Monorepo Scaffold
**Commit:** `chore: monorepo scaffold`

**Goal:** Bare-bones monorepo that installs and type-checks cleanly. No app code yet.

**Files to create:**
- `pnpm-workspace.yaml` — workspaces: `apps/*`, `packages/*`
- `turbo.json` — pipelines: `build`, `dev`, `test`, `type-check`
- `package.json` (root) — scripts: `dev`, `build`, `test`; devDeps: turbo, typescript
- `tsconfig.base.json` — base TypeScript config (NodeNext, strict nulls, decorators)
- `packages/types/package.json` — name: `@radock/types`, main/exports pointing to `src/index.ts`
- `packages/types/tsconfig.json`
- `packages/types/src/index.ts` — all shared types (see below)

**Shared types (`packages/types/src/index.ts`):**
```typescript
export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'NFLX', 'UBER', 'SPOT',
] as const
export type StockSymbol = typeof TRACKED_SYMBOLS[number]

export const SYMBOL_NAMES: Record<StockSymbol, string> = {
  AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Alphabet', AMZN: 'Amazon',
  TSLA: 'Tesla', META: 'Meta', NVDA: 'NVIDIA', NFLX: 'Netflix',
  UBER: 'Uber', SPOT: 'Spotify',
}

export interface ApiResponse<T> { data: T; success: boolean }
export interface ApiError { error: string; statusCode: number }

export interface StockQuoteDto {
  symbol: StockSymbol
  price: number        // current price
  open: number
  high: number
  low: number
  prevClose: number
  change: number       // price - prevClose
  changePercent: number // (change / prevClose) * 100
}

export interface CandleDto {
  time: number   // unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PriceUpdateEvent {
  symbol: StockSymbol
  price: number
  timestamp: number
}

export interface AlertDto {
  id: string
  symbol: StockSymbol
  targetPrice: number
  isActive: boolean
  createdAt: string
}

export interface CreateAlertDto {
  symbol: StockSymbol
  targetPrice: number
  fcmToken: string
}
```

**Acceptance criteria:**
- [ ] `pnpm install` runs without errors from the root
- [ ] `pnpm --filter @radock/types build` (or type-check) passes
- [ ] `@radock/types` can be imported from other packages

---

## Task 1.2 — API: Koa Server Skeleton
**Commit:** `feat(api): koa server skeleton`

**Goal:** Running Koa server with `/health` endpoint, Postgres connection via Kysely, structured logging.

**Create `apps/api/` with:**
- `package.json` — name: `@radock/api`; deps: koa, @koa/router, @koa/cors, koa-body, pino, pino-pretty, kysely, pg, kysely-codegen, zod, tsx; devDeps: typescript, vitest, @types/node, @types/pg
- `tsconfig.json` — extends base, NodeNext, path aliases
- `.env.example` — all required env vars (no values)
- `docker-compose.yml` — PostgreSQL 16, port 5432, db: radock, user/pass: postgres
- `src/index.ts` — entry point, starts server
- `src/application/configuration.ts` — reads + validates env vars, exports `configuration` object
- `src/application/database.ts` — creates Kysely instance with CamelCasePlugin, exports `AppDatabase` type + `db`
- `src/application/server.ts` — creates Koa app, applies middleware, mounts routers, exports `createServer()`
- `src/middleware/error.middleware.ts` — catches all errors, returns `{ error, statusCode }` JSON
- `src/shared/errors.ts` — `HttpError` base + `BadRequestError`(400), `UnauthorizedError`(401), `ForbiddenError`(403), `NotFoundError`(404), `ConflictError`(409)
- `src/modules/health/health.router.ts` — `GET /health` → `{ status: 'ok', uptime: process.uptime() }`

**Path aliases in tsconfig.json:**
```json
{
  "#application/*": ["src/application/*"],
  "#middleware/*":  ["src/middleware/*"],
  "#modules/*":     ["src/modules/*"],
  "#shared/*":      ["src/shared/*"],
  "#data/*":        ["src/data/*"],
  "#services/*":    ["src/services/*"]
}
```

**Scripts in package.json:**
```json
{
  "dev":           "tsx watch --env-file=.env src/index.ts",
  "build":         "tsc",
  "test":          "vitest run",
  "type-check":    "tsc --noEmit",
  "data:generate": "kysely-codegen --out-file src/data/db.ts --camel-case --url $DATABASE_URL",
  "migrate":       "node --import tsx/esm tools/migrate/migrate.ts"
}
```

**Migration tool:** copy the pattern from Carulla — `apps/api/tools/migrate/` wrapping golang-migrate.

**Acceptance criteria:**
- [ ] `docker compose up -d` starts Postgres
- [ ] `pnpm --filter @radock/api dev` starts on port 3000 with no errors
- [ ] `GET /health` returns 200 `{ status: 'ok', uptime: <number> }`
- [ ] Server logs startup and each request with pino

---

## Task 1.3 — API: Firebase Auth Middleware
**Commit:** `feat(api): firebase auth middleware`

**Goal:** Middleware that verifies Firebase ID tokens; all protected routes return 401 without a valid token.

**Install:** `firebase-admin`

**Files to create:**
- `src/application/firebase.ts` — initialises the Firebase Admin app as a singleton using env vars:
  ```typescript
  import admin from 'firebase-admin'
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  export const firebaseAdmin = admin
  ```
- `src/middleware/auth.middleware.ts`:
  ```typescript
  // Reads: Authorization: Bearer <firebase-id-token>
  // Calls: firebaseAdmin.auth().verifyIdToken(token)
  // Sets:  ctx.state.user = { uid: string, email: string | undefined }
  // Throws: UnauthorizedError if missing, expired, or invalid
  ```

**Acceptance criteria:**
- [ ] `GET /health` remains public (no middleware applied)
- [ ] Any route wrapped with `authMiddleware` returns `401` without a valid Firebase ID token
- [ ] `ctx.state.user.uid` is set correctly for authenticated requests
- [ ] Expired tokens return 401 (not 500)

---

## Task 1.4 — Mobile: Expo Skeleton
**Commit:** `feat(mobile): expo skeleton`

**Goal:** Expo app launches, shows a placeholder screen, NativeWind works, EAS configured.

**Create `apps/mobile/` with:**
- Standard Expo SDK 55 setup with Expo Router
- NativeWind v4 + Tailwind v3 configured
- `app.json` — name: Radock, slug: radock, bundle ID: `com.soycale.radock`, owner: soycale
- `eas.json` — profiles below
- `app/_layout.tsx` — root layout with font loading + splash screen
- `app/index.tsx` — placeholder `<Text>Radock</Text>` on dark background
- `src/components/ui/Button.tsx` — variants: primary (`rd-primary` bg), secondary (bordered); loading state shows `ActivityIndicator`
- `src/components/ui/Input.tsx` — labelled input, `rd-surface` bg, `rd-border` border, shows error text below

**`eas.json`:**
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "ios": { "distribution": "internal" },
      "android": { "buildType": "apk" }
    },
    "production": {}
  }
}
```

**Tailwind color tokens (`tailwind.config.js`):**
```javascript
rd: {
  bg:      '#0F172A',  // slate-900  — app background
  surface: '#1E293B',  // slate-800  — cards, inputs
  border:  '#334155',  // slate-700  — borders
  primary: '#6366F1',  // indigo-500 — primary actions
  success: '#10B981',  // emerald-500 — price up / positive change
  danger:  '#EF4444',  // red-500    — price down / negative change
  text:    '#F8FAFC',  // slate-50   — primary text
  muted:   '#94A3B8',  // slate-400  — secondary text, placeholders
}
```

**Acceptance criteria:**
- [ ] `pnpm --filter @radock/mobile dev` starts Metro bundler
- [ ] Placeholder screen renders with `rd-bg` dark background
- [ ] NativeWind utility classes apply correctly on a real device / simulator
- [ ] `eas.json` references owner `soycale` and bundle ID `com.soycale.radock`

---

## Task 1.5 — Mobile: Login + Auth Store
**Commit:** `feat(mobile): login + auth store`

**Goal:** Login screen authenticates via Firebase, session persists across app restarts.

**Files to create:**
- `src/lib/firebase.ts` — initialise Firebase JS SDK from `EXPO_PUBLIC_FIREBASE_*` env vars
- `src/stores/auth.store.ts` — Zustand store with SecureStore persistence
- `src/hooks/useAuth.ts` — thin selector hook
- `src/api/client.ts` — fetch wrapper (`api.get`, `api.post`, `api.delete`, `setAuthToken`)
- `app/(auth)/_layout.tsx` — headerless Stack
- `app/(auth)/login.tsx` — email + password login screen
- `app/(app)/_layout.tsx` — tab navigator (single placeholder "Home" tab for now)
- `app/(app)/index.tsx` — placeholder home screen ("Markets — coming soon")
- `app/_layout.tsx` — auth guard + SecureStore rehydration

**Auth store shape:**
```typescript
interface AuthUser { uid: string; email: string }
interface AuthState {
  user: AuthUser | null
  token: string | null        // Firebase ID token
  isHydrated: boolean         // true once SecureStore rehydrated
  login(email: string, password: string): Promise<void>
  logout(): void
}
```

**Auth guard logic (`app/_layout.tsx`):**
- While `!isHydrated` → show splash/loading screen
- If `!token` → redirect to `/(auth)/login`
- If `token` → redirect to `/(app)`

**Login screen:**
- Email input + Password input (using `src/components/ui/Input.tsx`)
- "Sign In" primary button (using `src/components/ui/Button.tsx`)
- Calls `Firebase signInWithEmailAndPassword`, stores ID token via `auth.store.login()`
- Shows inline error on failure (wrong credentials, network error)

**Acceptance criteria:**
- [ ] Login with valid Firebase credentials redirects to `/(app)`
- [ ] Token persists — reopen app while logged in → no login screen
- [ ] Logout clears store + SecureStore, redirects to login
- [ ] Login failure shows error message inline
- [ ] `api.client` attaches `Authorization: Bearer <token>` on all requests

---

## Task 2.1 — API: Alerts Migration
**Commit:** `feat(api): alerts migration`

**Goal:** `alerts` table in the database, Kysely types generated.

**Migration file:** `data/migrations/<timestamp>_create_alerts.up.sql`

```sql
begin;

create table public.alerts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text        not null,
  symbol        text        not null,
  target_price  numeric(12,4) not null,
  fcm_token     text        not null,
  is_active     boolean     not null default true,
  triggered_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index alerts_user_id_idx        on public.alerts (user_id);
create index alerts_symbol_active_idx  on public.alerts (symbol, is_active);

commit;
```

**Down migration:** `data/migrations/<timestamp>_create_alerts.down.sql`
```sql
begin;
drop table if exists public.alerts;
commit;
```

**Note:** No audit tables or triggers — this project does not use the Carulla audit pattern.

**After running migration:**
```bash
pnpm --filter @radock/api data:generate
```

**Acceptance criteria:**
- [ ] `pnpm migrate up` succeeds
- [ ] `src/data/db.ts` contains an `Alerts` interface with camelCase fields
- [ ] `pnpm migrate down 1` rolls back cleanly
- [ ] `pnpm migrate up` again re-applies cleanly

---

## Task 2.2 — API: Alerts CRUD
**Commit:** `feat(api): alerts CRUD`

**Goal:** REST endpoints to create, list, and delete price alerts. All require auth.

**Module:** `src/modules/alerts/`
```
alerts/
  routes/
    alerts.schemas.ts     → Zod schemas + inferred TS types
    alerts.handlers.ts    → handler factories
    alerts.router.ts      → createAlertsRouter(alertsService): Router  prefix: /alerts
  services/
    alerts.service.ts     → AlertsService
  data/
    alerts.repository.ts  → AlertsRepository (takes AppDatabase)
  alerts.setup.ts
```

**Endpoints (all behind `authMiddleware`):**
```
POST   /alerts        → 201  CreateAlertDto body → AlertDto
GET    /alerts        → 200  AlertDto[]  (user's active alerts only)
DELETE /alerts/:id    → 204  (own alerts only)
```

**Service logic:**
- `createAlert(uid, dto)`: validate `dto.symbol` is in `TRACKED_SYMBOLS` (throw `BadRequestError` if not); insert row with `user_id = uid`; return `AlertDto`
- `listAlerts(uid)`: select where `user_id = uid AND is_active = true`, ordered by `created_at desc`
- `deleteAlert(uid, id)`: find by id; throw `NotFoundError` if missing; throw `ForbiddenError` if `user_id !== uid`; hard delete

**Acceptance criteria:**
- [ ] `POST /alerts` returns 201 with created `AlertDto`
- [ ] `GET /alerts` returns only the calling user's active alerts
- [ ] `DELETE /alerts/:id` returns 204; returns 404 for unknown id; returns 403 for another user's alert
- [ ] All endpoints return 401 without auth token
- [ ] Invalid symbol returns 400

---

## Task 2.3 — API: Finnhub WebSocket Client
**Commit:** `feat(api): finnhub websocket client`

**Goal:** Backend subscribes to all 10 symbols on Finnhub WS and emits internal price events.

**File:** `src/services/finnhub.service.ts`

```typescript
import finnhub from 'finnhub'
import EventEmitter from 'node:events'

export class FinnhubService extends EventEmitter {
  connect() {
    const socket = new finnhub.WebSocket(process.env.FINNHUB_API_KEY!)
    TRACKED_SYMBOLS.forEach(s => socket.subscribe(s))
    socket.on('message', (data) => {
      // data = { type: 'trade', data: [{ p, s, t, v }] }
      // emit 'price' for each trade entry
    })
    // reconnect on close with exponential backoff (cap 30s)
  }
}
```

**Startup:** call `finnhubService.connect()` in `src/index.ts` before the server starts.  
**Log** each price update at `debug` level.

**Acceptance criteria:**
- [ ] Server connects to Finnhub WS on startup (logged at `info`)
- [ ] `finnhubService` emits `'price'` events with `{ symbol, price, timestamp }`
- [ ] Reconnects on disconnect
- [ ] Works with sandbox token during off-market hours

---

## Task 2.4 — API: Socket.IO Price Broadcaster
**Commit:** `feat(api): socket.io price broadcast`

**Goal:** Mobile clients connect via Socket.IO, authenticate via Firebase token, receive live `price_update` events.

**File:** `src/services/socket.service.ts`

```typescript
import { Server } from 'socket.io'

export class SocketService {
  private io: Server

  attach(httpServer: http.Server) {
    this.io = new Server(httpServer, { cors: { origin: '*' } })
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Unauthorized'))
      try {
        await firebaseAdmin.auth().verifyIdToken(token)
        next()
      } catch { next(new Error('Unauthorized')) }
    })
  }

  broadcastPrice(event: PriceUpdateEvent) {
    this.io?.emit('price_update', event)
  }
}
```

**Wire up:** attach to HTTP server in `src/index.ts`; pipe `finnhubService` `'price'` events to `socketService.broadcastPrice()`.

**Acceptance criteria:**
- [ ] Socket.IO starts on the same HTTP server as Koa
- [ ] No valid Firebase token → client disconnected immediately
- [ ] Valid token → connection accepted
- [ ] `price_update` events broadcast in real time

---

## Task 2.5 — API: FCM Alert Notifications
**Commit:** `feat(api): fcm alert notifications`

**Goal:** When a price crosses a threshold, send FCM notification and deactivate the alert.

**File:** `src/services/alert-evaluator.service.ts`

```typescript
export class AlertEvaluatorService {
  constructor(private db: AppDatabase) {}

  async evaluate(symbol: string, price: number) {
    const alerts = await this.db.selectFrom('alerts')
      .where('symbol', '=', symbol)
      .where('isActive', '=', true)
      .where('targetPrice', '<=', price)
      .selectAll().execute()

    await Promise.allSettled(alerts.map(a => this.triggerAlert(a, price)))
  }

  private async triggerAlert(alert: Alert, price: number) {
    try {
      await firebaseAdmin.messaging().send({
        token: alert.fcmToken,
        notification: {
          title: `🚀 Price Alert: ${alert.symbol}`,
          body: `${alert.symbol} reached $${price.toFixed(2)} (your target: $${alert.targetPrice})`,
        },
      })
    } catch (err) { logger.error({ err, alertId: alert.id }, 'FCM send failed') }

    await this.db.updateTable('alerts')
      .set({ isActive: false, triggeredAt: new Date(), updatedAt: new Date() })
      .where('id', '=', alert.id).execute()
  }
}
```

**Wire up:** pipe `finnhubService` `'price'` events to `alertEvaluatorService.evaluate()` in `src/index.ts`.

**Acceptance criteria:**
- [ ] Alert deactivated after triggering
- [ ] FCM notification sent with correct title + body
- [ ] FCM failure logged, server does not crash
- [ ] Already-inactive alerts are not re-triggered

---

## Task 3.1 — Mobile: Stock List Screen
**Commit:** `feat(mobile): stock list screen`

**API endpoint to add in the same session:**
```
GET /quotes   → public, no auth → StockQuoteDto[]
```
Backend: `Promise.all` Finnhub `GET /quote` for all 10 symbols, map to `StockQuoteDto[]`.

**Files to create (mobile):**
- `src/stores/prices.store.ts` — `Record<StockSymbol, PriceUpdateEvent | null>`, all null initially
- `src/hooks/useSocket.ts` — connects Socket.IO, populates `prices.store` on `price_update`
- `app/(app)/index.tsx` — stock list screen
- `src/components/ui/StockCard.tsx`

**UI:**
- `rd-bg` background, header "Radock / Markets"
- `FlatList` of 10 cards: symbol + company name (left), price + % change badge (right)
- % change: green `rd-success` ▲ if ≥ 0, red `rd-danger` ▼ if < 0
- Footer: "More coming soon..." (muted, not tappable)
- Tap → `/(app)/stock/[symbol]`
- On mount: `GET /quotes` for initial prices, then Socket.IO takes over

**Acceptance criteria:**
- [ ] All 10 symbols render
- [ ] Initial prices from REST, then live via Socket.IO
- [ ] % change color + arrow correct
- [ ] Tap navigates to detail

---

## Task 3.2 — Mobile: Stock Detail + Chart
**Commit:** `feat(mobile): stock detail + chart`

**API endpoint to add in the same session:**
```
GET /candles/:symbol?resolution=D&from=<unix>&to=<unix>
→ { symbol, candles: CandleDto[] }
```
Returns `{ candles: [] }` (not error) when Finnhub returns `"no_data"`.

**Screen:** `app/(app)/stock/[symbol].tsx`

**UI:**
- Symbol + company name header, back button
- Large live price (from `prices.store`) + % change badge
- Time range pills: `1W | 1M | 3M` (default 1M)
- `VictoryLine` chart — closing prices, `rd-primary` color, `ActivityIndicator` while loading
- "Set Alert" primary button → `/(app)/alerts/new?symbol=<symbol>`

**Acceptance criteria:**
- [ ] Chart renders for selected range
- [ ] Switching range refetches + re-renders
- [ ] Live price updates in real time
- [ ] "Set Alert" passes symbol to create form

---

## Task 3.3 — Mobile: Alerts List Screen
**Commit:** `feat(mobile): alerts list screen`

**Screen:** `app/(app)/alerts/index.tsx`  
**Update:** add Alerts tab to `app/(app)/_layout.tsx`

**UI:**
- "Alerts" header + "+" top-right → `/(app)/alerts/new`
- `FlatList` of `AlertRow` cards: symbol chip + "when price ≥ $X" + trash icon
- Trash → confirm → `DELETE /alerts/:id` → remove from list
- Empty state: "No alerts yet. Tap + to create one."
- `useFocusEffect` to refetch on every focus

**Acceptance criteria:**
- [ ] List fetches on mount and focus
- [ ] Delete works
- [ ] Empty state correct
- [ ] "+" navigates to create form

---

## Task 3.4 — Mobile: Create Alert Form
**Commit:** `feat(mobile): create alert form`

**Screen:** `app/(app)/alerts/new.tsx`  
Receives optional `symbol` query param (pre-fills from stock detail).

**UI:**
- Symbol picker: horizontal scroll of 10 chips, `rd-primary` when selected
- Target price: `Input`, `decimal-pad`, placeholder "e.g. 195.00"
- "Create Alert" primary `Button`
- Inline validation errors

**Submission:**
1. Validate symbol selected + targetPrice > 0
2. `await Notifications.getDevicePushTokenAsync()` → fcmToken
3. `POST /alerts` with `{ symbol, targetPrice, fcmToken }`
4. Success → navigate back to `/(app)/alerts/`

**Acceptance criteria:**
- [ ] Symbol pre-fills from param
- [ ] Inline validation errors
- [ ] FCM token in POST body
- [ ] Success navigates back
- [ ] Button shows loading state

---

## Task 4.1 — Mobile: FCM Push Notification Registration
**Commit:** `feat(mobile): fcm push notifications`

**Install:** `expo-notifications`

**`app.json` additions:**
- `expo-notifications` in plugins
- `google-services.json` path (Android)
- `GoogleService-Info.plist` path (iOS)

**`app/_layout.tsx`:**
```typescript
await Notifications.requestPermissionsAsync()
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
})
```

**Acceptance criteria:**
- [ ] Permission prompt on first launch
- [ ] `getDevicePushTokenAsync()` returns non-null token
- [ ] Foreground notification banner visible
- [ ] Background notification in OS tray

---

## Task 4.2 — API: Railway Deployment Config
**Commit:** `chore: railway deployment config`

**Files:** `apps/api/Dockerfile`, `apps/api/.dockerignore`

**Dockerfile (multi-stage, monorepo-aware):**
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @radock/types build
RUN pnpm --filter @radock/api build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
```

**Railway steps (add to README):**
1. Connect GitHub repo → Railway
2. Add PostgreSQL service
3. Set all env vars from `.env.example`
4. `railway run pnpm migrate up`

**Acceptance criteria:**
- [ ] `docker build -t radock-api .` succeeds from monorepo root
- [ ] Container starts, `/health` returns 200
- [ ] README documents Railway steps

---

## Task 4.3 — EAS Build Config
**Commit:** `chore: eas build config`

**Verify `app.json`:**
- `expo.owner: "soycale"`
- `expo.ios.bundleIdentifier: "com.soycale.radock"`
- `expo.android.package: "com.soycale.radock"`
- `expo.plugins` includes `expo-notifications`

**Build commands:**
```bash
eas build --platform android --profile preview   # APK
eas build --platform ios --profile preview       # IPA Ad Hoc
```

**Acceptance criteria:**
- [ ] Android APK produced, bundle ID `com.soycale.radock`
- [ ] iOS IPA produced (Ad Hoc)
- [ ] README documents install steps for both platforms
