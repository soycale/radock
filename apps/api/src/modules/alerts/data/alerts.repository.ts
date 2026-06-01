import type { AppDatabase } from '#application/database.js'
import type { CreateAlertInput } from '#modules/alerts/routes/alerts.schemas.js'

export class AlertsRepository {
  constructor(private db: AppDatabase) {}

  async create(userId: string, input: CreateAlertInput) {
    return this.db
      .insertInto('alerts')
      .values({
        userId,
        symbol: input.symbol,
        targetPrice: input.targetPrice,
        fcmToken: input.fcmToken,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findByUser(userId: string, isActive: boolean) {
    return this.db
      .selectFrom('alerts')
      .selectAll()
      .where('userId', '=', userId)
      .where('isActive', '=', isActive)
      .orderBy(isActive ? 'createdAt' : 'triggeredAt', 'desc')
      .limit(isActive ? 100 : 10)
      .execute()
  }

  async findById(id: string) {
    return this.db
      .selectFrom('alerts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async deleteById(id: string) {
    return this.db
      .deleteFrom('alerts')
      .where('id', '=', id)
      .execute()
  }
}
