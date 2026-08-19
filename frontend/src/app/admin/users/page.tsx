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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">View, search, and manage all platform users</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total',    value: total,   icon: Users,    color: 'from-brand-600 to-brand-900', textColor: 'text-brand-900', bgIcon: 'bg-brand-100' },
          { label: 'Riders',   value: riders,  icon: Users,    color: 'from-violet-500 to-purple-600', textColor: 'text-violet-900', bgIcon: 'bg-violet-100' },
          { label: 'Drivers',  value: drivers, icon: Car,      color: 'from-amber-500 to-orange-600', textColor: 'text-amber-900', bgIcon: 'bg-amber-100' },
          { label: 'Active',   value: active,  icon: UserCheck,color: 'from-green-500 to-emerald-600', textColor: 'text-green-900', bgIcon: 'bg-green-100' },
        ].map(({ label, value, icon: Icon, color, textColor, bgIcon }) => (
          <div key={label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className={`w-12 h-12 rounded-xl ${bgIcon} flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20`}>
              <Icon className={`w-6 h-6 ${textColor}`} />
            </div>
            <div>
              <p className="text-2xl font-display font-extrabold text-slate-900">{value}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(['all','rider','driver'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                roleFilter === r ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {(['all','active','inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                statusFilter === s
                  ? s === 'active' ? 'bg-green-100 text-green-700 border border-green-200' : s === 'inactive' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4">Role</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4 hidden sm:table-cell">Phone</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Rides</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Rating</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4">Status</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Verified</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? [...Array(6)].map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-6 py-4"><div className="h-10 skeleton rounded-lg" /></td></tr>
                  ))
                : filtered.map((u: any) => (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-sm font-black flex-shrink-0 shadow-sm">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs font-medium text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border uppercase tracking-wider ${
                          u.role === 'driver' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-brand-50 text-brand-700 border-brand-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-600 hidden sm:table-cell">{u.phone}</td>
                      <td className="px-4 py-4 text-xs text-slate-900 font-bold hidden md:table-cell">{u.totalRides}</td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md w-fit border border-slate-100 shadow-sm">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-700">{u.rating?.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border uppercase tracking-wider ${
                          u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {u.isVerified
                          ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                          : <XCircle className="w-5 h-5 text-slate-300" />}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleMutation.mutate(u._id)}
                          disabled={toggleMutation.isPending}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            u.isActive
                              ? 'text-red-600 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300'
                              : 'text-green-600 bg-white hover:bg-green-50 border border-green-200 hover:border-green-300'
                          }`}
                        >
                          {u.isActive ? <><UserX className="w-4 h-4" /> Disable</> : <><UserCheck className="w-4 h-4" /> Enable</>}
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No users match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Showing {filtered.length} of {users.length} users</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">← Prev</button>
            <button className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white rounded-lg border border-slate-200 shadow-sm transition-colors hover:bg-slate-50">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
