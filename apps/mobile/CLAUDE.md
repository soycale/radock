# Radock — Mobile

Expo mobile app. See root `CLAUDE.md` for full task specs and project overview.

## Stack
- **Framework**: Expo SDK 55
- **Routing**: Expo Router 55.x (file-based, screens live in `app/` directory)
- **Styling**: NativeWind v4 + Tailwind v3 — `rd-*` color tokens
- **State**: Zustand + `expo-secure-store` persistence
- **Auth**: Firebase JS SDK (`firebase/auth`) — email/password
- **Real-time**: `socket.io-client` — receives `price_update` events from backend
- **Charts**: `victory-native` + `react-native-svg` (bundled in Expo)
- **Notifications**: `expo-notifications` — FCM (Android) + APNs (iOS)
- **API client**: `src/api/client.ts` — thin fetch wrapper
- **Icons**: `@expo/vector-icons` Ionicons (bundled with Expo)
- **Env vars**: `apps/mobile/.env.local`

## EAS Build
- **Owner**: soycale
- **Bundle ID**: com.soycale.radock
- **Android package**: com.soycale.radock

### Build commands
```bash
# iOS Ad Hoc (requires Apple Developer account + registered device UDIDs)
eas build --platform ios --profile preview

# Android APK (direct install, no Play Store)
eas build --platform android --profile preview

# Development build (dev client, hot reload on real device)
eas build --platform ios --profile development
```

## Daily Development Workflow
```bash
pnpm --filter @radock/mobile dev            # start Metro
pnpm --filter @radock/mobile dev --clear    # clear Metro cache (after config changes)

# For device testing, update .env.local with ngrok URL:
EXPO_PUBLIC_API_URL=https://<id>.ngrok-free.app
```

## App Structure
```
app/
  _layout.tsx              → Root layout: auth guard, permission request, font loading
  index.tsx                → Blank redirect (guard takes over immediately)
  (auth)/
    _layout.tsx            → Headerless Stack for auth screens
    login.tsx              → Firebase email/password login
  (app)/
    _layout.tsx            → Tab navigator + Socket.IO connection
    index.tsx              → Stock list screen (Markets tab)
    stock/
      [symbol].tsx         → Stock detail + line chart
    alerts/
      index.tsx            → Alerts list (Alerts tab)
      new.tsx              → Create alert form
src/
  api/
    client.ts              → Fetch wrapper: api.get/post/delete, setAuthToken
  stores/
    auth.store.ts          → user, token, isHydrated, login, logout
    prices.store.ts        → Record<StockSymbol, PriceUpdateEvent | null>
  hooks/
    useAuth.ts             → selector hook over auth.store
    useSocket.ts           → Socket.IO connection, feeds prices.store
  lib/
    firebase.ts            → Firebase JS SDK init (reads EXPO_PUBLIC_FIREBASE_* vars)
  components/
    ui/
      Button.tsx           → primary/secondary variants, loading state
      Input.tsx            → labelled input, error display
      StockCard.tsx        → stock symbol card for the list screen
      AlertRow.tsx         → single alert row for the alerts list
assets/
  icon.png                 → 1024×1024
  splash.png               → 1284×2778
```

## Design Style
The app follows a **TikTok-inspired design language**:
- Pure black backgrounds, high contrast white text
- Bold, chunky typography with strong visual hierarchy
- Vibrant dual-accent system: hot pink (`#FE2C55`) + cyan (`#25F4EE`)
- Minimal borders, generous spacing, full-screen layouts
- Bottom tab navigation, cards with subtle depth
- No gradients on backgrounds — flat, clean surfaces

Apply this style to every new screen and component. When in doubt, look at TikTok's UI for reference.

## Color Tokens
Defined in `tailwind.config.js` under `theme.extend.colors.rd`:

```javascript
rd: {
  bg:        '#000000',  // pure black — app background
  surface:   '#161616',  // very dark gray — cards, inputs, sheets
  border:    '#2A2A2A',  // subtle dark border
  primary:   '#FE2C55',  // TikTok pink/red — primary actions, active states
  secondary: '#25F4EE',  // TikTok cyan — highlights, success states
  success:   '#25F4EE',  // cyan — price up, positive % change
  danger:    '#FE2C55',  // pink/red — price down, negative change, errors
  text:      '#FFFFFF',  // pure white — primary text
  muted:     '#8A8A8A',  // gray — secondary text, placeholders, hints
}
```

Usage in components: `className="bg-rd-bg text-rd-text"` etc.

## Navigation Structure

### Tabs
| Tab | Icon | Screen |
|-----|------|--------|
| Markets | `trending-up` | `(app)/index.tsx` |
| Alerts | `notifications` | `(app)/alerts/index.tsx` |

### Stack screens (pushed on top of tabs)
- `(app)/stock/[symbol]` — navigated from stock list card tap
- `(app)/alerts/new` — navigated from alerts list "+" or stock detail "Set Alert"

### Auth guard (`app/_layout.tsx`)
- While `!isHydrated` → show `<ActivityIndicator />` (full screen, `rd-bg`)
- If `!token` → `router.replace('/(auth)/login')`
- If `token` → `router.replace('/(app)')`

## Auth Store Shape
```typescript
interface AuthUser { uid: string; email: string }
interface AuthState {
  user: AuthUser | null
  token: string | null       // Firebase ID token (for API calls + Socket.IO auth)
  isHydrated: boolean        // true once SecureStore has been read
  login(email: string, password: string): Promise<void>
  logout(): void
}
```

## Prices Store Shape
```typescript
interface PricesState {
  prices: Record<StockSymbol, PriceUpdateEvent | null>
  setPrice(event: PriceUpdateEvent): void
}
```
Initialised with `null` for every symbol. Populated by `useSocket` hook + initial REST fetch.

## useSocket Hook
```typescript
// src/hooks/useSocket.ts
// Called once from app/(app)/_layout.tsx
// - Connects to EXPO_PUBLIC_API_URL with auth: { token }
// - Listens to 'price_update' → calls pricesStore.setPrice(event)
// - Reconnects automatically (socket.io-client handles this)
// - Disconnects on explicit logout
```

## API Client (`src/api/client.ts`)
```typescript
setAuthToken(token: string | null): void    // called after login/logout
api.get<T>(path: string): Promise<T>
api.post<T>(path: string, body: unknown): Promise<T>
api.delete<T>(path: string): Promise<T>
```
- Base URL from `process.env.EXPO_PUBLIC_API_URL`
- Attaches `Authorization: Bearer <token>` when token is set
- Throws typed error on non-2xx response

## Component Contracts

### `Button.tsx`
```typescript
interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'  // default: primary
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}
```
- Primary: `bg-rd-primary` background, white text
- Secondary: transparent background, `border-rd-border` border, `text-rd-text`
- Loading: shows `ActivityIndicator`, `disabled` set to true

### `Input.tsx`
```typescript
interface InputProps {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
}
```
- `bg-rd-surface` background, `border-rd-border` border, `text-rd-text` text
- Error string displayed in `text-rd-danger` below the input

### `StockCard.tsx`
```typescript
interface StockCardProps {
  symbol: StockSymbol
  companyName: string
  price: number | null       // null = not yet loaded
  changePercent: number | null
  onPress: () => void
}
```

### `AlertRow.tsx`
```typescript
interface AlertRowProps {
  alert: AlertDto
  onDelete: (id: string) => void
}
```

## Environment Variables
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your-web-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
```

## Important: Native Rebuild Required When Adding
Any new native module (config plugin in `app.json`) requires an EAS build or `expo prebuild`.
The following are already included and do NOT require a rebuild if added in Task 1.4:
- `expo-notifications`
- `expo-secure-store`
- `react-native-svg` (via victory-native)

## Finnhub Sandbox Token
Finnhub free tier only sends real data during US market hours (9:30–16:00 ET).
Outside hours, use a sandbox API key (`sandbox_<your_key>`) in `apps/api/.env` to receive simulated data.
