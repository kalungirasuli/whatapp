import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3Icon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MessagesSquareIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
} from 'lucide-react';
import { AuthUser } from '../../types';

const NAV_ITEMS = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboardIcon },
  { to: '/admin/users', end: false, label: 'Users', icon: UsersIcon },
  { to: '/admin/merchants', end: false, label: 'Merchants & products', icon: StoreIcon },
  { to: '/admin/interactions', end: false, label: 'Chat interactions', icon: MessagesSquareIcon },
  { to: '/admin/interests', end: false, label: 'Interest events', icon: ShoppingBagIcon },
  { to: '/admin/analytics', end: false, label: 'Analytics', icon: BarChart3Icon },
  { to: '/admin/accounts', end: false, label: 'Admin accounts', icon: ShieldCheckIcon },
];

export function AdminLayout({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-wa-panelAlt p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-wa-header text-white">
          <ShieldCheckIcon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-wa-textPrimary">Admin access required</h2>
          <p className="mt-1 max-w-sm text-sm text-wa-textSecondary">
            You must be signed in with an admin account to view the system dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-wa-panelAlt md:flex-row">
      <aside className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-wa-border bg-wa-panel p-2 shadow-sm md:w-56 md:flex-col md:border-b-0 md:border-r md:p-3">
        <div className="hidden items-center gap-2 px-2 pb-3 pt-1 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wa-header text-white">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-wa-textPrimary">Admin console</p>
            <p className="truncate text-xs text-wa-textSecondary">{user.name ?? user.phone}</p>
          </div>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-y-auto">
          {NAV_ITEMS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-wa-green ${
                  isActive ? 'bg-[#e7fce3] text-wa-tealDark' : 'text-wa-textPrimary hover:bg-wa-panelAlt'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden gap-1 border-t border-wa-border pt-2 md:flex md:flex-col">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-wa-textPrimary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            <HistoryIcon className="h-4 w-4 shrink-0" />
            Back to app
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#c92a2a] hover:bg-[#fdecea] focus:outline-none focus:ring-2 focus:ring-wa-green">
            <LogOutIcon className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </div>
      </aside>
      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
