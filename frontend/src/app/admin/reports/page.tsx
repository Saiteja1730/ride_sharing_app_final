'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FileText, Download, Calendar, Filter,
  TrendingUp, DollarSign, Users, Car, Clock, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/apiClient';

const REPORT_TEMPLATES = [
  { id: 'daily-ops',    label: 'Daily Operations',   desc: 'Rides, revenue, cancellations & driver activity for a single day',        icon: Clock,       color: 'from-brand-500 to-brand-700'   },
  { id: 'revenue',      label: 'Revenue Report',      desc: 'Comprehensive revenue breakdown by vehicle type, zone, and time',          icon: DollarSign,  color: 'from-green-500 to-emerald-700' },
  { id: 'driver-perf',  label: 'Driver Performance',  desc: 'Individual driver KPIs: rating, acceptance rate, earnings',               icon: Car,         color: 'from-amber-500 to-orange-700'  },
  { id: 'user-growth',  label: 'User Growth',         desc: 'New sign-ups, churn rate, retention metrics over time',                   icon: Users,       color: 'from-violet-500 to-purple-700' },
  { id: 'ride-quality', label: 'Ride Quality',        desc: 'Avg wait times, ride duration, ratings, and complaint resolution',        icon: TrendingUp,  color: 'from-cyan-500 to-teal-700'     },
  { id: 'compliance',   label: 'Compliance & Safety', desc: 'Document verification status, incident reports, insurance checks',        icon: CheckCircle, color: 'from-rose-500 to-pink-700'     },
];

const REPORT_HISTORY = [
  { id: 'daily-ops',    name: 'Daily Ops — May 22, 2026',        type: 'Daily Operations',   status: 'ready',      size: '2.4 MB', generatedAt: '2026-05-22T23:59:00Z' },
  { id: 'revenue',      name: 'Revenue — May Week 3',             type: 'Revenue Report',     status: 'ready',      size: '4.1 MB', generatedAt: '2026-05-21T06:00:00Z' },
  { id: 'driver-perf',  name: 'Driver Performance — May 2026',    type: 'Driver Performance', status: 'ready',      size: '3.8 MB', generatedAt: '2026-05-20T12:00:00Z' },
  { id: 'user-growth',  name: 'User Growth — Q1 2026',            type: 'User Growth',        status: 'ready',      size: '1.9 MB', generatedAt: '2026-05-15T08:30:00Z' },
  { id: 'ride-quality', name: 'Ride Quality — April 2026',        type: 'Ride Quality',       status: 'ready',      size: '2.7 MB', generatedAt: '2026-05-01T06:00:00Z' },
  { id: 'daily-ops',    name: 'Daily Ops — May 23, 2026',         type: 'Daily Operations',   status: 'generating', size: '—',      generatedAt: '2026-05-23T06:00:00Z' },
];

const SCHEDULED = [
  { name: 'Daily Operations Summary',    freq: 'Every day at 11:59 PM',      lastRun: 'Today, 11:59 PM',  enabled: true  },
  { name: 'Weekly Revenue Report',       freq: 'Every Monday at 6:00 AM',    lastRun: 'May 19, 2026',     enabled: true  },
  { name: 'Monthly Driver Performance',  freq: 'First of month at 8:00 AM',  lastRun: 'May 1, 2026',      enabled: false },
];

export default function AdminReportsPage() {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleView = (templateId: string) => {
    router.push(`/admin/reports/${templateId}`);
  };

  const handleDownload = async (reportId: string) => {
    setDownloading(reportId);
    toast.loading('Preparing CSV download…', { id: 'csv-dl' });
    try {
      let headers: string[] = [];
      let rows: any[][] = [];

      if (reportId === 'revenue') {
        const res = await adminApi.listRides({ limit: 1000 });
        const rides = res.data.data ?? [];
        headers = ['Ride ID', 'Total Fare', 'Platform Commission', 'Driver Earnings', 'Vehicle Type', 'Status', 'Date'];
        rows = rides.map((r: any) => [
          r._id,
          (r.fare?.total ?? 0).toFixed(2),
          (r.fare?.platformCommission ?? 0).toFixed(2),
          (r.fare?.driverEarnings ?? 0).toFixed(2),
          r.vehicleType ?? '',
          r.status,
          new Date(r.createdAt).toISOString(),
        ]);
      } else if (reportId === 'driver-perf') {
        const res = await adminApi.listUsers({ limit: 1000 });
        const drivers = (res.data.data ?? []).filter((u: any) => u.role === 'driver');
        headers = ['Driver Name', 'Email', 'Total Earnings', 'Pending Payouts', 'Status', 'Joined'];
        rows = drivers.map((d: any) => [
          `"${d.name}"`, d.email,
          (d.earnings ?? 0).toFixed(2),
          (d.pendingPayouts ?? 0).toFixed(2),
          d.isActive ? 'Active' : 'Inactive',
          new Date(d.createdAt).toISOString(),
        ]);
      } else {
        const res = await adminApi.listRides({ limit: 1000 });
        const rides = res.data.data ?? [];
        headers = ['Ride ID', 'Status', 'Vehicle Type', 'Fare', 'Date'];
        rows = rides.map((r: any) => [
          r._id, r.status, r.vehicleType ?? '',
          (r.fare?.total ?? 0).toFixed(2),
          new Date(r.createdAt).toISOString(),
        ]);
      }

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded successfully!', { id: 'csv-dl' });
    } catch (err) {
      console.error(err);
      toast.error('Download failed. Is the backend running?', { id: 'csv-dl' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Generate, download, and schedule platform reports</p>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Analytics Dashboards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map(({ id, label, desc, icon: Icon, color }) => (
            <div key={id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-300 group flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5 font-medium">{desc}</p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => handleView(id)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-300 flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Dashboard
                </button>
                <button
                  onClick={() => handleDownload(id)}
                  disabled={downloading === id}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 border bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Report History</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Previously generated reports available for download</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 shadow-sm font-semibold">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Report Name</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Type</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Generated</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Size</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REPORT_HISTORY.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-violet-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs text-slate-600 font-semibold">{r.type}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(r.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-600 font-semibold">{r.size}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {r.status === 'ready' ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border bg-green-50 text-green-700 border-green-200 shadow-sm">
                        Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md border bg-amber-50 text-amber-700 border-amber-200 shadow-sm flex items-center gap-1.5 w-fit">
                        <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Generating
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {r.status === 'ready' && (
                      <button
                        onClick={() => handleDownload(r.id)}
                        disabled={downloading === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 hover:bg-slate-50 border border-slate-200 bg-white transition-all disabled:opacity-50 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloading === r.id ? 'Downloading…' : 'Download'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Scheduled Reports</h2>
            <p className="text-xs font-medium text-slate-500">Auto-generated on a recurring schedule</p>
          </div>
          <button
            onClick={() => toast.success('Schedule editor coming soon!')}
            className="px-3.5 py-2 text-xs rounded-xl bg-violet-600 text-white hover:bg-violet-700 hover:shadow-glow transition-all duration-200 font-bold flex items-center gap-1.5 shadow-md"
          >
            <Calendar className="w-3.5 h-3.5" />
            Add Schedule
          </button>
        </div>
        <div className="space-y-3">
          {SCHEDULED.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.freq} · Last: {s.lastRun}</p>
                </div>
              </div>
              <button
                onClick={() => toast.success(`Schedule ${s.enabled ? 'paused' : 'resumed'}`)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 flex-shrink-0 ${s.enabled ? 'bg-violet-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${s.enabled ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
