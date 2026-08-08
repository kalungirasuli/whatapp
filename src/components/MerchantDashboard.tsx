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
import { AlertTriangleIcon, ArrowLeftIcon, BarChart3Icon, LightbulbIcon } from 'lucide-react';
import { MerchantAnalyticsOverview, MerchantBuyerAnalytics, MerchantCategoryAnalytics, MerchantProfile, AnalyticsRecommendation, ProductInsight } from '../types';
import { getMerchantAnalytics, getMerchantBuyerAnalytics, getMerchantCategoryAnalytics, getMerchantProductInsights, getMerchantRecommendations } from '../api';

interface MerchantDashboardProps {
  merchant: MerchantProfile;
  onBack: () => void;
}

type Tab = 'overview' | 'category' | 'products' | 'buyers' | 'recommendations';

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
    { id: 'category', label: 'Category insight' },
    { id: 'products', label: 'Products' },
    { id: 'buyers', label: 'Buyers' },
    { id: 'recommendations', label: 'Recommendations' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-wa-panelAlt">
      <header className="flex shrink-0 items-center justify-between border-b border-wa-border bg-wa-panel px-5 py-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back to chat" className="rounded-full p-2 text-wa-textSecondary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-wa-header text-white">
            <BarChart3Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-wa-textPrimary">{merchant.business_name}</p>
            <p className="truncate text-xs text-wa-textSecondary">Business intelligence · {merchant.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(event) => { setDays(Number(event.target.value)); setBuyers(null); }} className="rounded-lg border border-wa-border bg-wa-panel px-3 py-2 text-sm text-wa-textPrimary focus:outline-none focus:ring-2 focus:ring-wa-green">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </header>

      <nav className="wa-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-wa-border bg-wa-panel px-4 pt-2">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === item.id ? 'border-wa-header text-wa-header' : 'border-transparent text-wa-textSecondary hover:text-wa-textPrimary'}`}>
            {item.label}
          </button>
        ))}
      </nav>

      <main className="wa-scroll min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
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

function OverviewTab({ overview }: { overview: MerchantAnalyticsOverview }) {
  const cards: Array<[string, React.ReactNode, string]> = [
    ['Interests', overview.summary.interests, 'Buyer actions'],
    ['Search impressions', overview.summary.search_impressions, 'Your products appeared'],
    ['Conversion rate', `${overview.summary.conversion_rate}%`, 'Impression to interest'],
    ['Unique buyers', overview.summary.unique_buyers, 'People who showed interest'],
    ['Average match', overview.summary.average_match_score.toFixed(2), 'Final ranking score'],
    ['Active products', overview.summary.active_products, `of ${overview.summary.products} listed`],
  ];
  return <>
    <SectionHeading eyebrow="Business overview" title="What is happening in your shop" description="Real buyer searches, product visibility, and interest activity from the selected period." />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value, hint]) => <MetricCard key={label} label={label} value={value} hint={hint} />)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <ChartCard title="Interest and visibility trend" description="Daily product appearances compared with buyer interest.">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={overview.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs><linearGradient id="interestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#25d366" stopOpacity={0.35} /><stop offset="95%" stopColor="#25d366" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(value) => String(value).slice(5)} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="impressions" stroke="#008069" fill="url(#interestFill)" name="Impressions" />
            <Area type="monotone" dataKey="interests" stroke="#f2a93b" fill="none" name="Interests" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Top products" description="Products earning the most buyer attention.">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={overview.top_products.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={72} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="interests" fill="#008069" radius={[0, 5, 5, 0]} name="Interests" />
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
    <SectionHeading eyebrow={`Category · ${category.category}`} title="Demand in your market" description="Compare your visibility with what buyers are asking for in this category." />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard label="Category products" value={category.market.products} hint="Available in the market" />
      <MetricCard label="Active sellers" value={category.market.merchants} hint="Competing merchants" />
      <MetricCard label="Searches" value={category.market.searches} hint={`Last ${category.period_days} days`} />
      <MetricCard label="Impressions" value={category.market.impressions} hint="Category results shown" />
      <MetricCard label="Your visibility" value={`${category.market.merchant_impression_share}%`} hint="Share of category impressions" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <ChartCard title="Buyer attributes" description="Terms and attributes extracted from real search requests.">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={attributeData.slice(0, 12)} layout="vertical" margin={{ top: 8, right: 12, left: 22, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#5b8def" radius={[0, 5, 5, 0]} name="Requests" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Price position" description="Your average price versus the category average.">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={[{ name: 'Market', value: category.prices.average_market_price }, { name: 'Your shop', value: category.prices.your_average_price }]} margin={{ top: 20, right: 20, left: 10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9edef" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => `UGX ${Number(value).toLocaleString()}`} />
            <Bar dataKey="value" fill="#f2a93b" radius={[5, 5, 0, 0]} name="Average price" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </>;
}

function ProductsTab({ products }: { products: ProductInsight[] }) {
  return <>
    <SectionHeading eyebrow="Product performance" title="Which listings are working" description="Visibility, ranking quality, and buyer conversion for each product." />
    <div className="grid gap-4 lg:grid-cols-2">
      {products.map((product) => <ProductInsightCard key={product.product_id} product={product} />)}
    </div>
  </>;
}

function BuyersTab({ buyers }: { buyers: MerchantBuyerAnalytics | null }) {
  if (!buyers) return <LoadingState />;
  const data = buyers.buyers.slice(0, 10).map((buyer) => ({ name: buyer.phone.slice(-9), interests: buyer.interests }));
  return <>
    <SectionHeading eyebrow="Buyer intelligence" title="Who is showing interest" description="Returning buyers and interest concentration from your real activity." />
    <div className="grid gap-3 sm:grid-cols-3"><MetricCard label="Unique buyers" value={buyers.unique_buyers} hint={`Last ${buyers.period_days} days`} /><MetricCard label="Returning buyers" value={buyers.buyers.filter((buyer) => buyer.interests > 1).length} hint="More than one interest" /><MetricCard label="Average interests" value={(buyers.buyers.reduce((sum, buyer) => sum + buyer.interests, 0) / Math.max(1, buyers.unique_buyers)).toFixed(1)} hint="Per buyer" /></div>
    <div className="mt-5"><ChartCard title="Interests by buyer" description="Use this to prioritize follow-up conversations."><ResponsiveContainer width="100%" height={340}><BarChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#e9edef" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="interests" fill="#008069" radius={[5, 5, 0, 0]} name="Interests" /></BarChart></ResponsiveContainer></ChartCard></div>
  </>;
}

function RecommendationsTab({ recommendations }: { recommendations: AnalyticsRecommendation[] }) {
  return <>
    <SectionHeading eyebrow="Action plan" title="How to improve your shop" description="Recommendations are generated from your catalog quality, visibility, ranking scores, stock, and buyer behavior." />
    <div className="grid gap-4 md:grid-cols-2">{recommendations.map((item, index) => <article key={`${item.type}-${item.product_id ?? index}`} className="rounded-2xl border border-wa-border bg-wa-panel p-5 shadow-sm"><div className="flex items-start gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.priority === 'high' ? 'bg-[#fff1df] text-[#b66500]' : 'bg-[#e7fce3] text-wa-header'}`}>{item.priority === 'high' ? <AlertTriangleIcon className="h-5 w-5" /> : <LightbulbIcon className="h-5 w-5" />}</div><div><p className="text-xs font-semibold uppercase tracking-wide text-wa-textSecondary">{item.type} · {item.priority} priority</p><p className="mt-1 text-sm leading-6 text-wa-textPrimary">{item.message}</p></div></div></article>)}</div>
  </>;
}

function ProductInsightCard({ product }: { product: ProductInsight }) {
  const bars = [{ name: 'Impressions', value: product.impressions }, { name: 'Interests', value: product.interests }];
  return <article className="rounded-2xl border border-wa-border bg-wa-panel p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-wa-textPrimary">{product.name}</h3><p className="mt-1 text-xs text-wa-textSecondary">{product.category} · {product.brand || 'No brand'} · UGX {product.price.toLocaleString()}</p></div><span className="rounded-full bg-wa-panelAlt px-2.5 py-1 text-xs font-medium text-wa-textSecondary">{product.conversion_rate}% conversion</span></div><div className="mt-4 grid gap-3 sm:grid-cols-4"><MiniStat label="Impressions" value={product.impressions} /><MiniStat label="Interests" value={product.interests} /><MiniStat label="Avg score" value={product.average_score.toFixed(2)} /><MiniStat label="Avg rank" value={product.average_rank ?? '—'} /></div><div className="mt-4 h-40"><ResponsiveContainer width="100%" height="100%"><BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="#25d366" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-wa-textSecondary"><span>{product.image_count} image{product.image_count === 1 ? '' : 's'}</span><span>{Object.keys(product.attributes || {}).length} attributes</span><span>{product.stock_qty} in stock</span></div></article>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-wa-header">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-wa-textPrimary md:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-wa-textSecondary">{description}</p></div>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-wa-border bg-wa-panel p-5 shadow-sm"><h2 className="font-semibold text-wa-textPrimary">{title}</h2><p className="mt-1 text-xs text-wa-textSecondary">{description}</p><div className="mt-4">{children}</div></section>;
}

function MetricCard({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return <article className="rounded-2xl border border-wa-border bg-wa-panel p-4 shadow-sm"><p className="text-xs text-wa-textSecondary">{label}</p><p className="mt-2 text-2xl font-semibold text-wa-textPrimary">{value}</p><p className="mt-1 text-[11px] text-wa-textSecondary">{hint}</p></article>;
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-wa-panelAlt p-3"><p className="text-[11px] text-wa-textSecondary">{label}</p><p className="mt-1 font-semibold text-wa-textPrimary">{value}</p></div>;
}

function LoadingState() {
  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-wa-textSecondary">Loading your business insights…</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-[#f3c6c2] bg-[#fff6f5] p-6 text-sm text-[#a33a32]">{message}</div>;
}
