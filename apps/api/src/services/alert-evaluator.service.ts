import pino from 'pino'
import { firebaseAdmin } from '#application/firebase.js'
import type { AppDatabase } from '#application/database.js'
import type { StockSymbol } from '@radock/types'

const logger = pino({ transport: { target: 'pino-pretty' } })

interface CachedAlert {
  id: string
  userId: string
  symbol: string
  targetPrice: number
  fcmToken: string
}

export class AlertEvaluatorService {
  // In-memory cache: symbol → alerts targeting that symbol
  private cache = new Map<string, CachedAlert[]>()

  constructor(private db: AppDatabase) {}

  async loadCache() {
    const alerts = await this.db
      .selectFrom('alerts')
      .select(['id', 'userId', 'symbol', 'targetPrice', 'fcmToken'])
      .where('isActive', '=', true)
      .execute()

    this.cache.clear()
    for (const alert of alerts) {
      this.addToCache({
        id: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        targetPrice: Number(alert.targetPrice),
        fcmToken: alert.fcmToken,
      })
    }

    logger.info({ count: alerts.length }, 'Alert cache loaded')
  }

  addToCache(alert: CachedAlert) {
    const bucket = this.cache.get(alert.symbol) ?? []
    bucket.push(alert)
    this.cache.set(alert.symbol, bucket)
  }

  removeFromCache(id: string) {
    for (const [symbol, alerts] of this.cache) {
      const filtered = alerts.filter((a) => a.id !== id)
      if (filtered.length !== alerts.length) {
        this.cache.set(symbol, filtered)
        return
      }
    }
  }

  async evaluate(symbol: StockSymbol, price: number) {
    const bucket = this.cache.get(symbol)
    if (!bucket?.length) return

    const triggered = bucket.filter((a) => price >= a.targetPrice)
    if (!triggered.length) return

    // Remove from cache immediately to prevent double-firing
    const triggeredIds = new Set(triggered.map((a) => a.id))
    this.cache.set(
      symbol,
      bucket.filter((a) => !triggeredIds.has(a.id)),
    )

    // Send FCM notifications concurrently — failures are logged, not thrown
    await Promise.allSettled(triggered.map((alert) => this.sendNotification(alert, price)))

    // Single bulk DB update instead of N individual queries
    await this.db
      .updateTable('alerts')
      .set({ isActive: false, triggeredAt: new Date(), updatedAt: new Date() })
      .where('id', 'in', Array.from(triggeredIds))
      .execute()
  }

  private async sendNotification(alert: CachedAlert, price: number) {
    try {
      await firebaseAdmin.messaging().send({
        token: alert.fcmToken,
        notification: {
          title: `Price Alert: ${alert.symbol}`,
          body: `${alert.symbol} reached $${price.toFixed(2)} (your target: $${alert.targetPrice.toFixed(2)})`,
        },
      })
      logger.info({ alertId: alert.id, symbol: alert.symbol, price }, 'FCM notification sent')
    } catch (err) {
      logger.error({ err, alertId: alert.id }, 'FCM send failed')
    }
  }
}
