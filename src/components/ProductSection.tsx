import React, { useState } from 'react';
import { ArrowRightIcon, BoxIcon, CopyIcon, MapPinIcon } from 'lucide-react';
import { ProductResult, SearchSection } from '../types';

interface ProductSectionProps {
  sections: SearchSection[];
  resultCode?: string;
  followUp?: { type: string; topic: string; image_family: string; prompt: string };
  onFollowUp: (prompt: string) => void;
  onInterest: (productId: number, name: string) => void;
}

export function ProductSection({ sections, resultCode, followUp, onFollowUp, onInterest }: ProductSectionProps) {
  const [copied, setCopied] = useState(false);

  const copyResultCode = async () => {
    if (!resultCode) return;
    try {
      await navigator.clipboard.writeText(resultCode);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="space-y-3 px-1.5 pt-1">
      {sections.map((section) => (
        <section key={section.label}>
          <div className="mb-1.5 flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-wa-teal">{section.label}</p>
            <span className="rounded-full bg-wa-panelAlt px-1.5 py-0.5 text-[10px] text-wa-textSecondary">
              {section.total}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {section.results.map((result) => (
              <ProductCard key={result.product_id} result={result} onInterest={onInterest} />
            ))}
          </div>
        </section>
      ))}

      {resultCode && (
        <button
          type="button"
          onClick={() => void copyResultCode()}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-dashed border-wa-border bg-wa-panelAlt/60 px-3 py-2 text-left hover:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green"
          title="Copy result code — share it and anyone can recall this search">
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wide text-wa-textSecondary">Result code</span>
            <span className="block font-mono text-sm font-semibold text-wa-header">{resultCode}</span>
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-wa-header">
            {copied ? 'Copied' : 'Copy'}
            <CopyIcon className="h-3.5 w-3.5" />
          </span>
        </button>
      )}

      {followUp && (
        <button
          type="button"
          onClick={() => onFollowUp(followUp.prompt)}
          className="flex w-full items-center gap-2 rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-left hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-wide text-wa-textSecondary">Suggested next</span>
            <span className="block truncate text-sm text-wa-textPrimary">{followUp.prompt}</span>
          </span>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-wa-header" />
        </button>
      )}
    </div>
  );
}

function ProductCard({ result, onInterest }: { result: ProductResult; onInterest: (id: number, name: string) => void }) {
  const imageUrl = result.images.find((img) => img.is_primary)?.url ?? result.images[0]?.url;
  const price = formatPrice(result.price, result.currency);

  return (
    <article className="flex overflow-hidden rounded-xl border border-wa-border bg-wa-panel">
      {imageUrl ? (
        <img src={imageUrl} alt={result.name} loading="lazy" className="h-20 w-20 shrink-0 object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-wa-header/10 text-wa-header">
          <BoxIcon className="h-6 w-6" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-medium text-wa-textPrimary">{result.name}</h3>
          <span className="shrink-0 text-sm font-semibold text-wa-header">{price}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-wa-textSecondary">
          {result.merchant?.business_name ?? result.category}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {result.match_label && (
            <span className="rounded-full bg-[#e7fce3] px-1.5 py-0.5 text-[10px] font-medium text-wa-tealDark">
              {result.match_label}
            </span>
          )}
          {typeof result.distance_km === 'number' && (
            <span className="flex items-center gap-0.5 rounded-full bg-wa-panelAlt px-1.5 py-0.5 text-[10px] text-wa-textSecondary">
              <MapPinIcon className="h-2.5 w-2.5" />
              {formatDistance(result.distance_km)}
            </span>
          )}
        </div>
        <div className="mt-auto pt-1.5">
          <button
            type="button"
            onClick={() => onInterest(result.product_id, result.name)}
            className="text-xs font-medium text-wa-header hover:underline focus:outline-none focus:ring-2 focus:ring-wa-green">
            I&apos;m interested
          </button>
        </div>
      </div>
    </article>
  );
}

function formatPrice(price: number, currency: string): string {
  if (currency === 'UGX') return `UGX ${price.toLocaleString()}`;
  const symbol = currency === 'KES' ? 'KSh ' : currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${price.toLocaleString()}`;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
