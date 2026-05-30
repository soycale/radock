import { createServer } from '#application/server.js'
import { configuration } from '#application/configuration.js'
import { healthRouter } from '#modules/health/health.router.js'
import pino from 'pino'

const logger = pino({ transport: { target: 'pino-pretty' } })

const app = createServer()

app.use(healthRouter.routes())
app.use(healthRouter.allowedMethods())

app.listen(configuration.port, () => {
  logger.info(`Server running on port ${configuration.port}`)
})
