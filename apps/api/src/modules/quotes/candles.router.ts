import Router from '@koa/router'
import type { Context } from 'koa'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { CandleDto, StockSymbol } from '@radock/types'
import { configuration } from '#application/configuration.js'
import { BadRequestError } from '#shared/errors.js'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

interface FinnhubCandles {
  c: number[]
  h: number[]
  l: number[]
  o: number[]
  t: number[]
  v: number[]
  s: 'ok' | 'no_data'
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

  const url = `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${configuration.finnhub.apiKey}`
  const res = await fetch(url)
  const data = (await res.json()) as FinnhubCandles

  if (data.s === 'no_data') {
    ctx.body = { data: { symbol, candles: [] }, success: true }
    return
  }

  const candles: CandleDto[] = data.t.map((time, i) => ({
    time,
    open: data.o[i],
    high: data.h[i],
    low: data.l[i],
    close: data.c[i],
    volume: data.v[i],
  }))

  ctx.body = { data: { symbol, candles }, success: true }
})
