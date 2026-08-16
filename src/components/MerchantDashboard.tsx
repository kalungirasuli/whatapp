import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangleIcon, ArrowLeftIcon, BarChart3Icon, LightbulbIcon, TrendingUpIcon, UsersIcon, EyeIcon, TargetIcon, PackageIcon, ZapIcon } from 'lucide-react';
import { MerchantAnalyticsOverview, MerchantBuyerAnalytics, MerchantCategoryAnalytics, MerchantProfile, AnalyticsRecommendation, ProductInsight } from '../types';
import { getMerchantAnalytics, getMerchantBuyerAnalytics, getMerchantCategoryAnalytics, getMerchantProductInsights, getMerchantRecommendations } from '../api';

interface MerchantDashboardProps {
  merchant: MerchantProfile;
  onBack: () => void;
}

type Tab = 'overview' | 'category' | 'products' | 'buyers' | 'recommendations';

const tabIcons: Record<Tab, React.ElementType> = {
  overview: BarChart3Icon,
  category: TargetIcon,
  products: PackageIcon,
  buyers: UsersIcon,
  recommendations: LightbulbIcon,
};

export function MerchantDashboard({ merchant, onBack }: MerchantDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<MerchantAnalyticsOverview | null>(null);
  const [category, setCategory] = useState<MerchantCategoryAnalytics | null>(null);
  const [products, setProducts] = useState<ProductInsight[]>([]);
  const [buyers, setBuyers] = useState<MerchantBuyerAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<AnalyticsRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const merchantId = merchant.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getMerchantAnalytics(days, merchantId),
      getMerchantCategoryAnalytics(merchant.category, days, merchantId),
      getMerchantProductInsights(days, merchantId),
      getMerchantRecommendations(days, merchantId),
    ]).then(([overviewData, categoryData, productData, recommendationData]) => {
      if (cancelled) return;
      setOverview(overviewData);
      setCategory(categoryData);
      setProducts(productData.products);
      setRecommendations(recommendationData.recommendations);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Analytics could not be loaded');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [days, merchant.category, merchantId]);

  useEffect(() => {
    if (tab !== 'buyers' || buyers) return;
    getMerchantBuyerAnalytics(days, merchantId).then(setBuyers).catch(() => setBuyers({ period_days: days, unique_buyers: 0, buyers: [] }));
  }, [buyers, days, merchantId, tab]);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'category', label: 'Category' },
    { id: 'products', label: 'Products' },
    { id: 'buyers', label: 'Buyers' },
    { id: 'recommendations', label: 'Actions' },
  ];

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-wa-panelAlt">
      <header className="flex shrink-0 items-center justify-between bg-wa-panelHeader px-4 py-3 md:px-5" style={{borderBottom: '1px solid rgba(42,57,66,0.5)'}}>
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back to chat" className="rounded-full p-2 text-wa-textSecondary transition-colors hover:bg-white/5 hover:text-wa-textPrimary focus:outline-none focus:ring-2 focus:ring-wa-header">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wa-header to-wa-green text-white shadow-glow">
            <BarChart3Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-wa-textPrimary">{merchant.business_name}</p>
            <p className="truncate text-xs text-wa-textSecondary">Business intelligence · {merchant.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(event) => { setDays(Number(event.target.value)); setBuyers(null); }} className="rounded-xl border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary focus:outline-none focus:ring-2 focus:ring-wa-header">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </header>

      <nav className="wa-scroll flex shrink-0 gap-0.5 overflow-x-auto bg-wa-panelHeader px-3 pt-1" style={{borderBottom: '1px solid rgba(42,57,66,0.5)'}}>
        {tabs.map((item) => {
          const Icon = tabIcons[item.id];
          return (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-all ${tab === item.id ? 'bg-wa-panelAlt text-wa-header' : 'text-wa-textSecondary hover:text-wa-textPrimary hover:bg-white/5'}`} style={tab === item.id ? {borderTop: '2px solid #00a884', borderLeft: '1px solid rgba(42,57,66,0.5)', borderRight: '1px solid rgba(42,57,66,0.5)'} : {}}>
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
        <div className="mx-auto max-w-7xl">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} />}
          {!loading && !error && overview && (
            <>
              {tab === 'overview' && <OverviewTab overview={overview} />}
              {tab === 'category' && <CategoryTab category={category} />}
              {tab === 'products' && <ProductsTab products={products} />}
              {tab === 'buyers' && <BuyersTab buyers={buyers} />}
              {tab === 'recommendations' && <RecommendationsTab recommendations={recommendations} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const metricIcons = ['💼', '👁️', '📈', '👥', '⭐', '📦'];

function OverviewTab({ overview }: { overview: MerchantAnalyticsOverview }) {
  const cards: Array<[string, React.ReactNode, string, string]> = [
    ['Interests', overview.summary.interests, 'Buyer actions', 'from-emerald-500/20 to-emerald-600/5'],
    ['Impressions', overview.summary.search_impressions, 'Your products appeared', 'from-blue-500/20 to-blue-600/5'],
    ['Conversion', `${overview.summary.conversion_rate}%`, 'Impression to interest', 'from-purple-500/20 to-purple-600/5'],
    ['Unique buyers', overview.summary.unique_buyers, 'People interested', 'from-amber-500/20 to-amber-600/5'],
    ['Avg match', overview.summary.average_match_score.toFixed(2), 'Ranking score', 'from-pink-500/20 to-pink-600/5'],
    ['Active', overview.summary.active_products, `of ${overview.summary.products} listed`, 'from-cyan-500/20 to-cyan-600/5'],
  ];
  return <>
    <SectionHeading eyebrow="Business overview" title="What is happening in your shop" description="Real buyer searches, product visibility, and interest activity from the selected period." />
    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">{cards.map(([label, value, hint, gradient], i) => <MetricCard key={label} label={label} value={value} hint={hint} gradient={gradient} emoji={metricIcons[i]} />)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <ChartCard title="Interest & visibility trend" description="Daily appearances vs buyer interest.">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={overview.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00a884" stopOpacity={0.35} /><stop offset="95%" stopColor="#00a884" stopOpacity={0} /></linearGradient>
              <linearGradient id="impressionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f2a93b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f2a93b" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,57,66,0.5)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8696a0' }} tickFormatter={(value) => String(value).slice(5)} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} />
            <Area type="monotone" dataKey="impressions" stroke="#00a884" fill="url(#interestFill)" name="Impressions" strokeWidth={2} />
            <Area type="monotone" dataKey="interests" stroke="#f2a93b" fill="url(#impressionFill)" name="Interests" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Top products" description="Products earning the most buyer attention.">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={overview.top_products.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,57,66,0.5)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8696a0' }} />
            <YAxis dataKey="name" type="category" width={72} tick={{ fontSize: 11, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} />
            <Bar dataKey="interests" fill="url(#barGradient)" radius={[0, 5, 5, 0]} name="Interests">
              <defs><linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#008069" /><stop offset="100%" stopColor="#25d366" /></linearGradient></defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </>;
}

function CategoryTab({ category }: { category: MerchantCategoryAnalytics | null }) {
  if (!category) return <ErrorState message="Category analytics are not available yet." />;
  const attributeData = Object.entries(category.attributes).flatMap(([key, values]) => Object.entries(values).map(([name, count]) => ({ name: `${key}: ${name}`, count })));
  return <>
    <SectionHeading eyebrow={`Category · ${category.category}`} title="Demand in your market" description="Compare your visibility with what buyers are asking for." />
    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard label="Products" value={category.market.products} hint="Available in market" gradient="from-blue-500/20 to-blue-600/5" />
      <MetricCard label="Sellers" value={category.market.merchants} hint="Competing" gradient="from-purple-500/20 to-purple-600/5" />
      <MetricCard label="Searches" value={category.market.searches} hint={`Last ${category.period_days}d`} gradient="from-emerald-500/20 to-emerald-600/5" />
      <MetricCard label="Impressions" value={category.market.impressions} hint="Results shown" gradient="from-amber-500/20 to-amber-600/5" />
      <MetricCard label="Visibility" value={`${category.market.merchant_impression_share}%`} hint="Your share" gradient="from-cyan-500/20 to-cyan-600/5" />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <ChartCard title="Buyer attributes" description="Terms extracted from real search requests.">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attributeData.slice(0, 12)} layout="vertical" margin={{ top: 8, right: 12, left: 22, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,57,66,0.5)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8696a0' }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} />
            <Bar dataKey="count" fill="#5b8def" radius={[0, 5, 5, 0]} name="Requests" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Price position" description="Your average price vs the category average.">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ name: 'Market', value: category.prices.average_market_price }, { name: 'Your shop', value: category.prices.your_average_price }]} margin={{ top: 20, right: 20, left: 10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,57,66,0.5)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8696a0' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} formatter={(value) => `UGX ${Number(value).toLocaleString()}`} />
            <Bar dataKey="value" fill="#f2a93b" radius={[5, 5, 0, 0]} name="Average price" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </>;
}

function ProductsTab({ products }: { products: ProductInsight[] }) {
  return <>
    <SectionHeading eyebrow="Product performance" title="Which listings are working" description="Visibility, ranking, and conversion for each product." />
    <div className="grid gap-3 lg:grid-cols-2">
      {products.map((product) => <ProductInsightCard key={product.product_id} product={product} />)}
    </div>
  </>;
}

function BuyersTab({ buyers }: { buyers: MerchantBuyerAnalytics | null }) {
  if (!buyers) return <LoadingState />;
  const data = buyers.buyers.slice(0, 10).map((buyer) => ({ name: buyer.phone.slice(-9), interests: buyer.interests }));
  return <>
    <SectionHeading eyebrow="Buyer intelligence" title="Who is showing interest" description="Returning buyers and concentration from real activity." />
    <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3">
      <MetricCard label="Unique buyers" value={buyers.unique_buyers} hint={`Last ${buyers.period_days}d`} gradient="from-emerald-500/20 to-emerald-600/5" />
      <MetricCard label="Returning" value={buyers.buyers.filter((buyer) => buyer.interests > 1).length} hint="More than one interest" gradient="from-purple-500/20 to-purple-600/5" />
      <MetricCard label="Avg interests" value={(buyers.buyers.reduce((sum, buyer) => sum + buyer.interests, 0) / Math.max(1, buyers.unique_buyers)).toFixed(1)} hint="Per buyer" gradient="from-amber-500/20 to-amber-600/5" />
    </div>
    <div className="mt-4">
      <ChartCard title="Interests by buyer" description="Prioritize follow-up conversations.">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,57,66,0.5)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8696a0' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} />
            <Bar dataKey="interests" fill="#00a884" radius={[5, 5, 0, 0]} name="Interests" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </>;
}

function RecommendationsTab({ recommendations }: { recommendations: AnalyticsRecommendation[] }) {
  return <>
    <SectionHeading eyebrow="Action plan" title="How to improve your shop" description="Generated from catalog quality, visibility, ranking, stock, and buyer behavior." />
    <div className="grid gap-3 md:grid-cols-2">
      {recommendations.map((item, index) => (
        <article key={`${item.type}-${item.product_id ?? index}`} className="card-hover rounded-2xl p-4 shadow-card" style={{background: 'linear-gradient(145deg, #182229, #111b21)', border: '1px solid rgba(42,57,66,0.5)'}}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.priority === 'high' ? 'bg-amber-500/15 text-amber-400' : 'bg-wa-header/15 text-wa-header'}`} style={{border: `1px solid ${item.priority === 'high' ? 'rgba(245,158,11,0.2)' : 'rgba(0,168,132,0.2)'}`}}>
              {item.priority === 'high' ? <AlertTriangleIcon className="h-5 w-5" /> : <LightbulbIcon className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-wa-textSecondary">{item.type} · <span className={item.priority === 'high' ? 'text-amber-400' : 'text-wa-header'}>{item.priority} priority</span></p>
              <p className="mt-1 text-sm leading-6 text-wa-textPrimary">{item.message}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  </>;
}

function ProductInsightCard({ product }: { product: ProductInsight }) {
  const bars = [{ name: 'Impressions', value: product.impressions }, { name: 'Interests', value: product.interests }];
  return (
    <article className="card-hover rounded-2xl p-4 shadow-card" style={{background: 'linear-gradient(145deg, #182229, #111b21)', border: '1px solid rgba(42,57,66,0.5)'}}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-wa-textPrimary">{product.name}</h3>
          <p className="mt-1 text-xs text-wa-textSecondary">{product.category} · {product.brand || 'No brand'} · UGX {product.price.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-wa-header/15 px-2.5 py-1 text-xs font-medium text-wa-header" style={{border: '1px solid rgba(0,168,132,0.2)'}}>
          {product.conversion_rate}% conv
        </span>
      </div>
      <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-4">
        <MiniStat label="Impressions" value={product.impressions} />
        <MiniStat label="Interests" value={product.interests} />
        <MiniStat label="Avg score" value={product.average_score.toFixed(2)} />
        <MiniStat label="Avg rank" value={product.average_rank ?? '—'} />
      </div>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8696a0' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8696a0' }} />
            <Tooltip contentStyle={{ backgroundColor: '#202c33', border: '1px solid #2a3942', borderRadius: 12, color: '#e9edef' }} />
            <Bar dataKey="value" fill="#25d366" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-wa-textSecondary">
        <span className="rounded-full bg-wa-panelHeader px-2 py-0.5">{product.image_count} img{product.image_count === 1 ? '' : 's'}</span>
        <span className="rounded-full bg-wa-panelHeader px-2 py-0.5">{Object.keys(product.attributes || {}).length} attrs</span>
        <span className="rounded-full bg-wa-panelHeader px-2 py-0.5">{product.stock_qty} stock</span>
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wa-header">{eyebrow}</p>
      <h1 className="mt-1.5 text-xl font-bold tracking-tight text-wa-textPrimary md:text-2xl">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-wa-textSecondary">{description}</p>
    </div>
  );
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-4 shadow-card" style={{background: 'linear-gradient(145deg, #182229, #111b21)', border: '1px solid rgba(42,57,66,0.5)'}}>
      <h2 className="font-semibold text-wa-textPrimary">{title}</h2>
      <p className="mt-0.5 text-xs text-wa-textSecondary">{description}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, hint, gradient, emoji }: { label: string; value: React.ReactNode; hint: string; gradient?: string; emoji?: string }) {
  return (
    <article className={`card-hover rounded-xl p-3 shadow-card bg-gradient-to-br ${gradient || 'from-wa-panelHeader to-wa-panel'}`} style={{border: '1px solid rgba(42,57,66,0.5)'}}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-wa-textSecondary">{label}</p>
        {emoji && <span className="text-base">{emoji}</span>}
      </div>
      <p className="mt-1.5 text-2xl font-bold text-wa-textPrimary">{value}</p>
      <p className="mt-0.5 text-[11px] text-wa-textSecondary">{hint}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-wa-panelHeader p-2.5" style={{border: '1px solid rgba(42,57,66,0.3)'}}>
      <p className="text-[11px] text-wa-textSecondary">{label}</p>
      <p className="mt-0.5 font-semibold text-wa-textPrimary">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-wa-textSecondary">
      <div className="h-8 w-8 rounded-full border-2 border-wa-header/30 border-t-wa-header" style={{animation: 'spin 1s linear infinite'}} />
      Loading your business insights…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-5 text-sm text-red-300">
      {message}
    </div>
  );
}
