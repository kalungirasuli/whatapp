import React, { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getAdminAnalytics } from '../../api';
import { AdminAnalytics as AnalyticsData } from '../../types';
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, StatCard, StatusBadge } from './AdminUi';

const DAYS_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export function AdminAnalytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminAnalytics(days)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(load, [load]);

  if (loading) return <AdminLoading label="Loading analytics…" />;
  if (error) return <AdminError message={error} onRetry={load} />;
  if (!data) return <AdminEmpty label="No analytics yet" />;

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader
        title="System analytics"
        subtitle="Platform-wide usage, demand and performance"
        action={
          <div className="flex overflow-hidden rounded-lg border border-wa-border bg-wa-panel">
            {DAYS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDays(option.value)}
                className={`px-3 py-2 text-xs font-medium focus:outline-none ${
                  days === option.value ? 'bg-[#e7fce3] text-wa-tealDark' : 'text-wa-textSecondary hover:bg-wa-panelAlt'
                }`}>
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Interactions" value={data.summary.interactions} />
        <StatCard label="Interest events" value={data.summary.interests} />
        <StatCard label="Unique buyers" value={data.summary.unique_buyers} />
        <StatCard label="Merchants contacted" value={data.summary.unique_merchants_contacted} />
        <StatCard label="Result codes" value={data.summary.result_codes_issued} />
        <StatCard
          label="Avg latency"
          value={data.summary.average_latency_ms != null ? `${data.summary.average_latency_ms}ms` : '—'}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-wa-textPrimary">Activity over time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#667781' }} tickFormatter={(value: string) => value.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#667781' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e9edef', fontSize: 12 }} />
              <Area type="monotone" dataKey="interactions" name="Interactions" stroke="#008069" fill="#008069" fillOpacity={0.15} />
              <Area type="monotone" dataKey="interests" name="Interests" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.12} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-wa-textPrimary">Top merchants by interest</h2>
          {data.top_merchants.length === 0 ? (
            <AdminEmpty label="No data" />
          ) : (
            <ul className="divide-y divide-wa-border">
              {data.top_merchants.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-wa-textPrimary">{m.business_name}</p>
                    <p className="truncate text-xs text-wa-textSecondary">{m.category}</p>
                  </div>
                  <StatusBadge status={m.status} />
                  <span className="shrink-0 rounded-full bg-[#e7fce3] px-2 py-0.5 text-xs font-medium text-wa-tealDark">
                    {m.interests} interests
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-wa-textPrimary">Top categories by demand</h2>
          {data.top_categories.length === 0 ? (
            <AdminEmpty label="No data" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_categories} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#667781' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#667781' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e9edef', fontSize: 12 }} />
                  <Bar dataKey="count" name="Searches" fill="#128c7e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-wa-textPrimary">Reply types</h2>
          {data.reply_types.length === 0 ? (
            <AdminEmpty label="No data" />
          ) : (
            <ul className="space-y-2">
              {data.reply_types.map((r) => {
                const max = data.reply_types[0]?.count ?? 1;
                return (
                  <li key={r.type}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-wa-textPrimary">{r.type.replace('_', ' ')}</span>
                      <span className="text-xs text-wa-textSecondary">{r.count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-wa-panelAlt">
                      <div
                        className="h-full rounded-full bg-wa-header"
                        style={{ width: `${Math.round((r.count / max) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
