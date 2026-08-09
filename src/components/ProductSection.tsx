import React, { useState } from 'react';
import { ArrowRightIcon, BoxIcon, CopyIcon, HeartIcon, MapPinIcon, StarIcon } from 'lucide-react';
import { ProductResult, SearchSection } from '../types';

interface ProductSectionProps {
  sections: SearchSection[];
  resultCode?: string;
  followUp?: { type: string; topic: string; image_family: string; prompt: string };
  interestedIds?: Set<number>;
  onFollowUp: (prompt: string) => void;
  onInterest: (productId: number, name: string, resultCode?: string) => void;
}

export function ProductSection({ sections, resultCode, followUp, interestedIds, onFollowUp, onInterest }: ProductSectionProps) {
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

  const sectionPriority = (label: string) => {
    const normalized = label.toLowerCase();
    if (normalized.includes('exact')) return 0;
    if (normalized.includes('matching')) return 1;
    if (normalized.includes('related')) return 2;
    return 3;
  };

  const partition = (results: ProductResult[]) => {
    const sortedResults = [...results].sort((a, b) => b.score - a.score);
    if (sortedResults.length <= 1) {
      return { top: sortedResults, related: [] };
    }
    return { top: [sortedResults[0]], related: sortedResults.slice(1) };
  };

  const sortedSections = [...sections].sort(
    (a, b) => sectionPriority(a.label) - sectionPriority(b.label),
  );

  return (
    <div className="space-y-3 px-1.5 pt-1">
      {sortedSections.map((section) => {
        const { top, related } = partition(section.results);
        return (
          <section key={section.label} className="space-y-2">
            {top.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-wa-green">
                  Closest match
                </p>
                <ClosestMatchCard result={top[0]} resultCode={resultCode} interestedIds={interestedIds} onInterest={onInterest} />
              </div>
            )}
            {related.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-wa-textSecondary">
                  Related matches
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {related.map((result) => (
                    <ProductCard key={result.product_id} result={result} resultCode={resultCode} interestedIds={interestedIds} onInterest={onInterest} />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}

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

function ClosestMatchCard({ result, resultCode, interestedIds, onInterest }: { result: ProductResult; resultCode?: string; interestedIds?: Set<number>; onInterest: (id: number, name: string, resultCode?: string) => void }) {
  const imageUrl = result.images.find((img) => img.is_primary)?.url ?? result.images[0]?.url;
  const price = formatPrice(result.price, result.currency);
  const isLiked = interestedIds?.has(result.product_id) ?? false;

  return (
    <article className="overflow-hidden rounded-xl border-2 border-wa-green bg-white shadow-md">
      <div className="relative">
        {imageUrl ? (
          <img src={imageUrl} alt={result.name} loading="lazy" className="max-h-80 w-full rounded-md object-contain bg-gray-50" />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-wa-header/10 text-wa-header">
            <BoxIcon className="h-10 w-10" />
          </div>
        )}
        {isLiked && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-wa-header px-2.5 py-1 text-xs font-semibold text-white shadow-panel">
            <HeartIcon className="h-3.5 w-3.5 fill-current" />
            Liked
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold text-wa-textPrimary">{result.name}</h3>
        <p className="text-sm text-wa-textSecondary mt-0.5">
          {result.merchant?.business_name ?? result.category}
        </p>
        <p className="text-lg font-bold text-wa-header mt-1">{price}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-[#e7fce3] px-2 py-0.5 text-xs font-medium text-wa-tealDark">
            <StarIcon className="mr-1 inline h-3 w-3" />
            Closest match
          </span>
          {typeof result.distance_km === 'number' && (
            <span className="flex items-center gap-0.5 text-xs text-wa-textSecondary">
              <MapPinIcon className="h-3 w-3" /> {formatDistance(result.distance_km)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onInterest(result.product_id, result.name, resultCode)}
          className="mt-3 w-full rounded-lg bg-wa-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebd53] focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
          {isLiked ? 'Liked — contact seller' : 'I&apos;m interested'}
        </button>
      </div>
    </article>
  );
}

function ProductCard({ result, resultCode, interestedIds, onInterest }: { result: ProductResult; resultCode?: string; interestedIds?: Set<number>; onInterest: (id: number, name: string, resultCode?: string) => void }) {
  const imageUrl = result.images.find((img) => img.is_primary)?.url ?? result.images[0]?.url;
  const price = formatPrice(result.price, result.currency);
  const isLiked = interestedIds?.has(result.product_id) ?? false;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-wa-border bg-wa-panel">
      {imageUrl ? (
        <img src={imageUrl} alt={result.name} loading="lazy" className="max-h-60 w-full rounded-md object-contain bg-gray-50" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-wa-header/10 text-wa-header">
          <BoxIcon className="h-8 w-8" />
        </div>
      )}
      <div className="flex flex-col p-3">
        <h3 className="text-sm font-semibold text-wa-textPrimary leading-snug">{result.name}</h3>
        <p className="mt-0.5 text-xs text-wa-textSecondary">
          {result.merchant?.business_name ?? result.category}
        </p>
        <p className="mt-1 text-sm font-bold text-wa-header">{price}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {result.match_label && (
            <span className="rounded-full bg-[#e7fce3] px-1.5 py-0.5 text-[10px] font-medium text-wa-tealDark">
              {result.match_label}
            </span>
          )}
          {isLiked && (
            <span className="flex items-center gap-0.5 rounded-full bg-wa-header px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <HeartIcon className="h-2.5 w-2.5 fill-current" />
              Liked
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
            onClick={() => onInterest(result.product_id, result.name, resultCode)}
            className="text-xs font-medium text-wa-header hover:underline focus:outline-none focus:ring-2 focus:ring-wa-green">
            {isLiked ? 'Liked' : 'I&apos;m interested'}
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
