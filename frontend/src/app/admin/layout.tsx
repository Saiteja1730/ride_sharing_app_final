'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Car, MapPin, BarChart2, Settings,
  Shield, LogOut, Zap, Menu, X, Bell, TrendingUp, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

const adminNav = [
  { href: '/admin',              label: 'Overview',      icon: LayoutDashboard },
  { href: '/admin/users',        label: 'Users',         icon: Users },
  { href: '/admin/rides',        label: 'Rides',         icon: MapPin },
  { href: '/admin/drivers',      label: 'Fleet',         icon: Car },
  { href: '/admin/analytics',    label: 'Analytics',     icon: BarChart2 },
  { href: '/admin/reports',      label: 'Reports',       icon: FileText },
  { href: '/admin/kyc',          label: 'KYC Approvals', icon: Shield },
  { href: '/admin/settings',     label: 'Settings',      icon: Settings },
];

function AdminSidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const Content = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center shadow-sm">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-slate-900 text-lg leading-none">RideShare</p>
          <p className="text-[10px] text-slate-500 mt-1 font-bold tracking-wide uppercase">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {adminNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-900" />}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-4 pb-6 pt-4 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 font-medium">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}
      {/* Mobile drawer */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 md:hidden shadow-2xl',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <Content />
      </aside>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <Content />
      </aside>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isHydrated && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isHydrated && user && user.role !== 'admin') {
      router.replace('/login');
    }
  }, [mounted, isHydrated, isAuthenticated, user, router]);

  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-wide text-green-700 font-bold">System Operational</span>
            </div>
            <button className="relative p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
            </button>
          </div>
        </header>
        <div className="flex-1 w-full mx-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
