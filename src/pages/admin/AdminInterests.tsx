import React, { useCallback, useEffect, useState } from 'react';
import { listAdminInterests } from '../../api';
import { AdminInterestItem } from '../../types';
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, Pagination, StatusBadge } from './AdminUi';
import { formatDateTime, formatPrice } from './adminFormat';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'responded', label: 'Responded' },
];

export function AdminInterests() {
  const [items, setItems] = useState<AdminInterestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(25);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAdminInterests({ page, size, status: status || undefined, q: query || undefined })
      .then((res) => {
        setItems(res.interests);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load interest events'))
      .finally(() => setLoading(false));
  }, [page, size, status, query]);

  useEffect(load, [load]);

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Interest events" subtitle="Buyers telling sellers they're interested in a product" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
          placeholder="Search by buyer phone…"
          className="w-full max-w-xs rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <AdminError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <AdminEmpty label="No interest events found" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-wa-border bg-wa-panel shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium">Result code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wa-border">
                {items.map((ie) => (
                  <tr key={ie.id} className="hover:bg-wa-panelAlt">
                    <td className="px-4 py-3 font-medium text-wa-textPrimary">{ie.buyer_phone}</td>
                    <td className="px-4 py-3">{ie.product?.name ?? `Product #${ie.product?.id ?? '?'}`}</td>
                    <td className="px-4 py-3">{formatPrice(ie.product?.price, ie.product?.currency)}</td>
                    <td className="px-4 py-3 text-xs text-wa-textSecondary">{ie.merchant?.business_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-wa-textSecondary">{ie.result_code ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={ie.status} /></td>
                    <td className="px-4 py-3 text-xs text-wa-textSecondary">{formatDateTime(ie.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} size={size} onPage={setPage} />
        </>
      )}
    </div>
  );
}
