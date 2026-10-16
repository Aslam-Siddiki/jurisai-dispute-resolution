import { useEffect, useRef, useState, useCallback } from 'react'
import { NODE_API_BASE } from '../config/api'

/**
 * useRealtimeEvents
 * Connects to the server SSE stream and invokes callback on real-time dispute updates.
 * Also returns real-time connection status and recent alert notifications.
 */
export function useRealtimeEvents(onEvent) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastNotification, setLastNotification] = useState(null)
  const eventSourceRef = useRef(null)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const dismissNotification = useCallback(() => {
    setLastNotification(null)
  }, [])

  useEffect(() => {
    // Derive SSE url from NODE_API_BASE
    const sseUrl = `${NODE_API_BASE}/realtime/events`
    let es = null
    let reconnectTimer = null

    function connect() {
      try {
        es = new EventSource(sseUrl)
        eventSourceRef.current = es

        es.onopen = () => {
          setIsConnected(true)
        }

        es.onerror = () => {
          setIsConnected(false)
          es.close()
          // Auto reconnect after 4 seconds
          reconnectTimer = setTimeout(connect, 4000)
        }

        // Standard event handlers
        const handleServerEvent = (type) => (e) => {
          try {
            const parsed = JSON.parse(e.data)
            const payload = parsed.data || parsed
            const notificationMsg = payload.message || `Dispute updated: ${type}`
            setLastNotification({
              type,
              message: notificationMsg,
              timestamp: new Date()
            })

            if (onEventRef.current) {
              onEventRef.current({ type, payload })
            }
          } catch (err) {
            console.error('SSE parse error:', err)
          }
        }

        es.addEventListener('CASE_CREATED', handleServerEvent('CASE_CREATED'))
        es.addEventListener('CASE_UPDATED', handleServerEvent('CASE_UPDATED'))
        es.addEventListener('DECISION_ISSUED', handleServerEvent('DECISION_ISSUED'))
        es.addEventListener('CASE_SOLVED', handleServerEvent('CASE_SOLVED'))
        es.addEventListener('CASE_DELETED', handleServerEvent('CASE_DELETED'))

      } catch (err) {
        console.warn('EventSource initialization failed:', err)
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return { isConnected, lastNotification, dismissNotification }
}
