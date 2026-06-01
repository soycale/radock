import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import pino from 'pino'
import { firebaseAdmin } from '#application/firebase.js'
import type { PriceUpdateEvent } from '@radock/types'

const logger = pino({ transport: { target: 'pino-pretty' } })

export class SocketService {
  private io: Server | null = null

  attach(httpServer: HttpServer) {
    this.io = new Server(httpServer, { cors: { origin: '*' } })

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Unauthorized'))
      try {
        await firebaseAdmin.auth().verifyIdToken(token)
        next()
      } catch {
        next(new Error('Unauthorized'))
      }
    })

    this.io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Socket.IO client connected')
      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Socket.IO client disconnected')
      })
    })

    logger.info('Socket.IO server attached')
  }

  broadcastPrice(event: PriceUpdateEvent) {
    this.io?.emit('price_update', event)
  }
}

export const socketService = new SocketService()
