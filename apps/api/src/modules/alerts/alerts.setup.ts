import type { AppDatabase } from '#application/database.js'
import { AlertsRepository } from '#modules/alerts/data/alerts.repository.js'
import { AlertsService } from '#modules/alerts/services/alerts.service.js'
import { createAlertsRouter } from '#modules/alerts/routes/alerts.router.js'

export function setupAlerts(db: AppDatabase) {
  const repository = new AlertsRepository(db)
  const service = new AlertsService(repository)
  const router = createAlertsRouter(service)
  return { router, service }
}
