import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth.store'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

let socket: Socket | null = null

export const getSocket = (): Socket | null => {
  return socket
}

export const connectSocket = (): Socket => {
  if (socket?.connected) {
    return socket
  }

  const token = useAuthStore.getState().accessToken

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message)
  })

  return socket
}

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const subscribeToSession = (sessionId: string): void => {
  socket?.emit('subscribe:session', sessionId)
}

export const unsubscribeFromSession = (sessionId: string): void => {
  socket?.emit('unsubscribe:session', sessionId)
}

// Event types
export interface SessionQREvent {
  sessionId: string
  qr: string
  timestamp: string
}

export interface SessionReadyEvent {
  sessionId: string
  info: {
    wid: { user: string; _serialized: string }
    pushname: string
  }
  timestamp: string
}

export interface SessionDisconnectedEvent {
  sessionId: string
  reason: string
  timestamp: string
}

export interface MessageReceivedEvent {
  sessionId: string
  message: {
    id: string
    waMessageId: string
    type: string
    body: string
    from: string
    to: string
    timestamp: number
    isFromMe: boolean
    hasMedia: boolean
    contact: {
      id: string
      name: string
      number: string
    }
    chat: {
      id: string
      name: string
      isGroup: boolean
    }
  }
  timestamp: string
}

export interface MessageSentEvent {
  sessionId: string
  message: {
    id: string
    waMessageId: string
    type: string
    body: string
    to: string
    timestamp: number
  }
  timestamp: string
}

export interface MessageAckEvent {
  sessionId: string
  messageId: string
  ack: number
  timestamp: string
}
