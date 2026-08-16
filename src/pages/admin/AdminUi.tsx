import React, { ReactNode } from 'react';

export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-wa-border bg-wa-panel px-4 py-3 shadow-sm md:px-5">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold text-wa-textPrimary">{title}</h1>
        {subtitle && <p className="truncate text-xs text-wa-textSecondary">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'green' | 'red' | 'amber' }) {
  const toneClass =
    tone === 'green' ? 'text-wa-header' : tone === 'red' ? 'text-[#c92a2a]' : tone === 'amber' ? 'text-[#b45309]' : 'text-wa-textPrimary';
  return (
    <div className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-wa-textSecondary">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-wa-textSecondary">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-[#e7fce3] text-wa-tealDark',
    approved: 'bg-[#e7fce3] text-wa-tealDark',
    suspended: 'bg-[#fef3c7] text-[#b45309]',
    banned: 'bg-[#fdecea] text-[#c92a2a]',
    inactive: 'bg-wa-panelAlt text-wa-textSecondary',
    pending_moderation: 'bg-[#ede9fe] text-[#6d28d9]',
    sent: 'bg-[#e7fce3] text-wa-tealDark',
    responded: 'bg-[#dbeafe] text-[#1d4ed8]',
    client: 'bg-wa-panelAlt text-wa-textSecondary',
    merchant: 'bg-[#ede9fe] text-[#6d28d9]',
    admin: 'bg-[#dbeafe] text-[#1d4ed8]',
    in: 'bg-[#e7fce3] text-wa-tealDark',
    out: 'bg-[#dbeafe] text-[#1d4ed8]',
  };
  const cls = map[status] ?? 'bg-wa-panelAlt text-wa-textSecondary';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function AdminLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-wa-textSecondary">{label}</div>
  );
}

export function AdminEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-wa-textSecondary">{label}</div>
  );
}

export function AdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="rounded-lg bg-[#fdecea] px-3 py-2 text-xs text-[#c92a2a]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-wa-border bg-wa-panel px-4 py-2 text-sm font-medium text-wa-textPrimary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
          Retry
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-wa-textSecondary">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-wa-border bg-wa-panel px-3 py-1.5 font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:cursor-not-allowed disabled:opacity-40">
          Prev
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-wa-border bg-wa-panel px-3 py-1.5 font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:cursor-not-allowed disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} flex-col overflow-hidden rounded-2xl bg-wa-panel shadow-panel`}>
        <div className="flex items-center justify-between border-b border-wa-border px-4 py-3">
          <h2 className="truncate font-semibold text-wa-textPrimary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            ✕
          </button>
        </div>
        <div className="wa-scroll min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-wa-border py-2 last:border-0">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-wa-textSecondary">{label}</span>
      <span className="min-w-0 break-words text-right text-sm text-wa-textPrimary">{value}</span>
    </div>
  );
}
