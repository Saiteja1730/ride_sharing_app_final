'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, Mail, Phone, ShieldCheck, Car, Calendar, 
  Star, Briefcase, Award, CheckCircle, Clock, AlertTriangle, FileText, Settings, Bell
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

import { authApi } from '@/lib/apiClient';

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits)'),
  licenseNumber: z.string().min(5, 'Valid license number required'),
  vehicleMake: z.string().min(2, 'Make is required'),
  vehicleModel: z.string().min(2, 'Model is required'),
  vehicleColor: z.string().min(3, 'Color is required'),
  vehicleYear: z.string().regex(/^(201\d|202[0-6])$/, 'Year must be between 2010 and 2026'),
  vehiclePlate: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, 'Invalid Indian RTO plate (e.g. KA03HA1234)'),
  seatingCapacity: z.string().regex(/^[1-8]$/, 'Capacity must be between 1 and 8'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function DriverProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Refresh profile on mount to get latest KYC status
  React.useEffect(() => {
    authApi.getMe().then(res => {
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    }).catch(() => {});
  }, [updateUser]);

  const docStatus = user?.kycStatus || 'pending';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      licenseNumber: user?.licenseNumber || '',
      vehicleMake: user?.vehicleInfo?.make || '',
      vehicleModel: user?.vehicleInfo?.model || '',
      vehicleColor: user?.vehicleInfo?.color || '',
      vehicleYear: String(user?.vehicleInfo?.year || new Date().getFullYear()),
      vehiclePlate: user?.vehicleInfo?.plateNumber || '',
      seatingCapacity: String(user?.vehicleInfo?.seatingCapacity || 4),
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      updateUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        vehicleInfo: {
          make: data.vehicleMake,
          model: data.vehicleModel,
          color: data.vehicleColor,
          year: parseInt(data.vehicleYear, 10),
          plateNumber: data.vehiclePlate,
          seatingCapacity: parseInt(data.seatingCapacity, 10),
          type: (user?.vehicleInfo?.type || 'suv') as any,
        }
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const documentLogs = [
    { name: 'Driver License', code: 'DL-KA-03-******' },
    { name: 'Aadhaar ID Card', code: '****-****-9876' },
    { name: 'Vehicle Registration (RC)', code: 'RC-KA-03-******' },
    { name: 'Commercial Carriage Permit', code: 'PR-CP-******' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Welcome & Badge Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 to-brand-900 p-8 shadow-lg border border-brand-800">
        <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-brand-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center font-black text-brand-900 text-4xl shadow-sm border border-slate-200">
              {user?.name?.charAt(0) ?? 'D'}
              {/* Platinum verification badge */}
              {docStatus === 'approved' && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-amber-400 p-2 rounded-full border-4 border-white shadow-sm text-slate-900 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 fill-slate-900" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">{user?.name}</h2>
                {docStatus === 'approved' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-400 text-amber-900 shadow-sm">
                    Verified Partner
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-brand-100 mt-1">Joined {new Date().getFullYear()} • Registered Driver</p>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white font-bold backdrop-blur-sm shadow-sm border border-white/10">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {(user?.rating ?? 5.0).toFixed(1)} Rating
                </span>
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white font-bold backdrop-blur-sm shadow-sm border border-white/10">
                  {user?.totalRides ?? 0} Rides
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white text-slate-900 hover:bg-slate-50 font-bold border-transparent shadow-sm py-3 px-5"
            >
              {isEditing ? 'Discard Changes' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Personal details & verification log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <User className="w-5 h-5 text-brand-600" /> Personal Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-5">
              <Input 
                id="name" 
                label="Name" 
                disabled={!isEditing} 
                error={errors.name?.message} 
                icon={<User className="w-5 h-5 text-slate-400" />}
                {...register('name')}
              />
              <Input 
                id="email" 
                label="Email" 
                disabled={!isEditing} 
                error={errors.email?.message} 
                icon={<Mail className="w-5 h-5 text-slate-400" />}
                {...register('email')}
              />
              <Input 
                id="phone" 
                label="Phone Number" 
                disabled={!isEditing} 
                error={errors.phone?.message} 
                icon={<Phone className="w-5 h-5 text-slate-400" />}
                {...register('phone')}
              />
              <Input 
                id="licenseNumber" 
                label="License Number" 
                disabled={!isEditing} 
                error={errors.licenseNumber?.message} 
                icon={<FileText className="w-5 h-5 text-slate-400" />}
                {...register('licenseNumber')}
              />
            </div>
          </div>

          {/* Vehicle specs and capabilities */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Car className="w-5 h-5 text-brand-600" /> Vehicle Information
            </h3>
            
            <div className="grid md:grid-cols-3 gap-5">
              <Input 
                id="vehicleMake" 
                label="Make" 
                disabled={!isEditing} 
                error={errors.vehicleMake?.message} 
                placeholder="e.g. Toyota"
                {...register('vehicleMake')}
              />
              <Input 
                id="vehicleModel" 
                label="Model" 
                disabled={!isEditing} 
                error={errors.vehicleModel?.message} 
                placeholder="e.g. Innova"
                {...register('vehicleModel')}
              />
              <Input 
                id="vehicleColor" 
                label="Color" 
                disabled={!isEditing} 
                error={errors.vehicleColor?.message} 
                placeholder="e.g. Black"
                {...register('vehicleColor')}
              />
              <Input 
                id="vehicleYear" 
                label="Year" 
                type="number"
                disabled={!isEditing} 
                error={errors.vehicleYear?.message} 
                {...register('vehicleYear')}
              />
              <Input 
                id="vehiclePlate" 
                label="Plate Number" 
                disabled={!isEditing} 
                error={errors.vehiclePlate?.message} 
                placeholder="e.g. KA03HA5678"
                {...register('vehiclePlate')}
              />
              <Input 
                id="seatingCapacity" 
                label="Seats" 
                type="number"
                disabled={!isEditing} 
                error={errors.seatingCapacity?.message} 
                {...register('seatingCapacity')}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  loading={isSubmitting} 
                  className="font-bold py-3 px-6 shadow-sm"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification & Documents checklist */}
        <div className="space-y-6">
          {/* Realtime verification state checklist */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Documents</h3>
              <Badge 
                label={docStatus === 'approved' ? 'approved' : docStatus} 
                status={docStatus} 
              />
            </div>
            
            <div className="space-y-3">
              {documentLogs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                    <code className="text-[10px] text-slate-500 tracking-wider font-mono mt-1 block">{doc.code}</code>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm ${docStatus === 'approved' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                    {docStatus === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />} 
                    {docStatus === 'approved' ? 'VERIFIED' : 'PENDING'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preference controls */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-600" /> Alerts & Prefs
            </h3>
            <div className="space-y-4 text-sm font-medium">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Push Notifications for Offers</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer shadow-sm" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Email Monthly Statements</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer shadow-sm" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Demand Hotspot Alerts</span>
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-5 h-5 cursor-pointer shadow-sm" />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
