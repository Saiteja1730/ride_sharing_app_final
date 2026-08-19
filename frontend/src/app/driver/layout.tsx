'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isHydrated && !isAuthenticated) { router.replace('/login'); return; }
    if (isHydrated && user?.role === 'rider') router.replace('/rider');
  }, [mounted, isHydrated, isAuthenticated, user, router]);

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar role="driver" />
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
