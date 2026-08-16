export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function formatPrice(price: number | undefined, currency?: string): string {
  if (price == null) return '—';
  return `${price.toLocaleString()} ${currency ?? 'UGX'}`;
}
