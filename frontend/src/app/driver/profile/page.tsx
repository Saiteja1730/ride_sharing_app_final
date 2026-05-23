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
  const docStatus = user?.kycStatus || 'pending';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      licenseNumber: user?.licenseNumber || 'DL-KA-03-2023-0987654',
      vehicleMake: user?.vehicleInfo?.make || 'Toyota',
      vehicleModel: user?.vehicleInfo?.model || 'Innova Crysta',
      vehicleColor: user?.vehicleInfo?.color || 'Black Accent',
      vehicleYear: String(user?.vehicleInfo?.year || 2023),
      vehiclePlate: user?.vehicleInfo?.plateNumber || 'KA03HA5678',
      seatingCapacity: String(user?.vehicleInfo?.seatingCapacity || 6),
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
      toast.success("Driver profile updated successfully!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const documentLogs = [
    { name: 'Driver License', code: 'DL-KA-03-******', status: 'approved' },
    { name: 'Aadhaar ID Card', code: '****-****-9876', status: 'approved' },
    { name: 'Vehicle Registration (RC)', code: 'RC-KA-03-******', status: 'approved' },
    { name: 'Commercial Carriage Permit', code: 'PR-CP-******', status: 'approved' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome & Badge Hero banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-brand-950 p-6 md:p-8 shadow-glow border border-brand-500/10">
        <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white text-3xl border border-brand-500/20">
              {user?.name?.charAt(0) ?? 'D'}
              {/* Platinum verification badge */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 p-1.5 rounded-full border-2 border-slate-950 shadow-md text-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 fill-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white">{user?.name}</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  Gold Fleet Partner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Joined March 2025 • Registered Driver</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-0.5 text-slate-300">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <strong>{(user?.rating ?? 5.0).toFixed(1)}</strong> Rating
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300"><strong>{user?.totalRides ?? 48}</strong> Rides completed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              className="border-white/10 hover:bg-white/5 bg-white/5 font-semibold text-xs"
              variant="secondary"
            >
              {isEditing ? 'Discard Changes' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Personal details & verification log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-400" /> Personal Account Settings
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input 
                id="name" 
                label="Full Name" 
                disabled={!isEditing} 
                error={errors.name?.message} 
                icon={<User className="w-4 h-4 text-slate-500" />}
                {...register('name')}
              />
              <Input 
                id="email" 
                label="Email Address" 
                disabled={!isEditing} 
                error={errors.email?.message} 
                icon={<Mail className="w-4 h-4 text-slate-500" />}
                {...register('email')}
              />
              <Input 
                id="phone" 
                label="Indian Mobile Number" 
                disabled={!isEditing} 
                error={errors.phone?.message} 
                icon={<Phone className="w-4 h-4 text-slate-500" />}
                {...register('phone')}
              />
              <Input 
                id="licenseNumber" 
                label="RTO License Plate Number" 
                disabled={!isEditing} 
                error={errors.licenseNumber?.message} 
                icon={<FileText className="w-4 h-4 text-slate-500" />}
                {...register('licenseNumber')}
              />
            </div>
          </div>

          {/* Vehicle specs and capabilities */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-brand-400" /> Registered Vehicle Credentials
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Input 
                id="vehicleMake" 
                label="Vehicle Brand / Make" 
                disabled={!isEditing} 
                error={errors.vehicleMake?.message} 
                placeholder="e.g. Toyota"
                {...register('vehicleMake')}
              />
              <Input 
                id="vehicleModel" 
                label="Vehicle Model" 
                disabled={!isEditing} 
                error={errors.vehicleModel?.message} 
                placeholder="e.g. Innova"
                {...register('vehicleModel')}
              />
              <Input 
                id="vehicleColor" 
                label="Vehicle Color" 
                disabled={!isEditing} 
                error={errors.vehicleColor?.message} 
                placeholder="e.g. Black Accent"
                {...register('vehicleColor')}
              />
              <Input 
                id="vehicleYear" 
                label="Manufacture Year" 
                type="number"
                disabled={!isEditing} 
                error={errors.vehicleYear?.message} 
                {...register('vehicleYear')}
              />
              <Input 
                id="vehiclePlate" 
                label="RTO Plate Code" 
                disabled={!isEditing} 
                error={errors.vehiclePlate?.message} 
                placeholder="e.g. KA03HA5678"
                {...register('vehiclePlate')}
              />
              <Input 
                id="seatingCapacity" 
                label="Seating Capacity" 
                type="number"
                disabled={!isEditing} 
                error={errors.seatingCapacity?.message} 
                {...register('seatingCapacity')}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  loading={isSubmitting} 
                  className="bg-brand-500 hover:bg-brand-400 font-bold"
                >
                  Save Profile Configuration
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification & Documents checklist */}
        <div className="space-y-6">
          {/* Realtime verification state checklist */}
          <div className="glass-card p-5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">KYC Documents Status</h3>
              <Badge 
                label={docStatus === 'approved' ? 'approved' : docStatus} 
                status={docStatus} 
              />
            </div>
            
            <div className="space-y-3">
              {documentLogs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <p className="text-xs font-bold text-white">{doc.name}</p>
                    <code className="text-[10px] text-slate-500 tracking-wider font-mono mt-0.5 block">{doc.code}</code>
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${docStatus === 'approved' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                    {docStatus === 'approved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />} 
                    {docStatus === 'approved' ? 'VERIFIED' : 'PENDING'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preference controls */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-violet-400" /> Alerts & Prefs
            </h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Push Notifications for Offers</span>
                <input type="checkbox" defaultChecked className="rounded bg-white/5 border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Email Monthly Statements</span>
                <input type="checkbox" defaultChecked className="rounded bg-white/5 border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Demand Hotspot Alerts</span>
                <input type="checkbox" defaultChecked className="rounded bg-white/5 border-white/10 text-brand-500 focus:ring-0 focus:ring-offset-0" />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
