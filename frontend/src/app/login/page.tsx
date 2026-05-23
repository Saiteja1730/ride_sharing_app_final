'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
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
    formState: { errors, touchedFields, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    mode: 'onChange', // Live validation feedback
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError('');
    try {
      await login(data);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  };

  const isEmailValid = touchedFields.email && !errors.email;
  const isPasswordValid = touchedFields.password && !errors.password;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-brand-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white">RideShare</span>
        </div>

        <div className="glass-card p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-display font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400 text-sm">
              New here?{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                Create an account
              </Link>
            </p>
          </div>

          {/* Submit-level error */}
          {submitError && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 mb-5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="relative">
              <Input
                id="email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                rightIcon={isEmailValid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : undefined}
                error={errors.email?.message}
                {...register('email')}
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <div className="flex items-center gap-1">
                    {isPasswordValid && <CheckCircle2 className="w-4 h-4 text-green-400 mr-1" />}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                }
                error={errors.password?.message}
                {...register('password')}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isLoggingIn}
              className="w-full mt-2"
              disabled={isLoggingIn || !isValid}
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3.5 rounded-xl bg-white/3 border border-white/5">
            <p className="text-xs text-slate-500 font-medium mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>Rider: <span className="text-slate-300">rider@demo.com / demo123</span></p>
              <p>Driver: <span className="text-slate-300">driver@demo.com / demo123</span></p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Protected by JWT authentication &amp; rate limiting
        </p>
      </div>
    </div>
  );
}
