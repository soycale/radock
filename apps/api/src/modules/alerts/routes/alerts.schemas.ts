import { z } from 'zod'
import { TRACKED_SYMBOLS } from '@radock/types'

export const createAlertSchema = z.object({
  symbol: z.enum(TRACKED_SYMBOLS),
  targetPrice: z.number().positive(),
  fcmToken: z.string().min(1),
})

export type CreateAlertInput = z.infer<typeof createAlertSchema>
