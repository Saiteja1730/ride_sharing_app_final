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
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">KYC Approvals</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Review and approve pending driver registrations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-sm">
          <span className="text-slate-500 font-medium">Pending Requests:</span>
          <span className="font-bold text-amber-600">{pendingDrivers.length}</span>
        </div>
      </div>

      {pendingDrivers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">All caught up!</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm">
            There are no pending KYC approval requests at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map((driver) => (
            <div key={driver._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
                   {driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                     {driver.name}
                    <Badge label="Pending" status="pending" />
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium"><User className="w-4 h-4 text-slate-400" /> {driver.email}</span>
                    <span className="flex items-center gap-1.5 font-medium"><FileText className="w-4 h-4 text-slate-400" /> License: {driver.licenseNumber || 'Not provided'}</span>
                  </div>
                  {driver.vehicleInfo && (
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Car className="w-4 h-4 text-slate-400" /> Vehicle: {driver.vehicleInfo.make} {driver.vehicleInfo.model} ({driver.vehicleInfo.year})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 uppercase">
                        {driver.vehicleInfo.type}
                      </span>
                    </div>
                  )}
                  {driver.documents && (() => {
                      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                      return (
                        <div className="flex items-center gap-4 mt-4 border-t border-slate-100 pt-3">
                          {driver.documents.licenseUrl && (
                            <a href={`${apiBase}${driver.documents.licenseUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:text-brand-700 font-bold underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> View License
                            </a>
                          )}
                          {driver.documents.aadhaarUrl && (
                            <a href={`${apiBase}${driver.documents.aadhaarUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:text-brand-700 font-bold underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> View Aadhaar
                            </a>
                          )}
                          {driver.documents.rcUrl && (
                            <a href={`${apiBase}${driver.documents.rcUrl}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:text-brand-700 font-bold underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> View RC
                            </a>
                          )}
                        </div>
                      );
                    })()
                  }
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button 
                  onClick={() => handleKycUpdate(driver._id, 'approved')} 
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
                <Button 
                  onClick={() => handleKycUpdate(driver._id, 'rejected')} 
                  variant="danger" 
                  className="flex-1 md:flex-none shadow-sm"
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
