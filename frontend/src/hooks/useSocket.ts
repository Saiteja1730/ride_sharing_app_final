// src/hooks/useSocket.ts

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

let socket: Socket | null = null;

/**
 * Singleton hook that creates a Socket.IO client, authenticates with JWT,
 * and provides basic on/off/emit helpers.
 */
export function useSocket() {
  const { token } = useAuthStore(); // auth store should expose JWT token
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const options = {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    socket = io(socketUrl, options);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected', socket?.id);
    });
    socket.on('disconnect', (reason) => {
      console.warn('⚡ Socket disconnected', reason);
    });
    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error', err);
    });

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const on = (event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler);
  };
  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (handler) socket?.off(event, handler);
    else socket?.off(event);
  };
  const emit = (event: string, payload?: any, ack?: (response: any) => void) => {
    if (ack) socket?.emit(event, payload, ack);
    else socket?.emit(event, payload);
  };

  return { socket: socketRef.current, on, off, emit };
}
