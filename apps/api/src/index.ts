import { createServer } from '#application/server.js'
import { configuration } from '#application/configuration.js'
import { db } from '#application/database.js'
import { healthRouter } from '#modules/health/health.router.js'
import { quotesRouter } from '#modules/quotes/quotes.router.js'
import { candlesRouter } from '#modules/quotes/candles.router.js'
import { setupAlerts } from '#modules/alerts/alerts.setup.js'
import { finnhubService } from '#services/finnhub.service.js'
import { socketService } from '#services/socket.service.js'
import pino from 'pino'

const logger = pino({ transport: { target: 'pino-pretty' } })

const app = createServer()

const alertsSetup = setupAlerts(db)
const { router: alertsRouter } = alertsSetup

app.use(healthRouter.routes())
app.use(healthRouter.allowedMethods())
app.use(quotesRouter.routes())
app.use(quotesRouter.allowedMethods())
app.use(candlesRouter.routes())
app.use(candlesRouter.allowedMethods())
app.use(alertsRouter.routes())
app.use(alertsRouter.allowedMethods())

await alertsSetup.evaluator.loadCache()

finnhubService.connect()
finnhubService.on('price', (event) => {
  socketService.broadcastPrice(event)
  alertsSetup.evaluator.evaluate(event.symbol, event.price)
})

const httpServer = app.listen(configuration.port, () => {
  logger.info(`Server running on port ${configuration.port}`)
})

socketService.attach(httpServer)
