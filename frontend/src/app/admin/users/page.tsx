'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, XCircle, Filter, UserCheck, UserX, Users, Car, Star } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

const MOCK_USERS = [
  { _id: 'u1', name: 'Priya Sharma',   email: 'priya@demo.com',   phone: '+91 98765 43210', role: 'rider',  isActive: true,  isVerified: true,  totalRides: 34,  rating: 4.9, createdAt: '2024-01-15' },
  { _id: 'u2', name: 'Raj Kumar',       email: 'raj@demo.com',     phone: '+91 98234 56789', role: 'driver', isActive: true,  isVerified: true,  totalRides: 218, rating: 4.7, createdAt: '2024-02-03' },
  { _id: 'u3', name: 'Ananya Singh',    email: 'ananya@demo.com',  phone: '+91 91234 12345', role: 'rider',  isActive: true,  isVerified: true,  totalRides: 12,  rating: 4.8, createdAt: '2024-03-20' },
  { _id: 'u4', name: 'Vikram Nair',     email: 'vikram@demo.com',  phone: '+91 97654 32100', role: 'driver', isActive: false, isVerified: true,  totalRides: 189, rating: 4.5, createdAt: '2023-12-01' },
  { _id: 'u5', name: 'Meera Pillai',    email: 'meera@demo.com',   phone: '+91 99887 65432', role: 'rider',  isActive: true,  isVerified: false, totalRides: 7,   rating: 5.0, createdAt: '2024-04-10' },
  { _id: 'u6', name: 'Arjun Mehta',     email: 'arjun@demo.com',   phone: '+91 93456 78901', role: 'driver', isActive: true,  isVerified: true,  totalRides: 302, rating: 4.6, createdAt: '2023-11-05' },
  { _id: 'u7', name: 'Kavitha Reddy',   email: 'kavitha@demo.com', phone: '+91 90123 45678', role: 'rider',  isActive: true,  isVerified: true,  totalRides: 55,  rating: 4.7, createdAt: '2024-01-28' },
  { _id: 'u8', name: 'Suresh Babu',     email: 'suresh@demo.com',  phone: '+91 87654 32101', role: 'driver', isActive: false, isVerified: false, totalRides: 44,  rating: 4.3, createdAt: '2024-02-14' },
  { _id: 'u9', name: 'Deepika Joshi',   email: 'deepika@demo.com', phone: '+91 85432 10987', role: 'rider',  isActive: true,  isVerified: true,  totalRides: 23,  rating: 4.9, createdAt: '2024-03-05' },
  { _id:'u10', name: 'Mohammed Ali',    email: 'ali@demo.com',     phone: '+91 84321 09876', role: 'driver', isActive: true,  isVerified: true,  totalRides: 411, rating: 4.8, createdAt: '2023-09-20' },
];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'rider' | 'driver'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => adminApi.listUsers({ role: roleFilter === 'all' ? undefined : roleFilter, limit: 50 }).then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User status toggled');
    },
    onError: () => toast.error('Failed to update'),
  });

  const users: any[] = data?.users ?? MOCK_USERS;

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const total   = users.length;
  const riders  = users.filter(u => u.role === 'rider').length;
  const drivers = users.filter(u => u.role === 'driver').length;
  const active  = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">View, search, and manage all platform users</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: total,   icon: Users,    color: 'from-brand-500 to-brand-700'   },
          { label: 'Riders',   value: riders,  icon: Users,    color: 'from-violet-500 to-purple-700' },
          { label: 'Drivers',  value: drivers, icon: Car,      color: 'from-amber-500 to-orange-700'  },
          { label: 'Active',   value: active,  icon: UserCheck,color: 'from-green-500 to-emerald-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all','rider','driver'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                roleFilter === r ? 'bg-violet-500 text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all','active','inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === s
                  ? s === 'active' ? 'bg-green-500 text-white' : s === 'inactive' ? 'bg-red-500 text-white' : 'bg-violet-500 text-white'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Rides</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Rating</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Verified</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-5 py-3.5"><div className="h-10 skeleton rounded-lg" /></td></tr>
                  ))
                : filtered.map((u: any) => (
                    <tr key={u._id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'driver' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 hidden sm:table-cell">{u.phone}</td>
                      <td className="px-4 py-3.5 text-xs text-white font-medium hidden md:table-cell">{u.totalRides}</td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-white">{u.rating?.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {u.isVerified
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <XCircle className="w-4 h-4 text-slate-600" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => toggleMutation.mutate(u._id)}
                          disabled={toggleMutation.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            u.isActive
                              ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20'
                              : 'text-green-400 hover:bg-green-500/10 border border-green-500/20'
                          }`}
                        >
                          {u.isActive ? <><UserX className="w-3.5 h-3.5" /> Disable</> : <><UserCheck className="w-3.5 h-3.5" /> Enable</>}
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                    No users match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {users.length} users</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 transition-colors">← Prev</button>
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
