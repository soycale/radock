import { create } from 'zustand'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { PriceUpdateEvent, StockSymbol } from '@radock/types'

const MAX_TICKS = 60

interface PricesState {
  prices: Record<StockSymbol, PriceUpdateEvent | null>
  tickBuffer: Record<StockSymbol, number[]>
  setPrice: (event: PriceUpdateEvent) => void   // Socket.IO ticks — updates prices + tickBuffer
  seedPrice: (event: PriceUpdateEvent) => void  // REST seed — updates prices only, not tickBuffer
}

const initialPrices = Object.fromEntries(
  TRACKED_SYMBOLS.map((s) => [s, null]),
) as Record<StockSymbol, PriceUpdateEvent | null>

const initialTickBuffer = Object.fromEntries(
  TRACKED_SYMBOLS.map((s) => [s, []]),
) as Record<StockSymbol, number[]>

export const usePricesStore = create<PricesState>((set) => ({
  prices: initialPrices,
  tickBuffer: initialTickBuffer,
  setPrice: (event) =>
    set((state) => {
      const current = state.tickBuffer[event.symbol] ?? []
      return {
        prices: { ...state.prices, [event.symbol]: event },
        tickBuffer: {
          ...state.tickBuffer,
          [event.symbol]: [...current, event.price].slice(-MAX_TICKS),
        },
      }
    }),
  seedPrice: (event) =>
    set((state) => ({
      prices: { ...state.prices, [event.symbol]: event },
    })),
}))
