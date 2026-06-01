import Router from '@koa/router'
import type { Context } from 'koa'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { CandleDto, StockSymbol } from '@radock/types'
import { configuration } from '#application/configuration.js'
import { BadRequestError } from '#shared/errors.js'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart'

interface FinnhubCandles {
  c: number[]
  h: number[]
  l: number[]
  o: number[]
  t: number[]
  v: number[]
  s: 'ok' | 'no_data'
}

interface YahooChart {
  chart: {
    result: Array<{
      timestamp: number[]
      indicators: {
        quote: Array<{
          open: number[]
          high: number[]
          low: number[]
          close: number[]
          volume: number[]
        }>
      }
    }> | null
    error: { code: string; description: string } | null
  }
}

async function fetchFromFinnhub(
  symbol: string,
  resolution: string,
  from: string,
  to: string,
): Promise<CandleDto[] | null> {
  const url = `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${configuration.finnhub.apiKey}`
  const res = await fetch(url)
  const raw = (await res.json()) as FinnhubCandles | { error: string }

  if (!res.ok || 'error' in raw || raw.s === 'no_data') return null

  return raw.t.map((time, i) => ({
    time,
    open: (raw as FinnhubCandles).o[i],
    high: (raw as FinnhubCandles).h[i],
    low: (raw as FinnhubCandles).l[i],
    close: (raw as FinnhubCandles).c[i],
    volume: (raw as FinnhubCandles).v[i],
  }))
}

async function fetchFromYahoo(symbol: string, from: string, to: string): Promise<CandleDto[] | null> {
  const url = `${YAHOO_BASE}/${symbol}?interval=1d&period1=${from}&period2=${to}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) return null

  const data = (await res.json()) as YahooChart
  const result = data.chart.result?.[0]
  if (!result) return null

  const { timestamp, indicators } = result
  const quote = indicators.quote[0]

  return timestamp
    .map((time, i) => ({
      time,
      open: quote.open[i],
      high: quote.high[i],
      low: quote.low[i],
      close: quote.close[i],
      volume: quote.volume[i],
    }))
    .filter((c) => c.close != null) // Yahoo sometimes includes null entries
}

export const candlesRouter = new Router()

candlesRouter.get('/candles/:symbol', async (ctx: Context) => {
  const { symbol } = ctx.params
  const { resolution = 'D', from, to } = ctx.query as Record<string, string>

  if (!TRACKED_SYMBOLS.includes(symbol as StockSymbol)) {
    throw new BadRequestError(`Unknown symbol: ${symbol}`)
  }

  if (!from || !to) {
    throw new BadRequestError('from and to query params are required')
  }

  // Try Finnhub first (paid), fall back to Yahoo Finance (free)
  const candles =
    (await fetchFromFinnhub(symbol, resolution, from, to)) ??
    (await fetchFromYahoo(symbol, from, to)) ??
    []

  ctx.body = { data: { symbol, candles }, success: true }
})
