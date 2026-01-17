import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Debounce refs to prevent double toasts from multiple socket events (session room + user room)
  const lastReadyToast = useRef<number>(0)
  const lastErrorToast = useRef<number>(0)

  // Track if we are expecting a connection (QR scanned or restarting)
  // This prevents unsolicited 'connected' toasts when session flaps or auto-reconnects
  const isExpectingConnection = useRef(false)
  
  // Track authentication state to ensure 'ready' event is valid (must be preceded by 'authenticated')
  const isAuthenticated = useRef(false)

  // Update expectation when QR code exists or restarting
  useEffect(() => {
    isExpectingConnection.current = !!qrCode || internalIsRestarting
  }, [qrCode, internalIsRestarting])

  useEffect(() => {
    if (!sessionId) return

    const socket = connectSocket()
    subscribeToSession(sessionId)

    const handleQR = (data: { sessionId: string; qr: string }) => {
      if (data.sessionId === sessionId) {
        handleNewQR(data.qr)
        isAuthenticated.current = false
      }
    }

    const handleAuthenticated = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        isAuthenticated.current = true
      }
    }

    const handleReady = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        // Debounce toast (backend sends to both session room and user room)
        const now = Date.now()
        if (now - lastReadyToast.current < 2000) return
        lastReadyToast.current = now

        // Only show toast if we were actively waiting for connection AND we are authenticated
        if (isExpectingConnection.current && isAuthenticated.current) {
          toast.success('WhatsApp connected successfully!')
        }
        
        setQrCode(null)
        setInternalIsRestarting(false)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    }

    const handleDisconnected = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        isAuthenticated.current = false
        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      }
    }

    const handleQRTimeout = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        isAuthenticated.current = false
        // Debounce error toast
        const now = Date.now()
        if (now - lastErrorToast.current < 2000) return
        lastErrorToast.current = now

        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('QR code expired. The session will try to get a new one.')
      }
    }

    const handleAuthFailure = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        isAuthenticated.current = false
        // Debounce error toast
        const now = Date.now()
        if (now - lastErrorToast.current < 2000) return
        lastErrorToast.current = now

        setQrCode(null)
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
        toast.error('Authentication failed')
      }
    }

    socket.on('session:qr', handleQR)
    socket.on('session:authenticated', handleAuthenticated)
    socket.on('session:ready', handleReady)
    socket.on('session:disconnected', handleDisconnected)
    socket.on('session:qr_timeout', handleQRTimeout)
    socket.on('session:auth_failure', handleAuthFailure)

    return () => {
      unsubscribeFromSession(sessionId)
      socket.off('session:qr', handleQR)
      socket.off('session:authenticated', handleAuthenticated)
      socket.off('session:ready', handleReady)
      socket.off('session:disconnected', handleDisconnected)
      socket.off('session:qr_timeout', handleQRTimeout)
      socket.off('session:auth_failure', handleAuthFailure)
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
