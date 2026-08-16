import React, { useCallback, useEffect, useState } from 'react';
import { adminMerchantAction, getAdminMerchant, listAdminMerchants, listAdminProducts } from '../../api';
import { AdminMerchantItem, AdminMerchantDetail, AdminProductItem } from '../../types';
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
import { formatDateTime, formatPrice } from './adminFormat';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'banned', label: 'Banned' },
];

export function AdminMerchants() {
  const [items, setItems] = useState<Array<AdminMerchantItem | AdminProductItem>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(25);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'merchants' | 'products'>('merchants');
  const [selected, setSelected] = useState<AdminMerchantDetail | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { page, size, status: status || undefined, q: query || undefined };
    (tab === 'merchants' ? listAdminMerchants(params) : listAdminProducts(params))
      .then((res) => {
        setItems(
          (res as { merchants: AdminMerchantItem[]; total: number }).merchants ??
            (res as { products: AdminProductItem[]; total: number }).products,
        );
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page, size, status, query, tab]);

  useEffect(load, [load]);

  const openDetail = (merchant: AdminMerchantItem) => {
    getAdminMerchant(merchant.id)
      .then(setSelected)
      .catch(() => undefined);
  };

  const runAction = async (merchant: AdminMerchantItem, action: 'suspend' | 'reactivate' | 'ban') => {
    if (busy) return;
    setBusy(true);
    try {
      await adminMerchantAction(merchant.id, action);
      await load();
      if (selected) {
        getAdminMerchant(selected.id).then(setSelected).catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Merchants & products" subtitle="Every seller and their catalog with moderation controls" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-wa-border bg-wa-panel">
          <button
            type="button"
            onClick={() => { setTab('merchants'); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium focus:outline-none ${tab === 'merchants' ? 'bg-[#e7fce3] text-wa-tealDark' : 'text-wa-textSecondary hover:bg-wa-panelAlt'}`}>
            Merchants
          </button>
          <button
            type="button"
            onClick={() => { setTab('products'); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium focus:outline-none ${tab === 'products' ? 'bg-[#e7fce3] text-wa-tealDark' : 'text-wa-textSecondary hover:bg-wa-panelAlt'}`}>
            Products
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
          placeholder={tab === 'merchants' ? 'Search name or phone…' : 'Search product or brand…'}
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
        <AdminEmpty label="Nothing found" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-wa-border bg-wa-panel shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                  {tab === 'merchants' ? (
                    <>
                      <th className="px-4 py-3 font-medium">Merchant</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Products</th>
                      <th className="px-4 py-3 font-medium">Interests</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Merchant</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-wa-border">
                {tab === 'merchants'
                  ? items.map((m) => {
                      if ('business_name' in m) {
                        return (
                          <tr key={m.id} className="hover:bg-wa-panelAlt">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => openDetail(m)}
                                className="text-left focus:outline-none">
                                <p className="font-medium text-wa-header hover:underline">{m.business_name}</p>
                                <p className="text-xs text-wa-textSecondary">{m.phone_number}</p>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-xs text-wa-textSecondary">{m.category}</td>
                            <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                            <td className="px-4 py-3">{m.product_count}</td>
                            <td className="px-4 py-3">{m.interest_count}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {m.status !== 'suspended' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => runAction(m, 'suspend')}
                                    className="rounded-lg border border-wa-border px-2 py-1 text-xs font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:opacity-40">
                                    Suspend
                                  </button>
                                )}
                                {m.status === 'suspended' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => runAction(m, 'reactivate')}
                                    className="rounded-lg bg-[#e7fce3] px-2 py-1 text-xs font-medium text-wa-tealDark hover:bg-[#d0f8c8] disabled:opacity-40">
                                    Reactivate
                                  </button>
                                )}
                                {m.status !== 'banned' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => runAction(m, 'ban')}
                                    className="rounded-lg bg-[#fdecea] px-2 py-1 text-xs font-medium text-[#c92a2a] hover:bg-[#fbdbd9] disabled:opacity-40">
                                    Ban
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    })
                  : items.map((p) => {
                      if (!('price' in p)) return null;
                      return (
                        <tr key={p.id} className="hover:bg-wa-panelAlt">
                          <td className="px-4 py-3">
                            <p className="font-medium text-wa-textPrimary">{p.name}</p>
                            {p.brand && <p className="text-xs text-wa-textSecondary">{p.brand}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-wa-textSecondary">{p.merchant_name ?? `Merchant #${p.merchant_id}`}</td>
                          <td className="px-4 py-3">{formatPrice(p.price, p.currency)}</td>
                          <td className="px-4 py-3">{p.stock_qty}</td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-3 text-xs text-wa-textSecondary">{formatDateTime(p.created_at)}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} size={size} onPage={setPage} />
        </>
      )}

      {selected && (
        <Modal title={`${selected.business_name} · ${selected.phone_number}`} onClose={() => setSelected(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-wa-border p-3">
              <DetailRow label="Category" value={selected.category} />
              <DetailRow label="Status" value={<StatusBadge status={selected.status} />} />
              <DetailRow label="Products" value={selected.product_count} />
              <DetailRow label="Interest events" value={selected.interest_count} />
              <DetailRow label="Joined" value={formatDateTime(selected.created_at)} />
              {selected.location_lat != null && (
                <DetailRow label="Location" value={`${selected.location_lat}, ${selected.location_lng ?? ''}`} />
              )}
            </div>
            <div className="flex items-end gap-2">
              {selected.status !== 'suspended' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runAction(selected, 'suspend')}
                  className="flex-1 rounded-lg border border-wa-border px-3 py-2 text-sm font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:opacity-40">
                  Suspend
                </button>
              )}
              {selected.status === 'suspended' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runAction(selected, 'reactivate')}
                  className="flex-1 rounded-lg bg-wa-header px-3 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover disabled:opacity-40">
                  Reactivate
                </button>
              )}
              {selected.status !== 'banned' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => runAction(selected, 'ban')}
                  className="flex-1 rounded-lg bg-[#c92a2a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#b02020] disabled:opacity-40">
                  Ban
                </button>
              )}
            </div>
          </div>

          <h3 className="mt-5 mb-2 font-semibold text-wa-textPrimary">Products ({selected.products.length})</h3>
          {selected.products.length === 0 ? (
            <AdminEmpty label="No products" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-wa-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Price</th>
                    <th className="px-3 py-2 font-medium">Stock</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wa-border">
                  {selected.products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-wa-textPrimary">{p.name}</p>
                        {p.brand && <p className="text-xs text-wa-textSecondary">{p.brand}</p>}
                      </td>
                      <td className="px-3 py-2">{formatPrice(p.price, p.currency)}</td>
                      <td className="px-3 py-2">{p.stock_qty}</td>
                      <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="mt-5 mb-2 font-semibold text-wa-textPrimary">Interest events ({selected.interest_count})</h3>
          {selected.interests.length === 0 ? (
            <AdminEmpty label="No interest events" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-wa-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                    <th className="px-3 py-2 font-medium">Buyer</th>
                    <th className="px-3 py-2 font-medium">Product ID</th>
                    <th className="px-3 py-2 font-medium">Result code</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wa-border">
                  {selected.interests.map((ie) => (
                    <tr key={ie.id}>
                      <td className="px-3 py-2">{ie.buyer_phone}</td>
                      <td className="px-3 py-2">#{ie.product_id}</td>
                      <td className="px-3 py-2 text-xs text-wa-textSecondary">{ie.result_code ?? '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={ie.status} /></td>
                      <td className="px-3 py-2 text-xs text-wa-textSecondary">{formatDateTime(ie.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
