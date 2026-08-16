import React, { useCallback, useEffect, useState } from 'react';
import { banAdminUser, getAdminUser, listAdminUsers, setAdminUserRole, unbanAdminUser } from '../../api';
import { AdminUserDetail, AdminUserItem } from '../../types';
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

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'client', label: 'Client' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'admin', label: 'Admin' },
];

export function AdminUsers() {
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(25);
  const [role, setRole] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<AdminUserDetail | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listAdminUsers({ page, size, role: role || undefined, q: query || undefined })
      .then((res) => {
        setItems(res.users);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, size, role, query]);

  useEffect(load, [load]);

  const openDetail = (user: AdminUserItem) => {
    getAdminUser(user.id)
      .then(setSelected)
      .catch(() => setSelected({ ...user, interests_count: 0, interactions_count: 0, merchants: [] }));
  };

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await load();
      if (selected) {
        getAdminUser(selected.id).then(setSelected).catch(() => undefined);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <AdminPageHeader title="Users" subtitle="Every account on the platform, with roles and moderation controls" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
          placeholder="Search phone, name or email…"
          className="w-full max-w-xs rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary placeholder:text-wa-textSecondary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary focus:border-wa-header focus:outline-none focus:ring-2 focus:ring-wa-green/30"
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setPage(1); }}
          className="rounded-lg bg-wa-header px-4 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
          Search
        </button>
      </div>

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <AdminError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <AdminEmpty label="No users found" />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-wa-border bg-wa-panel shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-wa-border text-xs uppercase tracking-wide text-wa-textSecondary">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wa-border">
                {items.map((user) => (
                  <tr key={user.id} className="hover:bg-wa-panelAlt">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(user)}
                        className="text-left focus:outline-none">
                        <p className="font-medium text-wa-header hover:underline">{user.name ?? user.phone}</p>
                        <p className="text-xs text-wa-textSecondary">{user.phone}{user.email ? ` · ${user.email}` : ''}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={user.role} /></td>
                    <td className="px-4 py-3">
                      {user.is_banned ? <StatusBadge status="banned" /> : user.is_verified ? <StatusBadge status="active" /> : <span className="text-xs text-wa-textSecondary">unverified</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-wa-textSecondary">{formatDateTime(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => setAdminUserRole(user.id, user.role === 'admin' ? 'client' : 'admin'))}
                          className="rounded-lg border border-wa-border px-2 py-1 text-xs font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:opacity-40">
                          {user.role === 'admin' ? 'Demote' : 'Make admin'}
                        </button>
                        {user.is_banned ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(() => unbanAdminUser(user.id))}
                            className="rounded-lg bg-[#e7fce3] px-2 py-1 text-xs font-medium text-wa-tealDark hover:bg-[#d0f8c8] disabled:opacity-40">
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(() => banAdminUser(user.id, 'Moderation action'))}
                            className="rounded-lg bg-[#fdecea] px-2 py-1 text-xs font-medium text-[#c92a2a] hover:bg-[#fbdbd9] disabled:opacity-40">
                            Ban
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} size={size} onPage={setPage} />
        </>
      )}

      {selected && (
        <Modal title={`User · ${selected.name ?? selected.phone}`} onClose={() => setSelected(null)}>
          <DetailRow label="Phone" value={selected.phone} />
          <DetailRow label="Name" value={selected.name ?? '—'} />
          <DetailRow label="Email" value={selected.email ?? '—'} />
          <DetailRow label="Role" value={<StatusBadge status={selected.role} />} />
          <DetailRow label="Verified" value={selected.is_verified ? 'Yes' : 'No'} />
          <DetailRow label="Banned" value={selected.is_banned ? 'Yes' : 'No'} />
          <DetailRow label="Joined" value={formatDateTime(selected.created_at)} />
          <DetailRow label="Last active" value={formatDateTime(selected.last_active_at)} />
          <DetailRow label="Chat interactions" value={selected.interactions_count} />
          <DetailRow label="Interest events" value={selected.interests_count} />
          <DetailRow
            label="Merchants"
            value={
              selected.merchants.length === 0 ? (
                'None'
              ) : (
                <span className="flex flex-wrap justify-end gap-1.5">
                  {selected.merchants.map((m) => (
                    <span key={m.id} className="rounded-full bg-wa-panelAlt px-2 py-0.5 text-xs text-wa-textPrimary">
                      {m.business_name} <StatusBadge status={m.status} />
                    </span>
                  ))}
                </span>
              )
            }
          />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => setAdminUserRole(selected.id, selected.role === 'admin' ? 'client' : 'admin'))}
              className="flex-1 rounded-lg border border-wa-border px-3 py-2 text-sm font-medium text-wa-textPrimary hover:bg-wa-panelAlt disabled:opacity-40">
              {selected.role === 'admin' ? 'Demote from admin' : 'Promote to admin'}
            </button>
            {selected.is_banned ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => unbanAdminUser(selected.id))}
                className="flex-1 rounded-lg bg-wa-header px-3 py-2 text-sm font-semibold text-white hover:bg-wa-headerHover disabled:opacity-40">
                Unban user
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => banAdminUser(selected.id))}
                className="flex-1 rounded-lg bg-[#c92a2a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#b02020] disabled:opacity-40">
                Ban user
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
