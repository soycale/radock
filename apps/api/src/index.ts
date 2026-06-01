import { createServer } from '#application/server.js'
import { configuration } from '#application/configuration.js'
import { db } from '#application/database.js'
import { healthRouter } from '#modules/health/health.router.js'
import { setupAlerts } from '#modules/alerts/alerts.setup.js'
import { finnhubService } from '#services/finnhub.service.js'
import pino from 'pino'

const logger = pino({ transport: { target: 'pino-pretty' } })

const app = createServer()

const { router: alertsRouter } = setupAlerts(db)

app.use(healthRouter.routes())
app.use(healthRouter.allowedMethods())
app.use(alertsRouter.routes())
app.use(alertsRouter.allowedMethods())

finnhubService.connect()

app.listen(configuration.port, () => {
  logger.info(`Server running on port ${configuration.port}`)
})
