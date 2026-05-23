'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, Star, Car, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeletons';
import { ProfileUpdateSchema } from '@/lib/validations';
import toast from 'react-hot-toast';
import { z } from 'zod';

type ProfileFormValues = z.infer<typeof ProfileUpdateSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getMe().then(r => r.data.data),
    initialData: user,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields, isValid },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
    },
  });

  // Pre-populate when profile data loads
  useEffect(() => {
    if (profile) {
      setValue('name', profile.name);
      setValue('phone', profile.phone);
    }
  }, [profile, setValue]);

  const phoneVal = watch('phone') || '';

  // Phone auto-formatter: limit to 10 digits
  useEffect(() => {
    if (phoneVal) {
      const numbersOnly = phoneVal.replace(/\D/g, '').slice(0, 10);
      if (numbersOnly !== phoneVal) {
        setValue('phone', numbersOnly, { shouldValidate: true });
      }
    }
  }, [phoneVal, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => authApi.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
      toast.success('Profile updated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return (
    <div className="space-y-4">
      <CardSkeleton lines={4} />
      <CardSkeleton lines={3} />
    </div>
  );

  const isNameValid = touchedFields.name && !errors.name;
  const isPhoneValid = touchedFields.phone && !errors.phone;

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-white">Profile</h1>

      {/* Avatar + stats */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-3xl font-bold text-white shadow-glow">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-white">{profile?.name}</p>
            <p className="text-slate-400 capitalize text-sm mt-0.5">{profile?.role}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm text-white font-medium">{profile?.rating?.toFixed(1)}</span>
              <span className="text-slate-500 text-xs">({profile?.ratingCount ?? 0} ratings)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Rides', value: profile?.totalRides ?? 0, icon: Car },
            { label: 'Account Status', value: profile?.isActive ? 'Active' : 'Inactive', icon: User },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/3 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-500" />
                <p className="text-xs text-slate-500">{label}</p>
              </div>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable info */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Personal Information</h2>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} icon={<Edit2 className="w-3.5 h-3.5" />}>
              Edit
            </Button>
          ) : (
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="name"
                label="Full Name"
                icon={<User className="w-4 h-4" />}
                rightIcon={isNameValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                id="phone"
                label="Phone"
                icon={<Phone className="w-4 h-4" />}
                rightIcon={isPhoneValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Button
                type="submit"
                className="w-full"
                loading={updateMutation.isPending}
                disabled={!isValid || updateMutation.isPending}
                icon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Full Name', value: profile?.name, icon: User },
                { label: 'Email', value: profile?.email, icon: Mail },
                { label: 'Phone', value: profile?.phone, icon: Phone },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm text-white mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vehicle info (driver only) */}
      {profile?.role === 'driver' && profile?.vehicleInfo && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-white mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Make', profile.vehicleInfo.make],
              ['Model', profile.vehicleInfo.model],
              ['Color', profile.vehicleInfo.color],
              ['Plate', profile.vehicleInfo.plateNumber],
              ['Type', profile.vehicleInfo.type],
              ['Year', profile.vehicleInfo.year],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/3 rounded-lg p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-white font-medium mt-0.5 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
