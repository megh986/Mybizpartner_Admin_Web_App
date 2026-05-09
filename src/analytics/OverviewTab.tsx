import React, { useState, useEffect, useCallback } from 'react';
import type {
  DailyMetrics,
  LiveMetrics,
  AnalyticsSummary,
  TimeRange,
  OverviewApiResponse,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface Product {
  _id: string;
  name: string;
  product_id: string;
  company_id: string;
}

interface OverviewTabProps {
  selectedCompany: string;
  companyName: string;
  products: Product[];
}


// ─── Main Component ──────────────────────────────────────────────────
const OverviewTab: React.FC<OverviewTabProps> = ({ selectedCompany, companyName, products }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [, setLiveMetrics] = useState<LiveMetrics>({
    current_visitors: 0,
    active_on_review_page: 0,
    recent_page_views: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  interface DailyAtcConversion {
    date: string;
    atc_rate_with_wom: number;
    atc_rate_without_wom: number;
    atc_with_wom: number;
    atc_without_wom: number;
  }

  interface TopProduct {
    rank: number;
    product_handle: string;
    product_name: string;
    wom_event_count: number;
    unique_visitors: number;
    wom_users: number;
    wom_interaction_rate: number;
    add_to_cart_rate: number;
    daily_page_views: { date: string; page_views: number }[];
    // Split metrics
    page_views: number;
    page_views_with_wom: number;
    page_views_without_wom: number;
    unique_visitors_with_wom: number;
    unique_visitors_without_wom: number;
    atc_with_wom: number;
    atc_without_wom: number;
    atc_rate_with_wom: number;
    atc_rate_without_wom: number;
    daily_atc_conversion: DailyAtcConversion[];
  }

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TopProduct | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/analytics/overview/${selectedCompany}?time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      const data: OverviewApiResponse = await res.json();

      if (data.success) {
        setDailyData(data.daily_metrics ?? []);
        setSummary(data.summary ?? null);
        if (data.live) setLiveMetrics(data.live);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching analytics. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, timeRange]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const fetchTopWOMProducts = useCallback(async () => {
    if (!selectedCompany) return;
    setTopProductsLoading(true);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/analytics/top-wom-products/${selectedCompany}?time_range=${timeRange}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      const data = await res.json();
      if (data.success) setTopProducts(data.top_products ?? []);
    } catch (err) {
      console.error('Top WOM products fetch failed', err);
    } finally {
      setTopProductsLoading(false);
    }
  }, [selectedCompany, timeRange]);

  useEffect(() => {
    fetchTopWOMProducts();
  }, [fetchTopWOMProducts]);

  if (loading && dailyData.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-secondary-text text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={fetchOverview} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Company & Time Period Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Analytics for</p>
              <p className="text-lg font-bold text-gray-900">{companyName}</p>
              <p className="text-sm text-gray-500">{products.length} products</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Time Period</p>
          <div className="flex gap-2">
            {(['7d', '14d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Page Views</span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 !text-[20px]">visibility</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.total_page_views.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Views with 3s+ dwell time</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Unique Visitors</span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500 !text-[20px]">person</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.total_unique_visits.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Review Interactions</span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 !text-[20px]">rate_review</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.review_interaction_rate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">Of visitors interact with reviews</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Add to Cart Rate</span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 !text-[20px]">shopping_cart</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.add_to_cart_conversion_rate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">After viewing reviews</p>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (() => {
        const p = selectedProduct;
        const pvMax = Math.max(...p.daily_page_views.map(d => d.page_views), 1);
        const pvPoints = p.daily_page_views.map((d, i, arr) => {
          const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
          const y = 100 - (d.page_views / pvMax) * 90;
          return `${x},${y}`;
        }).join(' ');
        const areaPoints = p.daily_page_views.map((d, i, arr) => {
          const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
          const y = 100 - (d.page_views / pvMax) * 90;
          return `${x},${y}`;
        });
        const areaPath = areaPoints.length
          ? `M ${areaPoints[0]} ` + areaPoints.slice(1).map(pt => `L ${pt}`).join(' ') + ` L 100,100 L 0,100 Z`
          : '';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white bg-indigo-500 rounded-full px-2 py-0.5">#{p.rank}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 rounded px-2 py-0.5">{p.product_handle}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{p.product_name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">WOM Performance · {timeRange} period</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="material-symbols-outlined !text-[22px]">close</span>
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Page Views Over Time */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Page Views Over Time</p>
                  <div className="relative h-36 bg-gray-50 rounded-xl overflow-hidden">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full"
                    >
                      <defs>
                        <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {areaPath && <path d={areaPath} fill="url(#pvGrad)" />}
                      {pvPoints && (
                        <polyline
                          points={pvPoints}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                    {/* date labels */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3 pointer-events-none">
                      {p.daily_page_views.filter((_, i, arr) => i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2)).map((d, i) => (
                        <span key={i} className="text-[9px] text-gray-400">{d.date.slice(5)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 Metrics with WOM / without WOM split */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                      <span className="text-gray-500 font-medium">With WOM Interaction</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                      <span className="text-gray-500 font-medium">Without WOM Interaction</span>
                    </span>
                  </div>

                  {/* Page Views */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Page Views</p>
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{(p.page_views_with_wom ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">With WOM</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-400">{(p.page_views_without_wom ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Without WOM</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold text-gray-600">{(p.page_views ?? 0).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">Total</p>
                      </div>
                    </div>
                    {(p.page_views ?? 0) > 0 && (
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-700"
                          style={{ width: `${((p.page_views_with_wom ?? 0) / (p.page_views || 1)) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Unique Visitors */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Unique Visitors</p>
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{(p.unique_visitors_with_wom ?? p.wom_users).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">With WOM</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-400">{(p.unique_visitors_without_wom ?? (p.unique_visitors - p.wom_users)).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Without WOM</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold text-gray-600">{p.unique_visitors.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">Total</p>
                      </div>
                    </div>
                    {p.unique_visitors > 0 && (
                      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-700"
                          style={{ width: `${(p.wom_users / p.unique_visitors) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Review Interaction Rate */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Interaction</p>
                      <span className="text-xs font-semibold text-indigo-600">as % of unique visitors</span>
                    </div>
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{p.wom_interaction_rate.toFixed(1)}%</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">With WOM ({p.wom_users} visitors)</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-400">0%</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Without WOM ({(p.unique_visitors_without_wom ?? p.unique_visitors - p.wom_users)} visitors)</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${Math.min(p.wom_interaction_rate, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Add to Cart Rate */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add to Cart Rate</p>
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">{(p.atc_rate_with_wom ?? 0).toFixed(1)}%</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">With WOM ({p.atc_with_wom ?? 0} users)</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-400">{(p.atc_rate_without_wom ?? 0).toFixed(1)}%</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Without WOM ({p.atc_without_wom ?? 0} users)</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-semibold text-gray-600">{p.add_to_cart_rate.toFixed(1)}%</p>
                        <p className="text-[11px] text-gray-400">Overall</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-1">
                      <div className="h-2 bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(p.atc_rate_with_wom ?? 0, 100)}%`, minWidth: (p.atc_rate_with_wom ?? 0) > 0 ? '4px' : '0' }} />
                      <div className="h-2 bg-gray-300 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(p.atc_rate_without_wom ?? 0, 100)}%`, minWidth: (p.atc_rate_without_wom ?? 0) > 0 ? '4px' : '0' }} />
                    </div>
                  </div>
                </div>

                {/* ATC Conversion Rate Graph (with WOM vs without WOM) */}
                {p.daily_atc_conversion && p.daily_atc_conversion.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add to Cart Conversion Rate Over Time</p>
                    <div className="relative h-40 bg-gray-50 rounded-xl overflow-hidden px-2 pt-2 pb-6">
                      {(() => {
                        const data = p.daily_atc_conversion;
                        const maxRate = Math.max(...data.map(d => Math.max(d.atc_rate_with_wom, d.atc_rate_without_wom)), 1);
                        const toSvgY = (v: number) => 100 - (v / maxRate) * 90;
                        const womPoints = data.map((d, i, arr) => {
                          const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                          return `${x},${toSvgY(d.atc_rate_with_wom)}`;
                        }).join(' ');
                        const noWomPoints = data.map((d, i, arr) => {
                          const x = arr.length > 1 ? (i / (arr.length - 1)) * 100 : 50;
                          return `${x},${toSvgY(d.atc_rate_without_wom)}`;
                        }).join(' ');
                        return (
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                            <polyline points={womPoints} fill="none" stroke="#10b981" strokeWidth="2"
                              vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                            <polyline points={noWomPoints} fill="none" stroke="#d1d5db" strokeWidth="2"
                              vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
                          </svg>
                        );
                      })()}
                      <div className="absolute bottom-1 left-0 right-0 flex justify-between px-3 pointer-events-none">
                        {p.daily_atc_conversion
                          .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2))
                          .map((d, i) => (
                            <span key={i} className="text-[9px] text-gray-400">{d.date.slice(5)}</span>
                          ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-emerald-500 inline-block" /> With WOM</span>
                      <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-gray-300 inline-block border-dashed" /> Without WOM</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top 3 WOM Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 !text-[20px]">emoji_events</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Top WOM Products</h3>
              <p className="text-xs text-gray-400">by WOM engagement · click a card to see details</p>
            </div>
          </div>
          {topProductsLoading && (
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          )}
        </div>

        {topProducts.length === 0 && !topProductsLoading ? (
          <p className="text-xs text-gray-400 italic">No WOM product data available for this period.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topProducts.map((p, idx) => {
              const lineColors = ['#6366f1', '#8b5cf6', '#10b981'];
              const rankLabel = `#${p.rank}`;
              // Simple rising sparkline points
              const sparkW = 80, sparkH = 40;
              const points = [0.2, 0.3, 0.25, 0.5, 0.6, 0.75, 1.0].map((v, i, arr) => {
                const x = (i / (arr.length - 1)) * sparkW;
                const y = sparkH - v * sparkH * 0.85;
                return `${x},${y}`;
              }).join(' ');
              const nonWomVisitors = p.unique_visitors_without_wom ?? (p.unique_visitors - p.wom_users);
              return (
                <div
                  key={p.product_handle}
                  className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
                        {rankLabel} · {p.product_handle.toUpperCase()}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{p.product_name}</p>
                    </div>
                    <svg width={sparkW} height={sparkH} className="shrink-0">
                      <polyline points={points} fill="none" stroke={lineColors[idx]}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />WOM</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />No WOM</span>
                  </div>

                  {/* 4 Metrics grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Page Views */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Page Views</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{(p.page_views_with_wom ?? 0).toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-400">{(p.page_views_without_wom ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(p.page_views ?? 0) > 0 ? ((p.page_views_with_wom ?? 0) / (p.page_views || 1)) * 100 : 0}%` }} />
                      </div>
                    </div>

                    {/* Unique Visitors */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Unique Visitors</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{p.wom_users.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-400">{nonWomVisitors.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${p.unique_visitors > 0 ? (p.wom_users / p.unique_visitors) * 100 : 0}%` }} />
                      </div>
                    </div>

                    {/* Review Interaction % */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Review Interaction</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{p.wom_interaction_rate.toFixed(1)}%</span>
                        <span className="text-sm font-bold text-gray-400">0%</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(p.wom_interaction_rate, 100)}%` }} />
                      </div>
                    </div>

                    {/* Add to Cart Rate */}
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Add to Cart</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600">{(p.atc_rate_with_wom ?? 0).toFixed(1)}%</span>
                        <span className="text-sm font-bold text-gray-400">{(p.atc_rate_without_wom ?? 0).toFixed(1)}%</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(p.atc_rate_with_wom ?? 0, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-2">Click to see details · {timeRange} period</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default OverviewTab;
