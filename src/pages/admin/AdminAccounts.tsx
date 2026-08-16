import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bootstrapAdmin, listAdminAccounts } from '../../api';
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, StatusBadge } from './AdminUi';
import { formatDateTime } from './adminFormat';

type Account = {
  id: number;
  phone: string;
  name: string | null;
  email?: string | null;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
};

export function AdminAccounts() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAdminAccounts()
      .then((res) => setAdmins(res.admins))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load admin accounts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const bootstrap = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await bootstrapAdmin(phone, name.trim() || undefined);
      setMessage(res.message);
      setPhone('');
      setName('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bootstrap failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Admin accounts" subtitle="Who can access this console, and how to grant access" />

      <div className="mt-4 rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
        <h2 className="font-semibold text-wa-textPrimary">Grant admin access</h2>
        <p className="mt-1 text-sm text-wa-textSecondary">
          Bootstrap only works while no admin exists. After that, promote an existing user from the{' '}
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="font-medium text-wa-header hover:underline focus:outline-none">
            Users
          </button>{' '}
          page instead.
        </p>
        <form onSubmit={bootstrap} className="mt-3 flex flex-wrap gap-2">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Admin phone, e.g. +256 700 000 000"
            className="w-full max-w-xs rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full max-w-xs rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
          />
          <button
            type="submit"
            disabled={busy || phone.trim().length < 6}
            className="rounded-lg bg-wa-header px-4 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? 'Working…' : 'Bootstrap first admin'}
          </button>
        </form>
        {message && <p className="mt-2 text-sm text-wa-tealDark">{message}</p>}
      </div>

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <AdminError message={error} onRetry={load} />
      ) : admins.length === 0 ? (
        <AdminEmpty label="No admin accounts yet" />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-wa-border bg-wa-panel shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Banned</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wa-border">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-wa-panelAlt">
                  <td className="px-4 py-3">
                    <p className="font-medium text-wa-textPrimary">{a.name ?? '—'}</p>
                    {a.email && <p className="text-xs text-wa-textSecondary">{a.email}</p>}
                  </td>
                  <td className="px-4 py-3">{a.phone}</td>
                  <td className="px-4 py-3">{a.is_verified ? <StatusBadge status="active" /> : 'No'}</td>
                  <td className="px-4 py-3">{a.is_banned ? <StatusBadge status="banned" /> : 'No'}</td>
                  <td className="px-4 py-3 text-xs text-wa-textSecondary">{formatDateTime(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
