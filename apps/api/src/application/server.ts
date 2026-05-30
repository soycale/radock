import Koa from 'koa'
import { koaBody } from 'koa-body'
import cors from '@koa/cors'
import { errorMiddleware } from '#middleware/error.middleware.js'

export function createServer() {
  const app = new Koa()

  app.use(errorMiddleware)
  app.use(cors())
  app.use(koaBody())

  return app
}
