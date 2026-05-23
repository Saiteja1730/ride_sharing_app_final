'use client';

import { useState } from 'react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Settings, Shield, Bell, DollarSign, MapPin, Zap, Globe, Lock, Save,
  Eye, EyeOff, CheckCircle, AlertTriangle
} from 'lucide-react';
import { AdminSettingsSchema } from '@/lib/validations';
import toast from 'react-hot-toast';
import { z } from 'zod';

type AdminSettingsValues = z.infer<typeof AdminSettingsSchema>;

function SettingsCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, defaultOn = false }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2">
      <div className="min-w-0 pr-4">
        <p className="text-sm text-white">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => { setOn(!on); toast.success(`${label} ${!on ? 'enabled' : 'disabled'}`); }}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${on ? 'bg-violet-500' : 'bg-slate-700'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  id: keyof AdminSettingsValues;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<AdminSettingsValues>;
  error?: string;
  valueAsNumber?: boolean;
}

function InputField({ label, id, type = 'text', placeholder = '', register, error, valueAsNumber }: InputFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && !show ? 'password' : type}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all text-sm pr-10 ${
            error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/40 focus:border-violet-500/40'
          }`}
          {...register(id, { valueAsNumber })}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  id: keyof AdminSettingsValues;
  options: { value: string; label: string }[];
  register: UseFormRegister<AdminSettingsValues>;
  error?: string;
}

function SelectField({ label, id, options, register, error }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400">{label}</label>
      <select
        id={id}
        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white focus:outline-none focus:ring-2 transition-all text-sm ${
          error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/40 focus:border-violet-500/40'
        }`}
        {...register(id)}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-surface-100">{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AdminSettingsValues>({
    resolver: zodResolver(AdminSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      platformName: 'RideShare',
      supportEmail: 'support@rideshare.in',
      supportPhone: '+91 1800-RIDE-00',
      defaultCity: 'bengaluru',
      currency: 'INR',
      baseFare: 30,
      perKmRate: 12,
      perMinRate: 2,
      minFare: 50,
      maxSurgeMultiplier: 3.0,
      surgeThreshold: 15,
      jwtExpiry: 24,
      maxLoginAttempts: 5,
      rateLimit: 100,
      maxPickupRadius: 5,
      driverTimeout: 30,
      maxRetries: 3,
      matchingStrategy: 'nearest',
      mapsApiKey: 'AIzaSy_MapsKeyExample_RideshareAppLocalDevModeOnly',
      paymentGatewayKey: 'rzp_live_FakePaymentKeyExampleForLocalTestsOnly',
      smsProviderKey: 'tw_FakeSMSKeyExampleForVerificationLocalTestsOnly',
      webhookUrl: '',
    },
  });

  const onSubmit = (data: AdminSettingsValues) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Configuration saved successfully!');
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure platform behavior, pricing, and security</p>
        </div>
        <button
          type="submit"
          disabled={saving || !isValid}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-brand-600 hover:from-violet-400 hover:to-brand-500 hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm font-display shadow-lg"
        >
          {saving ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Platform */}
        <SettingsCard title="General Platform" desc="Core platform settings and identity">
          <div className="space-y-4">
            <InputField label="Platform Name" id="platformName" register={register} error={errors.platformName?.message} />
            <InputField label="Support Email" id="supportEmail" register={register} error={errors.supportEmail?.message} />
            <InputField label="Support Phone" id="supportPhone" register={register} error={errors.supportPhone?.message} />
            <SelectField
              label="Default City"
              id="defaultCity"
              register={register}
              error={errors.defaultCity?.message}
              options={[
                { value: 'bengaluru', label: 'Bengaluru' },
                { value: 'mumbai',    label: 'Mumbai' },
                { value: 'delhi',     label: 'New Delhi' },
                { value: 'hyderabad', label: 'Hyderabad' },
                { value: 'chennai',   label: 'Chennai' },
              ]}
            />
            <SelectField
              label="Currency"
              id="currency"
              register={register}
              error={errors.currency?.message}
              options={[
                { value: 'INR', label: '₹ Indian Rupee (INR)' },
                { value: 'USD', label: '$ US Dollar (USD)' },
              ]}
            />
          </div>
        </SettingsCard>

        {/* Pricing & Surge */}
        <SettingsCard title="Pricing & Surge" desc="Configure fare calculation and dynamic pricing">
          <div className="space-y-4">
            <InputField label="Base Fare (₹)" id="baseFare" type="number" register={register} error={errors.baseFare?.message} valueAsNumber={true} />
            <InputField label="Per KM Rate (₹)" id="perKmRate" type="number" register={register} error={errors.perKmRate?.message} valueAsNumber={true} />
            <InputField label="Per Minute Rate (₹)" id="perMinRate" type="number" register={register} error={errors.perMinRate?.message} valueAsNumber={true} />
            <InputField label="Minimum Fare (₹)" id="minFare" type="number" register={register} error={errors.minFare?.message} valueAsNumber={true} />
            <div className="pt-1 border-t border-white/5">
              <Toggle label="Enable Surge Pricing" desc="Automatically increase fares during high demand" defaultOn={true} />
              <InputField label="Max Surge Multiplier" id="maxSurgeMultiplier" type="number" register={register} error={errors.maxSurgeMultiplier?.message} valueAsNumber={true} />
              <InputField label="Surge Threshold (concurrent requests)" id="surgeThreshold" type="number" register={register} error={errors.surgeThreshold?.message} valueAsNumber={true} />
            </div>
          </div>
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard title="Notifications" desc="Control what triggers admin notifications">
          <div className="space-y-1 divide-y divide-white/5">
            <Toggle label="New user registrations" desc="Get notified when a new rider or driver signs up" defaultOn={true} />
            <Toggle label="High cancellation alerts" desc="Alert when cancellation rate exceeds 15%" defaultOn={true} />
            <Toggle label="Payment failures" desc="Immediate alert on payment gateway errors" defaultOn={true} />
            <Toggle label="Driver verification" desc="Notify when a driver submits documents for review" defaultOn={true} />
            <Toggle label="Surge zone activation" desc="Alert when surge pricing activates in any zone" defaultOn={false} />
            <Toggle label="Daily summary email" desc="Receive a daily platform stats digest at 11 PM" defaultOn={true} />
          </div>
        </SettingsCard>

        {/* Security */}
        <SettingsCard title="Security" desc="Authentication, rate limiting, and access control">
          <div className="space-y-4">
            <InputField label="JWT Token Expiry (hours)" id="jwtExpiry" type="number" register={register} error={errors.jwtExpiry?.message} valueAsNumber={true} />
            <InputField label="Max Login Attempts" id="maxLoginAttempts" type="number" register={register} error={errors.maxLoginAttempts?.message} valueAsNumber={true} />
            <InputField label="Rate Limit (requests/min)" id="rateLimit" type="number" register={register} error={errors.rateLimit?.message} valueAsNumber={true} />
            <div className="space-y-1 pt-2 border-t border-white/5">
              <Toggle label="Two-Factor Authentication" desc="Require 2FA for admin accounts" defaultOn={false} />
              <Toggle label="Force HTTPS" desc="Redirect all HTTP traffic to HTTPS" defaultOn={true} />
              <Toggle label="Session Logging" desc="Log all admin session activity for audit" defaultOn={true} />
            </div>
          </div>
        </SettingsCard>

        {/* Matching & Dispatch */}
        <SettingsCard title="Matching & Dispatch" desc="Ride matching algorithm configuration">
          <div className="space-y-4">
            <InputField label="Max Pickup Radius (km)" id="maxPickupRadius" type="number" register={register} error={errors.maxPickupRadius?.message} valueAsNumber={true} />
            <InputField label="Driver Timeout (seconds)" id="driverTimeout" type="number" register={register} error={errors.driverTimeout?.message} valueAsNumber={true} />
            <InputField label="Max Retries Before Cancel" id="maxRetries" type="number" register={register} error={errors.maxRetries?.message} valueAsNumber={true} />
            <SelectField
              label="Matching Strategy"
              id="matchingStrategy"
              register={register}
              error={errors.matchingStrategy?.message}
              options={[
                { value: 'nearest',     label: 'Nearest Driver First' },
                { value: 'rating',      label: 'Highest Rated First' },
                { value: 'balanced',    label: 'Balanced (Rating + Distance)' },
                { value: 'roundrobin',  label: 'Round Robin' },
              ]}
            />
            <Toggle label="Allow ride sharing" desc="Let multiple riders share a single vehicle" defaultOn={false} />
          </div>
        </SettingsCard>

        {/* API & Integrations */}
        <SettingsCard title="API & Integrations" desc="Third-party service keys and webhook configuration">
          <div className="space-y-4">
            <InputField label="Maps API Key" id="mapsApiKey" type="password" register={register} error={errors.mapsApiKey?.message} />
            <InputField label="Payment Gateway Key" id="paymentGatewayKey" type="password" register={register} error={errors.paymentGatewayKey?.message} />
            <InputField label="SMS Provider Key" id="smsProviderKey" type="password" register={register} error={errors.smsProviderKey?.message} />
            <InputField label="Webhook URL" id="webhookUrl" placeholder="https://your-server.com/webhook" register={register} error={errors.webhookUrl?.message} />
            <div className="pt-2 border-t border-white/5">
              <Toggle label="Enable webhooks" desc="Push ride events to external services" defaultOn={false} />
              <Toggle label="API rate logging" desc="Log all third-party API usage for monitoring" defaultOn={true} />
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-red-500/20">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center flex-shrink-0 animate-pulse-subtle">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">Irreversible actions that affect the entire platform</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Reset all surge pricing',     desc: 'Disable surge in all zones and reset multipliers to 1.0x',  btnColor: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' },
            { label: 'Force logout all users',       desc: 'Invalidate all active sessions across the platform',        btnColor: 'border-red-500/30 text-red-400 hover:bg-red-500/10' },
            { label: 'Purge ride history (30+ days)',desc: 'Permanently delete ride records older than 30 days',         btnColor: 'border-red-500/30 text-red-400 hover:bg-red-500/10' },
          ].map((action, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toast.error(`${action.label} — confirmation required`)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${action.btnColor}`}
              >
                Execute
              </button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
