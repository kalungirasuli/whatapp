import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BarChart3Icon, PlusIcon, StoreIcon } from 'lucide-react';
import { ShopItem } from '../types';
import { getShop } from '../api';
import { MerchantDashboard } from '../components/MerchantDashboard';

interface DashboardPageProps {
  shops: ShopItem[];
  onCreateShop: () => void;
}

export function DashboardPage({ shops, onCreateShop }: DashboardPageProps) {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [resolvedShop, setResolvedShop] = useState<ShopItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (shopId) {
      const found = shops.find((shop) => String(shop.id) === shopId);
      if (found) {
        setResolvedShop(found);
        return;
      }
      setLoading(true);
      getShop(Number(shopId))
        .then((shop) => { if (!cancelled) setResolvedShop(shop); })
        .catch(() => { if (!cancelled) setResolvedShop(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else if (shops.length > 0) {
      setResolvedShop(shops[0]);
    } else {
      setResolvedShop(null);
    }
    return () => { cancelled = true; };
  }, [shopId, shops]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-panelAlt text-sm text-wa-textSecondary">
        Loading shop…
      </div>
    );
  }

  if (resolvedShop) {
    return <MerchantDashboard merchant={resolvedShop} onBack={() => navigate('/')} />;
  }

  const showPicker = !shopId && shops.length > 1;

  return (
    <div className="flex h-full min-h-0 flex-col bg-wa-panelAlt">
      <header className="flex shrink-0 items-center gap-3 border-b border-wa-border bg-wa-panel px-4 py-3 shadow-sm md:px-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to chat"
          className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wa-header text-white">
          <BarChart3Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-wa-textPrimary">Shop dashboard</h1>
          <p className="truncate text-xs text-wa-textSecondary">
            {showPicker ? 'Choose a shop to inspect' : 'No shop on this account yet'}
          </p>
        </div>
      </header>

      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {showPicker ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/${shop.id}`)}
                  className="flex items-center gap-3 rounded-2xl border border-wa-border bg-wa-panel p-5 text-left shadow-sm transition-colors hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-wa-header/10 text-wa-header">
                    <StoreIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-wa-textPrimary">{shop.business_name}</h2>
                    <p className="truncate text-xs text-wa-textSecondary">{shop.category}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-wa-panel text-wa-header shadow-sm">
                <BarChart3Icon className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-semibold text-wa-textPrimary">Create a shop to see your dashboard</h2>
              <p className="mt-1 max-w-sm text-sm text-wa-textSecondary">
                Your business insights appear here once your shop is live.
              </p>
              <button
                type="button"
                onClick={onCreateShop}
                className="mt-5 flex items-center gap-2 rounded-lg bg-wa-header px-5 py-2.5 text-sm font-semibold text-white hover:bg-wa-headerHover focus:outline-none focus:ring-2 focus:ring-wa-green focus:ring-offset-2">
                <PlusIcon className="h-4 w-4" />
                Create a shop
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
