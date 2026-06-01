import { EventEmitter } from 'node:events'
import WebSocket from 'ws'
import pino from 'pino'
import { TRACKED_SYMBOLS } from '@radock/types'
import type { PriceUpdateEvent, StockSymbol } from '@radock/types'
import { configuration } from '#application/configuration.js'

const logger = pino({ transport: { target: 'pino-pretty' } })

const FINNHUB_WS_URL = 'wss://ws.finnhub.io'
const MAX_BACKOFF_MS = 30_000

export class FinnhubService extends EventEmitter {
  private ws: WebSocket | null = null
  private backoffMs = 1_000
  private stopped = false

  connect() {
    this.stopped = false
    this.openSocket()
  }

  stop() {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }

  private openSocket() {
    const url = `${FINNHUB_WS_URL}?token=${configuration.finnhub.apiKey}`
    const ws = new WebSocket(url)
    this.ws = ws

    ws.on('open', () => {
      logger.info('Finnhub WebSocket connected')
      this.backoffMs = 1_000
      for (const symbol of TRACKED_SYMBOLS) {
        ws.send(JSON.stringify({ type: 'subscribe', symbol }))
      }
    })

    ws.on('message', (raw: Buffer) => {
      let payload: { type: string; data?: Array<{ p: number; s: string; t: number; v: number }> }
      try {
        payload = JSON.parse(raw.toString())
      } catch {
        return
      }

      if (payload.type !== 'trade' || !payload.data) return

      for (const trade of payload.data) {
        const event: PriceUpdateEvent = {
          symbol: trade.s as StockSymbol,
          price: trade.p,
          timestamp: trade.t,
        }
        logger.debug({ event }, 'price update')
        this.emit('price', event)
      }
    })

    ws.on('close', () => {
      if (this.stopped) return
      logger.warn(`Finnhub WebSocket closed — reconnecting in ${this.backoffMs}ms`)
      setTimeout(() => {
        this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS)
        this.openSocket()
      }, this.backoffMs)
    })

    ws.on('error', (err) => {
      logger.error({ err }, 'Finnhub WebSocket error')
    })
  }
}

export const finnhubService = new FinnhubService()
