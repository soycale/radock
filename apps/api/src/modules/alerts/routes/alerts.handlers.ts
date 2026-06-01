import type { Context } from 'koa'
import { BadRequestError } from '#shared/errors.js'
import { createAlertSchema } from '#modules/alerts/routes/alerts.schemas.js'
import type { AlertsService } from '#modules/alerts/services/alerts.service.js'

export function createHandlers(service: AlertsService) {
  return {
    async create(ctx: Context) {
      const parsed = createAlertSchema.safeParse(ctx.request.body)
      if (!parsed.success) throw new BadRequestError(parsed.error.issues[0].message)

      const alert = await service.createAlert(ctx.state.user.uid, parsed.data)
      ctx.status = 201
      ctx.body = { data: alert, success: true }
    },

    async list(ctx: Context) {
      const alerts = await service.listAlerts(ctx.state.user.uid)
      ctx.body = { data: alerts, success: true }
    },

    async remove(ctx: Context) {
      await service.deleteAlert(ctx.state.user.uid, ctx.params.id)
      ctx.status = 204
    },
  }
}
