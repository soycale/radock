import Router from '@koa/router'
import type { Context } from 'koa'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { StockQuoteDto, StockSymbol } from '@radock/types'
import { configuration } from '#application/configuration.js'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

async function fetchQuote(symbol: StockSymbol, apiKey: string): Promise<StockQuoteDto | null> {
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${apiKey}`)
    if (!res.ok) return null
    const data = (await res.json()) as { c: number; h: number; l: number; o: number; pc: number }
    if (!data.c) return null
    const change = data.c - data.pc
    return {
      symbol,
      price: data.c,
      open: data.o,
      high: data.h,
      low: data.l,
      prevClose: data.pc,
      change,
      changePercent: data.pc !== 0 ? (change / data.pc) * 100 : 0,
    }
  } catch {
    return null
  }
}

export const quotesRouter = new Router()

quotesRouter.get('/quotes', async (ctx: Context) => {
  const results = await Promise.all(
    TRACKED_SYMBOLS.map((symbol) => fetchQuote(symbol, configuration.finnhub.apiKey)),
  )
  const quotes = results.filter((q): q is StockQuoteDto => q !== null)
  ctx.body = { data: quotes, success: true }
})
