import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { PriceUpdateEvent } from '@radock/types'
import { usePricesStore } from '@/stores/prices.store'

const API_URL = process.env.EXPO_PUBLIC_API_URL!

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const setPrice = usePricesStore((s) => s.setPrice)

  useEffect(() => {
    if (!token) return

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })

    socketRef.current = socket

    socket.on('price_update', (event: PriceUpdateEvent) => {
      setPrice(event)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])
}
