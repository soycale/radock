import type { AppDatabase } from '#application/database.js'
import { AlertsRepository } from '#modules/alerts/data/alerts.repository.js'
import { AlertsService } from '#modules/alerts/services/alerts.service.js'
import { createAlertsRouter } from '#modules/alerts/routes/alerts.router.js'
import { AlertEvaluatorService } from '#services/alert-evaluator.service.js'

export function setupAlerts(db: AppDatabase) {
  const repository = new AlertsRepository(db)
  const evaluator = new AlertEvaluatorService(db)
  const service = new AlertsService(repository, evaluator)
  const router = createAlertsRouter(service)
  return { router, service, evaluator }
}
