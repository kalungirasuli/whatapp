import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminOverview as OverviewData } from '../../types';
import { getAdminOverview } from '../../api';
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, StatCard, StatusBadge } from './AdminUi';
import { formatDateTime } from './adminFormat';

export function AdminOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminOverview()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <AdminLoading label="Loading overview…" />;
  if (error) return <AdminError message={error} onRetry={load} />;
  if (!data) return <AdminEmpty label="No data yet" />;

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="System overview" subtitle="Everything happening across the platform at a glance" />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Users" value={data.users.total} hint={`${data.users.admins} admins · ${data.users.banned} banned`} />
        <StatCard label="Merchants" value={data.merchants.total} hint={`${data.merchants.approved} active · ${data.merchants.banned} banned`} />
        <StatCard label="Products" value={data.products.total} hint={`${data.products.active} active · ${data.products.pending_moderation} pending moderation`} />
        <StatCard label="Buyers" value={data.buyers.total} hint={`${data.buyers.banned} banned`} />
        <StatCard label="Chat interactions" value={data.interactions.total} hint="Every /api/chat turn" />
        <StatCard label="Interest events" value={data.interests.total} hint={`${data.interests.sent} sent · ${data.interests.responded} responded`} />
        <StatCard label="WhatsApp messages" value={data.messages.total} hint="Conversation log entries" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-wa-textPrimary">Recent users</h2>
          {data.recent_users.length === 0 ? (
            <AdminEmpty label="No users yet" />
          ) : (
            <ul className="divide-y divide-wa-border">
              {data.recent_users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-wa-textPrimary">{u.name ?? u.phone}</p>
                    <p className="truncate text-xs text-wa-textSecondary">{u.phone}</p>
                  </div>
                  <StatusBadge status={u.role} />
                  <span className="text-xs text-wa-textSecondary">{formatDateTime(u.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-wa-textPrimary">Recent merchants</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/merchants')}
              className="text-xs font-medium text-wa-header hover:underline focus:outline-none">
              View all
            </button>
          </div>
          {data.recent_merchants.length === 0 ? (
            <AdminEmpty label="No merchants yet" />
          ) : (
            <ul className="divide-y divide-wa-border">
              {data.recent_merchants.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-wa-textPrimary">{m.business_name}</p>
                    <p className="truncate text-xs text-wa-textSecondary">{m.category} · {m.phone_number}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-wa-textPrimary">Recent chat interactions</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/interactions')}
              className="text-xs font-medium text-wa-header hover:underline focus:outline-none">
              View all
            </button>
          </div>
          {data.recent_interactions.length === 0 ? (
            <AdminEmpty label="No interactions yet" />
          ) : (
            <ul className="divide-y divide-wa-border">
              {data.recent_interactions.map((i) => (
                <li key={i.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-wa-textPrimary">{i.phone_number}</p>
                    <StatusBadge status={i.reply_type ?? 'text'} />
                    {i.latency_ms != null && (
                      <span className="ml-auto shrink-0 text-xs text-wa-textSecondary">{i.latency_ms}ms</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-wa-textSecondary">{i.user_text ?? i.response_text ?? '—'}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-wa-textPrimary">Recent interest events</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/interests')}
              className="text-xs font-medium text-wa-header hover:underline focus:outline-none">
              View all
            </button>
          </div>
          {data.recent_interests.length === 0 ? (
            <AdminEmpty label="No interest events yet" />
          ) : (
            <ul className="divide-y divide-wa-border">
              {data.recent_interests.map((ie) => (
                <li key={ie.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-wa-textPrimary">{ie.product_name ?? 'Unknown product'}</p>
                    <p className="truncate text-xs text-wa-textSecondary">
                      {ie.buyer_phone}{ie.result_code ? ` · ref ${ie.result_code}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={ie.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
