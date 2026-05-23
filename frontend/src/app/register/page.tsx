'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Zap, Mail, Lock, User, Phone, Car, ArrowRight, Eye, EyeOff,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { RegisterSchema } from '@/lib/validations';
import { z } from 'zod';

type RegisterFormValues = z.infer<typeof RegisterSchema>;

function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'driver' ? 'driver' : 'rider';

  const { register, isRegistering } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: regField,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: initialRole,
      vehicleMake: '',
      vehicleModel: '',
      vehicleYear: '',
      vehicleColor: '',
      vehiclePlate: '',
      vehicleType: 'economy',
    },
  });

  const selectedRole = watch('role');
  const passwordVal = watch('password') || '';
  const phoneVal = watch('phone') || '';

  // Phone number auto-formatter: limit to 10 digits
  useEffect(() => {
    if (phoneVal) {
      const numbersOnly = phoneVal.replace(/\D/g, '').slice(0, 10);
      if (numbersOnly !== phoneVal) {
        setValue('phone', numbersOnly, { shouldValidate: true });
      }
    }
  }, [phoneVal, setValue]);

  // If role changes, trigger validation to update isValid state
  const handleRoleChange = (role: 'rider' | 'driver') => {
    setValue('role', role, { shouldValidate: true });
    // Reset vehicle fields if toggling to rider to avoid stale validations
    if (role === 'rider') {
      setValue('vehicleMake', '');
      setValue('vehicleModel', '');
      setValue('vehicleYear', '');
      setValue('vehicleColor', '');
      setValue('vehiclePlate', '');
    }
    trigger();
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitError('');
    const payload: any = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: data.role,
    };

    if (data.role === 'driver') {
      payload.vehicleInfo = {
        make: data.vehicleMake,
        model: data.vehicleModel,
        year: Number(data.vehicleYear) || 2022,
        color: data.vehicleColor,
        plateNumber: data.vehiclePlate,
        type: data.vehicleType,
      };
    }

    try {
      await register(payload);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Registration failed. The email or phone number might already be in use.');
    }
  };

  // Live Password Strength Calculations
  const hasMinLength = passwordVal.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasLowercase = /[a-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);

  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (!passwordVal) return { label: 'Empty', color: 'bg-slate-700 text-slate-400' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500/20 text-red-400' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'bg-amber-500/20 text-amber-400' };
    return { label: 'Strong', color: 'bg-green-500/20 text-green-400 border border-green-500/30' };
  };

  const strength = getStrengthLabel();

  // Field Success indicators
  const isNameValid = touchedFields.name && !errors.name;
  const isEmailValid = touchedFields.email && !errors.email;
  const isPhoneValid = touchedFields.phone && !errors.phone;
  const isConfirmPasswordValid = touchedFields.confirmPassword && !errors.confirmPassword && passwordVal === watch('confirmPassword');

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-surface-50 via-surface-100 to-surface-200 p-12 border-r border-white/5 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-brand-700/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">RideShare</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-display font-extrabold text-white mb-4 leading-tight">
            Join thousands of <br />riders & drivers
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Get access to real-time ride tracking, dynamic pricing, and a world-class experience — all in one platform.
          </p>
        </div>
        <div className="flex gap-8 relative z-10">
          {[['50K+', 'Active Riders'], ['8K+', 'Drivers'], ['4.9★', 'Avg Rating']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl font-display font-bold text-brand-400">{val}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold text-white mb-2">Create account</h1>
            <p className="text-slate-400">Already have an account?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
            </p>
          </div>

          {/* Submit-level error */}
          {submitError && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}

          {/* Role toggle */}
          <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-6">
            {(['rider', 'driver'] as const).map((roleVal) => (
              <button
                key={roleVal}
                type="button"
                onClick={() => handleRoleChange(roleVal)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedRole === roleVal
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {roleVal === 'driver' ? <Car className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {roleVal.charAt(0).toUpperCase() + roleVal.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              id="name"
              label="Full Name"
              placeholder="John Doe"
              icon={<User className="w-4 h-4" />}
              rightIcon={isNameValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
              error={errors.name?.message}
              {...regField('name')}
            />

            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              rightIcon={isEmailValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
              error={errors.email?.message}
              {...regField('email')}
            />

            <Input
              id="phone"
              label="Phone"
              type="tel"
              placeholder="9876543210"
              icon={<Phone className="w-4 h-4" />}
              rightIcon={isPhoneValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
              error={errors.phone?.message}
              {...regField('phone')}
            />

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...regField('password')}
              />

              {/* Password Strength Indicator */}
              {passwordVal.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-white/3 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Password Strength:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 transition-colors duration-500 ${
                          i < strengthScore
                            ? strengthScore <= 2
                              ? 'bg-red-500'
                              : strengthScore <= 4
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                            : 'bg-white/5'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                    {[
                      { flag: hasMinLength, label: 'Min 8 characters' },
                      { flag: hasUppercase, label: 'One uppercase letter' },
                      { flag: hasLowercase, label: 'One lowercase letter' },
                      { flag: hasNumber, label: 'One digit (0-9)' },
                      { flag: hasSpecial, label: 'One special character' },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {req.flag ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        )}
                        <span className={req.flag ? 'text-slate-300' : 'text-slate-500'}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              id="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              rightIcon={
                <div className="flex items-center gap-1">
                  {isConfirmPasswordValid && <CheckCircle2 className="w-4 h-4 text-green-400 mr-1" />}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              }
              error={errors.confirmPassword?.message}
              {...regField('confirmPassword')}
            />

            {/* Vehicle Details Section if Driver */}
            {selectedRole === 'driver' && (
              <div className="space-y-4 pt-4 border-t border-white/5 animate-fade-in">
                <h3 className="text-sm font-bold text-brand-400">Vehicle Details</h3>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="vehicleMake"
                    label="Make (e.g. Maruti)"
                    placeholder="Maruti Suzuki"
                    error={errors.vehicleMake?.message}
                    {...regField('vehicleMake')}
                  />
                  <Input
                    id="vehicleModel"
                    label="Model"
                    placeholder="Swift Dzire"
                    error={errors.vehicleModel?.message}
                    {...regField('vehicleModel')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="vehicleYear"
                    label="Year"
                    placeholder="2022"
                    type="number"
                    error={errors.vehicleYear?.message}
                    {...regField('vehicleYear')}
                  />
                  <Input
                    id="vehicleColor"
                    label="Color"
                    placeholder="White"
                    error={errors.vehicleColor?.message}
                    {...regField('vehicleColor')}
                  />
                </div>

                <Input
                  id="vehiclePlate"
                  label="License Plate Number"
                  placeholder="KA-03-HA-1234"
                  error={errors.vehiclePlate?.message}
                  {...regField('vehiclePlate')}
                />

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="vehicleType" className="text-xs font-semibold text-slate-400">Vehicle Class</label>
                  <select
                    id="vehicleType"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all duration-200"
                    {...regField('vehicleType')}
                  >
                    <option value="economy" className="bg-surface-100">Auto / Mini (Economy)</option>
                    <option value="premium" className="bg-surface-100">Prime Sedan (Premium)</option>
                    <option value="suv" className="bg-surface-100">Prime SUV (SUV)</option>
                    <option value="xl" className="bg-surface-100">Outstation / XL</option>
                  </select>
                  {errors.vehicleType && <p className="text-xs text-red-400 mt-1">{errors.vehicleType.message}</p>}
                </div>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={isRegistering}
              className="w-full mt-2"
              disabled={isRegistering || !isValid}
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500/40 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
