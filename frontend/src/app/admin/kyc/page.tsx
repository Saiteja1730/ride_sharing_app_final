'use client';
import React, { useEffect, useState } from 'react';
import { adminApi } from '@/lib/apiClient';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, User, Car, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminKycPage() {
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingDrivers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingDrivers();
      setPendingDrivers(res.data.data);
    } catch (err) {
      toast.error('Failed to load pending drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const handleKycUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await adminApi.updateDriverKyc(id, status);
      toast.success(`Driver KYC ${status} successfully`);
      fetchPendingDrivers();
    } catch (err) {
      toast.error(`Failed to update status to ${status}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">KYC Approvals</h1>
          <p className="text-sm text-slate-400 mt-1">Review and approve pending driver registrations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
          <span className="text-slate-400">Pending Requests:</span>
          <span className="font-bold text-amber-400">{pendingDrivers.length}</span>
        </div>
      </div>

      {pendingDrivers.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-white/5">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            There are no pending KYC approval requests at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map((driver) => (
            <div key={driver._id} className="glass-card p-6 border-white/5 flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {driver.name}
                    <Badge label="Pending" status="pending" />
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {driver.email}</span>
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {driver.licenseNumber || 'Not provided'}</span>
                  </div>
                  {driver.vehicleInfo && (
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Car className="w-4 h-4" /> {driver.vehicleInfo.make} {driver.vehicleInfo.model} ({driver.vehicleInfo.year})
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 uppercase">
                        {driver.vehicleInfo.type}
                      </span>
                    </div>
                  )}
                  {driver.documents && (
                    <div className="flex items-center gap-3 mt-4">
                      {driver.documents.licenseUrl && (
                        <a href={`http://localhost:4000${driver.documents.licenseUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:text-brand-300 underline">View License</a>
                      )}
                      {driver.documents.aadhaarUrl && (
                        <a href={`http://localhost:4000${driver.documents.aadhaarUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:text-brand-300 underline">View Aadhaar</a>
                      )}
                      {driver.documents.rcUrl && (
                        <a href={`http://localhost:4000${driver.documents.rcUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:text-brand-300 underline">View RC</a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => handleKycUpdate(driver._id, 'approved')} 
                  className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  onClick={() => handleKycUpdate(driver._id, 'rejected')} 
                  variant="danger" 
                  className="flex-1 md:flex-none"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
