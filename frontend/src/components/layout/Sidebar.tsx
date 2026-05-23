'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Car, MapPin, Clock, Star, Menu, X, LogOut,
  User, LayoutDashboard, Zap, DollarSign,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';
import { useDriverStore } from '@/stores/driverStore';
import { useRideStore } from '@/stores/rideStore';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '@/lib/apiClient';

const riderNav = [
  { href: '/rider',         label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/rider/book',    label: 'Book a Ride',  icon: MapPin },
  { href: '/rider/history', label: 'Ride History', icon: Clock },
  { href: '/rider/profile', label: 'Profile',      icon: User },
];

const driverNav = [
  { href: '/driver',          label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/driver/trips',    label: 'My Trips',      icon: Clock },
  { href: '/driver/earnings', label: 'My Earnings',   icon: DollarSign },
  { href: '/driver/profile',  label: 'Profile',       icon: User },
];

export function Sidebar({ role }: { role: 'rider' | 'driver' }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = React.useState(false);

  // Available drivers nearby (for rider)
  const driversMap = useDriverStore((state) => state.drivers);
  const availableDriversCount = Object.keys(driversMap).length;

  // Active ride (for rider)
  const activeRide = useRideStore((state) => state.activeRide);

  // Pending ride requests (for driver)
  const { data: rideRequests = [] } = useQuery({
    queryKey: ['ride-requests'],
    queryFn: () => driverApi.getRideRequests().then((r) => r.data.data),
    enabled: role === 'driver' && !!user,
    refetchInterval: 15000,
  });
  const pendingRequestsCount = rideRequests.length;

  const nav = role === 'driver' ? driverNav : riderNav;

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-lg leading-none">RideShare</p>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{role} Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== `/${role}` && pathname.startsWith(href));

          // Determine if we need to show badge/count
          let badgeText = null;
          let badgeColor: 'info' | 'warning' | 'success' | 'danger' = 'info';

          if (role === 'rider') {
            if (href === '/rider/book' && availableDriversCount > 0) {
              badgeText = `${availableDriversCount} nearby`;
              badgeColor = 'success';
            } else if (href === '/rider' && activeRide) {
              badgeText = activeRide.status === 'searching' ? 'searching' : 'active';
              badgeColor = 'warning';
            }
          } else if (role === 'driver') {
            if (href === '/driver' && pendingRequestsCount > 0) {
              badgeText = `${pendingRequestsCount} requests`;
              badgeColor = 'danger';
            }
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-brand-500/15 text-brand-400 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </div>
              {badgeText && (
                <span className={clsx(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border',
                  badgeColor === 'success' && 'bg-green-500/10 text-green-400 border-green-500/20',
                  badgeColor === 'warning' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  badgeColor === 'danger' && 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse',
                  badgeColor === 'info' && 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                )}>
                  {badgeText}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400">{user?.rating?.toFixed(1)}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl glass-card text-white"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-surface-50 border-r border-white/5 transform transition-transform duration-300 md:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-50 border-r border-white/5 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
