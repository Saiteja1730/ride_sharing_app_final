'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Car, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { LoginSchema } from '@/lib/validations';
import { z } from 'zod';

type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [selectedRole, setSelectedRole] = useState<'rider' | 'driver' | 'admin'>('rider');

  const demoAccounts = {
    rider: { email: 'rider@gmail.com', password: 'rider123', label: 'Rider Demo', icon: '👤' },
    driver: { email: 'driver@gmail.com', password: 'driver123', label: 'Driver Demo', icon: '🚗' },
    admin: { email: 'admin@gmail.com', password: 'admin123', label: 'Admin Console', icon: '🛡️' },
  };

  const handleRoleSelect = (role: 'rider' | 'driver' | 'admin') => {
    setSelectedRole(role);
    const creds = demoAccounts[role];
    setValue('email', creds.email, { shouldValidate: true });
    setValue('password', creds.password, { shouldValidate: true });
  };

  const quickLogin = (role: 'rider' | 'driver' | 'admin') => {
    setSelectedRole(role);
    const creds = demoAccounts[role];
    setValue('email', creds.email, { shouldValidate: true });
    setValue('password', creds.password, { shouldValidate: true });
    setSubmitError('');
    login(creds);
  };

  const onSubmit = (data: LoginFormValues) => {
    setSubmitError('');
    login(data);
  };

  const isEmailValid = touchedFields.email && !errors.email;
  const isPasswordValid = touchedFields.password && !errors.password;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-brand-900 flex items-center justify-center shadow-sm">
            <Car className="w-7 h-7 text-white" />
          </div>
          <span className="font-display font-bold text-3xl text-slate-900 tracking-tight">RideShare</span>
        </div>

        <div className="bg-white p-8 sm:p-10 border border-slate-200 rounded-2xl shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm">
              New here?{' '}
              <Link href="/register" className="text-brand-900 hover:text-brand-700 font-bold underline decoration-2 underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>

          {/* Quick Role Dropdown / Selector */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100 rounded-xl">
              {(['rider', 'driver', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedRole === r
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="text-base mb-0.5">{demoAccounts[r].icon}</span>
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit-level error */}
          {submitError && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              rightIcon={isEmailValid ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : undefined}
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              rightIcon={
                <div className="flex items-center gap-1">
                  {isPasswordValid && <CheckCircle2 className="w-5 h-5 text-green-500 mr-1" />}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-slate-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              }
              error={errors.password?.message}
              {...register('password')}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              loading={isLoggingIn}
              className="w-full mt-4 text-base"
              disabled={isLoggingIn}
            >
              Sign In <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          {/* 1-Click Quick Demo Login */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500 font-bold uppercase tracking-wider mb-4">1-Click Instant Login</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => quickLogin('admin')}
                className="py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>🛡️</span> Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('driver')}
                className="py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>🚗</span> Driver
              </button>
              <button
                type="button"
                onClick={() => quickLogin('rider')}
                className="py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>👤</span> Rider
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-400 mt-8">
          Protected by JWT authentication &amp; rate limiting
        </p>
      </div>
    </div>
  );
}
