import type { AlertDto } from '@radock/types'
import { ForbiddenError, NotFoundError } from '#shared/errors.js'
import type { AlertsRepository } from '#modules/alerts/data/alerts.repository.js'
import type { CreateAlertInput } from '#modules/alerts/routes/alerts.schemas.js'
import type { AlertEvaluatorService } from '#services/alert-evaluator.service.js'

export class AlertsService {
  constructor(
    private repository: AlertsRepository,
    private evaluator: AlertEvaluatorService,
  ) {}

  async createAlert(userId: string, input: CreateAlertInput): Promise<AlertDto> {
    const alert = await this.repository.create(userId, input)
    this.evaluator.addToCache({
      id: alert.id,
      userId: alert.userId,
      symbol: alert.symbol,
      targetPrice: Number(alert.targetPrice),
      fcmToken: alert.fcmToken,
    })
    return this.toDto(alert)
  }

  async listAlerts(userId: string): Promise<AlertDto[]> {
    const alerts = await this.repository.findActiveByUser(userId)
    return alerts.map(this.toDto)
  }

  async deleteAlert(userId: string, id: string): Promise<void> {
    const alert = await this.repository.findById(id)
    if (!alert) throw new NotFoundError('Alert not found')
    if (alert.userId !== userId) throw new ForbiddenError('Cannot delete another user\'s alert')
    await this.repository.deleteById(id)
    this.evaluator.removeFromCache(id)
  }

  private toDto(alert: {
    id: string
    symbol: string
    targetPrice: string
    isActive: boolean
    createdAt: Date
  }): AlertDto {
    return {
      id: alert.id,
      symbol: alert.symbol as AlertDto['symbol'],
      targetPrice: Number(alert.targetPrice),
      isActive: alert.isActive,
      createdAt: alert.createdAt.toISOString(),
    }
  }
}
