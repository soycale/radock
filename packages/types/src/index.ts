export const TRACKED_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'NFLX',
  'UBER',
  'SPOT',
] as const

export type StockSymbol = (typeof TRACKED_SYMBOLS)[number]

export const SYMBOL_NAMES: Record<StockSymbol, string> = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  GOOGL: 'Alphabet',
  AMZN: 'Amazon',
  TSLA: 'Tesla',
  META: 'Meta',
  NVDA: 'NVIDIA',
  NFLX: 'Netflix',
  UBER: 'Uber',
  SPOT: 'Spotify',
}

export interface ApiResponse<T> {
  data: T
  success: boolean
}

export interface ApiError {
  error: string
  statusCode: number
}

export interface StockQuoteDto {
  symbol: StockSymbol
  price: number
  open: number
  high: number
  low: number
  prevClose: number
  change: number
  changePercent: number
}

export interface CandleDto {
  time: number
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
  triggeredAt: string | null
}

export interface CreateAlertDto {
  symbol: StockSymbol
  targetPrice: number
  fcmToken: string
}
