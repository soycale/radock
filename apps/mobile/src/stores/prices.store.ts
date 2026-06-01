import { create } from 'zustand'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { PriceUpdateEvent, StockSymbol } from '@radock/types'

interface PricesState {
  prices: Record<StockSymbol, PriceUpdateEvent | null>
  setPrice: (event: PriceUpdateEvent) => void
}

const initialPrices = Object.fromEntries(
  TRACKED_SYMBOLS.map((s) => [s, null]),
) as Record<StockSymbol, PriceUpdateEvent | null>

export const usePricesStore = create<PricesState>((set) => ({
  prices: initialPrices,
  setPrice: (event) =>
    set((state) => ({
      prices: { ...state.prices, [event.symbol]: event },
    })),
}))
