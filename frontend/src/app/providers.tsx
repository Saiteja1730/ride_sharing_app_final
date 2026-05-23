'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useSocket } from '@/lib/socket';
import React, { useState, useEffect } from 'react';

function SocketInitializer() {
  useSocket();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30000, retry: 2 },
      mutations: { retry: 0 },
    },
  }));

  // Synchronize auth state across tabs to prevent session mismatch errors
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rideshare-auth') {
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketInitializer />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a2e' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a2e' } },
        }}
      />
    </QueryClientProvider>
  );
}
