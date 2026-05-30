import { type Context, type Next } from 'koa'
import { HttpError } from '#shared/errors.js'

export async function errorMiddleware(ctx: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    if (err instanceof HttpError) {
      ctx.status = err.statusCode
      ctx.body = { error: err.message, statusCode: err.statusCode }
    } else {
      ctx.status = 500
      ctx.body = { error: 'Internal Server Error', statusCode: 500 }
    }
  }
}
