import { type Context, type Next } from 'koa'
import { firebaseAdmin } from '#application/firebase.js'
import { UnauthorizedError } from '#shared/errors.js'

export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing authorization token')
  }

  const token = authHeader.slice(7)
  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token)
    ctx.state.user = { uid: decoded.uid, email: decoded.email }
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }

  await next()
}
