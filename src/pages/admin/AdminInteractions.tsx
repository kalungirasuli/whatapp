import React, { useCallback, useEffect, useState } from 'react';
import { getAdminInteraction, listAdminInteractions } from '../../api';
import { AdminInteractionItem } from '../../types';
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  DetailRow,
  Modal,
  Pagination,
  StatusBadge,
} from './AdminUi';
import { formatDateTime } from './adminFormat';

const DAYS_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export function AdminInteractions() {
  const [items, setItems] = useState<AdminInteractionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(25);
  const [query, setQuery] = useState('');
  const [days, setDays] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminInteractionItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAdminInteractions({ page, size, q: query || undefined, days: days ? Number(days) : undefined })
      .then((res) => {
        setItems(res.interactions);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load interactions'))
      .finally(() => setLoading(false));
  }, [page, size, query, days]);

  useEffect(load, [load]);

  const openDetail = (item: AdminInteractionItem) => {
    getAdminInteraction(item.id).then(setSelected).catch(() => setSelected(item));
  };

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Chat interactions" subtitle="Every turn with the retail assistant — what users asked and how the system replied" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
          placeholder="Search by phone number…"
          className="w-full max-w-xs rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        />
        <select
          value={days}
          onChange={(e) => { setDays(e.target.value); setPage(1); }}
          className="rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        >
          {DAYS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <AdminError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <AdminEmpty label="No interactions found" />
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-2xl border border-wa-border bg-wa-panel shadow-sm">
            <ul className="divide-y divide-wa-border">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-wa-panelAlt focus:bg-wa-panelAlt focus:outline-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-wa-header">{item.phone_number}</span>
                      <StatusBadge status={item.user_message_type} />
                      {item.reply_type && <StatusBadge status={item.reply_type} />}
                      {item.result_code && (
                        <span className="rounded-full bg-[#ede9fe] px-2 py-0.5 text-xs font-medium text-[#6d28d9]">
                          ref {item.result_code}
                        </span>
                      )}
                      <span className="ml-auto shrink-0 text-xs text-wa-textSecondary">
                        {formatDateTime(item.created_at)}
                        {item.latency_ms != null ? ` · ${item.latency_ms}ms` : ''}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-wa-textPrimary">{item.user_text ?? item.response_text ?? '—'}</p>
                    {item.image_count > 0 && (
                      <p className="text-xs text-wa-textSecondary">{item.image_count} image(s) attached</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Pagination page={page} total={total} size={size} onPage={setPage} />
        </>
      )}

      {selected && (
        <Modal title={`Interaction #${selected.id}`} onClose={() => setSelected(null)} wide>
          <DetailRow label="Phone" value={selected.phone_number} />
          <DetailRow label="When" value={formatDateTime(selected.created_at)} />
          <DetailRow label="Input type" value={selected.user_message_type} />
          <DetailRow label="Reply type" value={selected.reply_type ?? '—'} />
          <DetailRow label="Result code" value={selected.result_code ?? '—'} />
          <DetailRow label="Latency" value={selected.latency_ms != null ? `${selected.latency_ms} ms` : '—'} />
          <DetailRow label="Image count" value={selected.image_count} />
          <DetailRow label="User message" value={selected.user_text ?? '—'} />
          <DetailRow label="Image description" value={selected.image_description ?? '—'} />
          <DetailRow label="Response" value={selected.response_text ?? '—'} />
          <DetailRow label="Topic" value={selected.text_topic ?? selected.text_family ?? selected.image_family ?? '—'} />

          {selected.nlu_intents.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-wa-textSecondary">NLU intents</p>
              <pre className="wa-scroll max-h-48 overflow-auto rounded-lg bg-wa-panelAlt p-3 text-xs text-wa-textPrimary">
                {JSON.stringify(selected.nlu_intents, null, 2)}
              </pre>
            </div>
          )}
          {selected.top_results.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-wa-textSecondary">Top results</p>
              <pre className="wa-scroll max-h-64 overflow-auto rounded-lg bg-wa-panelAlt p-3 text-xs text-wa-textPrimary">
                {JSON.stringify(selected.top_results, null, 2)}
              </pre>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
