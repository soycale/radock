import Router from '@koa/router'
import { authMiddleware } from '#middleware/auth.middleware.js'
import { createHandlers } from '#modules/alerts/routes/alerts.handlers.js'
import type { AlertsService } from '#modules/alerts/services/alerts.service.js'

export function createAlertsRouter(service: AlertsService) {
  const router = new Router({ prefix: '/alerts' })
  const handlers = createHandlers(service)

  router.use(authMiddleware)
  router.post('/', handlers.create)
  router.get('/', handlers.list)
  router.delete('/:id', handlers.remove)

  return router
}
