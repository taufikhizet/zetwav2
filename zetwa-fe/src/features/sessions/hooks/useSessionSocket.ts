import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { connectSocket, subscribeToSession, unsubscribeFromSession } from '@/lib/socket'
import type { Session } from '../types/session.types'

export function useSessionSocket(sessionId: string | undefined, session: Session | undefined, isRestarting: boolean) {
  const queryClient = useQueryClient()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [internalIsRestarting, setInternalIsRestarting] = useState(false)

  // Sync restarting state
  useEffect(() => {
    setInternalIsRestarting(isRestarting)
  }, [isRestarting])

  const handleNewQR = useCallback((qr: string) => {
    setQrCode(qr)
    setInternalIsRestarting(false)
  }, [])

  useEffect(() => {
    if (!sessionId) return

    const socket = connectSocket()
    subscribeToSession(sessionId)

    socket.on('session:qr', (data: { sessionId: string; qr: string }) => {
      if (data.sessionId === sessionId) {
        handleNewQR(data.qr)
      }
    })

    socket.on('session:ready', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        toast.success('WhatsApp connected successfully!')
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    })

    socket.on('session:disconnected', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    })

    socket.on('session:qr_timeout', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('QR code expired. The session will try to get a new one.')
      }
    })

    socket.on('session:auth_failure', (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Authentication failed')
      }
    })

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, queryClient, handleNewQR])

  // Sync QR from session data (initial load)
  useEffect(() => {
    if (internalIsRestarting) return
    
    const status = session?.liveStatus || session?.status
    if (['FAILED', 'DISCONNECTED', 'LOGGED_OUT'].includes(status || '')) {
      setQrCode(null)
      return
    }

    // If session has QR code and we don't have one yet, use it
    if (session?.qrCode && !qrCode) {
      handleNewQR(session.qrCode)
    }
  }, [session?.qrCode, session?.liveStatus, session?.status, qrCode, internalIsRestarting, handleNewQR])

  return {
    qrCode,
    setQrCode,
    isRestarting: internalIsRestarting,
    setIsRestarting: setInternalIsRestarting,
  }
}
