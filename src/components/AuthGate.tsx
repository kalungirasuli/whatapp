import React, { FormEvent, useState } from 'react';
import { LockIcon, MessageCircleIcon, ShieldCheckIcon, StoreIcon } from 'lucide-react';
import { AuthSession } from '../types';
import { requestOtp, verifyOtp } from '../api';

interface AuthGateProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [role, setRole] = useState<'client' | 'merchant'>('client');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await requestOtp(phone);
      setStep('code');
      setInfo(res.message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await verifyOtp(phone, code.trim(), role, name.trim() || undefined);
      onAuthenticated(session);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const roleButton = (value: 'client' | 'merchant', label: string, desc: string, Icon: typeof StoreIcon) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      aria-pressed={role === value}
      className={`flex flex-1 items-start gap-3 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-wa-green ${
        role === value ? 'border-wa-header bg-[#e7fce3]' : 'border-wa-border bg-wa-panel hover:bg-wa-panelAlt'
      }`}
    >
      <Icon className={`mt-0.5 h-4 w-4 ${role === value ? 'text-wa-header' : 'text-wa-textSecondary'}`} />
      <span>
        <span className="block text-sm font-medium text-wa-textPrimary">{label}</span>
        <span className="block text-xs text-wa-textSecondary">{desc}</span>
      </span>
    </button>
  );

  return (
    <div className="flex min-h-full items-center justify-center bg-wa-panelAlt p-4">
      <div className="w-full max-w-md rounded-[28px] bg-wa-panel p-6 shadow-panel">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wa-header text-white">
            <MessageCircleIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-wa-textPrimary">whatAppSeller</h1>
            <p className="text-sm text-wa-textSecondary">Sign in to shop or sell</p>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-wa-textPrimary">Phone number</span>
              <input
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256 700 000 000"
                className={inputClassName}
              />
            </label>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-wa-textPrimary">I want to…</span>
              <div className="flex gap-3">
                {roleButton('client', 'Shop / Browse', 'Search products & chat', StoreIcon)}
                {roleButton('merchant', 'Sell', 'Open & manage a shop', ShieldCheckIcon)}
              </div>
            </div>

            {error && <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-xs text-[#c92a2a]">{error}</p>}

            <button
              type="submit"
              disabled={loading || phone.trim().length < 6}
              className="w-full rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-wa-textSecondary/40"
            >
              {loading ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-[#e7fce3] px-3 py-2 text-xs text-wa-tealDark">
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              <span>
                Code sent to {phone} {info ? `· ${info}` : ''}. If no WhatsApp is connected, grab the 6-digit
                code from the server log (api_out*.log).
              </span>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-wa-textPrimary">6-digit code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={inputClassName}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-wa-textPrimary">Display name (optional)</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClassName}
              />
            </label>

            {error && <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-xs text-[#c92a2a]">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(null); }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-wa-textSecondary/40"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

const inputClassName =
  'w-full rounded-lg border border-wa-border bg-wa-panel px-3 py-2.5 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30';
