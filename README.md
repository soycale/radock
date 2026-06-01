# Radock — Real-time Stock Tracker

Radock is a full-stack mobile application for monitoring real-time stock prices and setting price alerts. Built with a React Native (Expo) frontend and a Node.js backend, it uses WebSockets for live price streaming and Firebase Cloud Messaging for push notifications.

## What it does

- **Live stock prices** — 10 major tech/consumer stocks update in real time via WebSocket
- **Price alerts** — set a target price; receive a push notification the moment a stock crosses it
- **Historical charts** — view 1W, 1M, or 3M price history for any stock with gradient fill and glow
- **Live chart mode** — real-time price tick visualization during US market hours
- **Alerts history** — view the last 10 triggered alerts with fired timestamps
- **Auto session management** — expired Firebase tokens are refreshed automatically; failed refresh logs out
- **Cross-platform** — iOS (TestFlight) and Android (direct APK install)

## Architecture

```
┌─────────────────────┐   Socket.IO (live prices)   ┌─────────────────────────┐
│   React Native      │◄──────────────────────────► │   Koa API               │
│   (Expo)            │                              │   + Socket.IO server    │
│                     │   REST (alerts CRUD)         │                         │
│                     │◄──────────────────────────► │   ┌─────────────────┐   │
└─────────────────────┘                              │   │  Finnhub WS     │   │
                                                     │   │  Client         │   │
        FCM Push                                     │   └─────────────────┘   │
        Notification                                 │   ┌─────────────────┐   │
             │          Firebase Admin SDK           │   │  PostgreSQL 16  │   │
             └────────────────────────────────────►  │   │  (alerts)       │   │
                                                     │   └─────────────────┘   │
                                                     └─────────────────────────┘
```

**Real-time price flow:** Finnhub WebSocket → Node backend → Socket.IO → React Native  
**Alert notification flow:** Price tick → alert evaluator → Firebase Admin SDK → FCM → device push

## Tech Stack

### Backend (`apps/api`)

| Package | Purpose |
|---------|---------|
| **Koa 3** | HTTP server framework — lightweight, async-first, middleware-based |
| **Kysely** | Type-safe SQL query builder; `kysely-codegen` auto-generates TypeScript types from the live DB schema — no ORM magic, no runtime type guessing |
| **socket.io** | WebSocket server for real-time price broadcasting to mobile clients |
| **finnhub** | Official Finnhub JS SDK — single WebSocket subscription + REST quote/candle endpoints |
| **firebase-admin** | Dual role: verify Firebase ID tokens for authentication, and send FCM push notifications |
| **zod** | Runtime request body validation with TypeScript inference |
| **pino** | Structured JSON logging — low overhead, production-ready |
| **PostgreSQL 16** | Stores user price alerts |
| **golang-migrate** | SQL migration runner — explicit up/down files, deterministic |

### Mobile (`apps/mobile`)

| Package | Purpose |
|---------|---------|
| **Expo SDK 55** | Managed workflow — EAS Build handles native compilation and signing without ejecting to bare RN |
| **Expo Router** | File-based navigation (same mental model as Next.js); supports tabs + stack without manual navigator config |
| **NativeWind v4** | Tailwind CSS utility classes in React Native — consistent design system via `rd-*` color tokens |
| **Zustand** | Minimal global state for auth and live prices; `expo-secure-store` for encrypted token persistence |
| **Firebase JS SDK** | Email/password authentication via Firebase Auth |
| **socket.io-client** | Connects to backend WebSocket, receives `price_update` events in real time |
| **react-native-svg** | Custom SVG line chart — gradient area fill, glow layers, end-of-line dot, live tick mode |
| **expo-notifications** | Unified push notification handler — FCM on Android, APNs on iOS |

### Monorepo Tooling

| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Shared dependencies, efficient deduplication across `apps/` and `packages/` |
| **Turborepo** | Parallel task execution (`dev`, `build`, `test`) with build caching |
| **`packages/types`** | Single source of truth for shared TypeScript types (DTOs, event shapes, symbol constants) |

## Tracked Stocks (v1)

| Symbol | Company |
|--------|---------|
| AAPL | Apple |
| MSFT | Microsoft |
| GOOGL | Alphabet |
| AMZN | Amazon |
| TSLA | Tesla |
| META | Meta |
| NVDA | NVIDIA |
| NFLX | Netflix |
| UBER | Uber |
| SPOT | Spotify |

More coming soon in a future release.

## Project Structure

```
radock/
├── apps/
│   ├── api/        → Node.js backend (Koa + Socket.IO)
│   └── mobile/     → React Native app (Expo)
├── packages/
│   └── types/      → Shared TypeScript types and constants
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ — `npm install -g pnpm`
- **Docker** — for local PostgreSQL
- **golang-migrate** — `brew install golang-migrate`
- **EAS CLI** — `npm install -g eas-cli`
- **Finnhub API key** — free at [finnhub.io](https://finnhub.io)
- **Firebase project** — Auth (email/password enabled) + service account key + FCM configured

## Running Locally

### 1. Clone and install

```bash
git clone https://github.com/soycale/radock
cd radock
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — fill in FINNHUB_API_KEY and FIREBASE_* credentials
```

```bash
cp apps/mobile/.env.local.example apps/mobile/.env.local
# Edit apps/mobile/.env.local — fill in EXPO_PUBLIC_FIREBASE_* and EXPO_PUBLIC_API_URL
```

### 3. Start the database and run migrations

```bash
cd apps/api
docker compose up -d
pnpm migrate up
```

### 4. Start the API

```bash
pnpm --filter @radock/api dev
# Running on http://localhost:3000
# GET http://localhost:3000/health → { status: 'ok' }
```

### 5. Start the mobile app

```bash
pnpm --filter @radock/mobile dev
# Scan the QR code with your development build
# For device testing, replace EXPO_PUBLIC_API_URL with your ngrok URL
```

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Email/Password** sign-in method
3. Generate a **service account key** (Project Settings → Service accounts → Generate new private key)
4. Copy `projectId`, `clientEmail`, `privateKey` into `apps/api/.env`
5. Copy the **web app config** (`apiKey`, `authDomain`, `projectId`, `appId`) into `apps/mobile/.env.local`
6. For Android FCM: download `google-services.json` → place in `apps/mobile/`
7. For iOS APNs: upload your APNs key in Firebase Console → Cloud Messaging settings

## Building for Devices

### Android APK

```bash
eas build --platform android --profile preview
# Download the .apk from the EAS dashboard and install directly on the device
```

### iOS Ad Hoc

```bash
# Register device UDIDs in your Apple Developer account first
eas device:create

eas build --platform ios --profile preview
# Download the .ipa — install via Apple Configurator 2 or TestFlight internal testing
```

## Deploying the API

The API is deployed to [Railway](https://railway.app).

### Steps

1. Push the repo to GitHub
2. In Railway: **New Project → Deploy from GitHub repo** → select `radock`
3. Add a **PostgreSQL** service from the Railway dashboard
4. Set environment variables (from `apps/api/.env.example`) in the Railway service settings
5. Railway auto-detects the `Dockerfile` and builds on every push
6. Run migrations after first deploy:
   ```bash
   railway run pnpm migrate up
   ```
7. Update `EXPO_PUBLIC_API_URL` in mobile `.env.local` to the Railway-provided URL

### Required environment variables (Railway)

| Variable | Where to get it |
|----------|----------------|
| `PORT` | Set to `3000` |
| `DATABASE_URL` | Railway PostgreSQL service → Connect tab |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project settings |
| `FIREBASE_CLIENT_EMAIL` | From the service account JSON |
| `FIREBASE_PRIVATE_KEY` | From the service account JSON (include full key with `\n`) |
| `FINNHUB_API_KEY` | finnhub.io → API Keys |

## Available API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Server health + uptime |
| GET | `/quotes` | Public | Live quotes for all 10 symbols |
| GET | `/candles/:symbol` | Public | Historical OHLCV (query: `resolution`, `from`, `to`) |
| POST | `/alerts` | Bearer token | Create a price alert |
| GET | `/alerts` | Bearer token | List active alerts. Add `?active=false` for triggered history (last 10) |
| DELETE | `/alerts/:id` | Bearer token | Delete an alert |

## Development Notes

- **Market hours**: Finnhub free tier sends real data only during US market hours (9:30–16:00 ET). Use a sandbox API key (`sandbox_<key>`) in `apps/api/.env` for off-hours development.
- **Socket.IO auth**: the mobile client passes its Firebase ID token as `auth.token` on connection. The backend verifies it — unauthenticated connections are dropped immediately.
- **Alerts are one-shot**: once a price alert fires, it is deactivated automatically. Users can create a new one to monitor again.
