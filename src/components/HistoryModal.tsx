import React from 'react';
import { ClockIcon, HeartIcon, MapPinIcon, XIcon } from 'lucide-react';
import { HistoryEntry, InterestEntry } from '../types';

interface HistoryModalProps {
  interests: InterestEntry[];
  history: HistoryEntry[];
  onClose: () => void;
  onRemoveInterest: (productId: number) => void;
}

export function HistoryModal({ interests, history, onClose, onRemoveInterest }: HistoryModalProps) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="history-title" className="fixed inset-0 z-50 flex items-end bg-black/45 sm:items-center sm:justify-center sm:p-6">
      <div className="wa-scroll flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-[28px] bg-wa-panel shadow-panel sm:rounded-[28px]">
        <header className="flex items-center justify-between border-b border-wa-border px-5 py-4">
          <div>
            <h2 id="history-title" className="font-semibold text-wa-textPrimary">Your activity</h2>
            <p className="text-xs text-wa-textSecondary">Saved interests and past searches</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close activity" className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green"><XIcon className="h-5 w-5" /></button>
        </header>

        <div className="space-y-6 px-5 py-5">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <HeartIcon className="h-4 w-4 text-wa-header" />
              <h3 className="text-sm font-semibold text-wa-textPrimary">Interested products</h3>
              <span className="rounded-full bg-wa-panelAlt px-1.5 py-0.5 text-[10px] text-wa-textSecondary">{interests.length}</span>
            </div>
            {interests.length === 0 ? (
              <p className="rounded-xl bg-wa-panelAlt px-3 py-3 text-sm text-wa-textSecondary">
                No interests yet — tap “I&apos;m interested” on any product in a chat.
              </p>
            ) : (
              <ul className="space-y-2">
                {interests.map((interest) => {
                  const imageUrl = interest.product.images[0]?.url;
                  return (
                    <li key={interest.id} className="flex items-center gap-3 rounded-xl border border-wa-border bg-wa-panel p-2.5">
                      {imageUrl ? <img src={imageUrl} alt={interest.product.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-wa-header/10 text-wa-header" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-wa-textPrimary">{interest.product.name}</p>
                        <p className="truncate text-xs text-wa-textSecondary">{interest.product.merchant_name} · {interest.product.category}</p>
                        <p className="mt-0.5 text-xs font-semibold text-wa-header">{formatPrice(interest.product.price, interest.product.currency)}</p>
                      </div>
                      <button type="button" onClick={() => onRemoveInterest(interest.product.id)} className="rounded-full p-1.5 text-wa-textSecondary hover:bg-wa-panelAlt hover:text-[#d94841] focus:outline-none focus:ring-2 focus:ring-wa-green" aria-label={`Remove interest in ${interest.product.name}`}><XIcon className="h-4 w-4" /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-wa-header" />
              <h3 className="text-sm font-semibold text-wa-textPrimary">Past searches</h3>
              <span className="rounded-full bg-wa-panelAlt px-1.5 py-0.5 text-[10px] text-wa-textSecondary">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="rounded-xl bg-wa-panelAlt px-3 py-3 text-sm text-wa-textSecondary">
                Your search history will show up here.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {history.map((entry, index) => (
                  <li key={`${entry.ts}-${index}`} className="flex items-center gap-2 rounded-xl bg-wa-panelAlt px-3 py-2.5">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-wa-textSecondary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-wa-textPrimary">{entry.query}</span>
                    <span className="shrink-0 text-[11px] text-wa-textSecondary">{formatTime(entry.ts)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function formatPrice(price: number, currency: string): string {
  if (currency === 'UGX') return `UGX ${price.toLocaleString()}`;
  const symbol = currency === 'KES' ? 'KSh ' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${price.toLocaleString()}`;
}

function formatTime(ts: number): string {
  const seconds = ts < 1e12 ? ts * 1000 : ts;
  const date = new Date(seconds);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
