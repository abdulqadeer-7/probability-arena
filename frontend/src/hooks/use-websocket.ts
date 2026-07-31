'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

type EventHandler = (...args: unknown[]) => void;

export function useWebSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, EventHandler[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) return;

    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', () => {
      reconnectAttempts.current += 1;
      setIsConnected(false);
    });

    handlersRef.current.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        socketRef.current?.on(event, handler);
      });
    });
  }, [token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const on = useCallback((event: string, handler: EventHandler) => {
    const existing = handlersRef.current.get(event) || [];
    handlersRef.current.set(event, [...existing, handler]);

    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler?: EventHandler) => {
    if (handler) {
      const handlers = handlersRef.current.get(event) || [];
      handlersRef.current.set(event, handlers.filter((h) => h !== handler));
    } else {
      handlersRef.current.delete(event);
    }

    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
    emit,
    connect,
    disconnect,
  };
}
