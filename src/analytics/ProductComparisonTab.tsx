import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ProductComparisonApiResponse,
  ProductPerfMetrics,
  TimeRange,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface ProductComparisonTabProps {
  selectedCompany: string;
  companyName: string;
}

function formatTime(ms: number): string {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ── Horizontal bar for the comparison chart ──────────────────────────────────
const CompBar: React.FC<{
  label: string;
  value: number;
  max: number;
  barColor: string;
  labelColor: string;
  badge?: string;
}> = ({ label, value, max, barColor, labelColor, badge }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 text-sm text-gray-600 text-right">{label}</div>
      <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
        <div
          className={`h-full ${barColor} rounded-lg transition-all duration-700`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className={`text-sm font-bold ${labelColor}`}>{value.toFixed(2)}%</span>
          {badge && (
            <span className="text-xs bg-white/70 text-gray-600 rounded px-1.5 py-0.5">{badge}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Product row in the table ──────────────────────────────────────────────────
const ProductRow: React.FC<{ product: ProductPerfMetrics; isWom: boolean; rank: number }> = ({
  product,
  isWom,
  rank,
}) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="px-4 py-3 text-sm text-gray-500">{rank}</td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        {isWom && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">WOM</span>
        )}
        <span className="text-sm text-gray-800 font-medium">{product.product_name}</span>
      </div>
    </td>
    <td className="px-4 py-3 text-sm text-gray-700 text-right">{product.visitors.toLocaleString()}</td>
    <td className="px-4 py-3 text-right">
      <span className={`text-sm font-bold ${isWom ? 'text-green-700' : 'text-gray-700'}`}>
        {product.conv_rate.toFixed(2)}%
      </span>
    </td>
    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatTime(product.avg_time_ms)}</td>
    {isWom && (
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-blue-700 font-medium">{product.engagement_rate.toFixed(1)}%</span>
      </td>
    )}
  </tr>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const ProductComparisonTab: React.FC<ProductComparisonTabProps> = ({
  selectedCompany,
  companyName,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [data, setData] = useState<ProductComparisonApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'wom' | 'nowom'>('wom');

  const fetchData = useCallback(
    async (recompute = false) => {
      if (!selectedCompany) return;
      setLoading(true);
      setError('');
      try {
        const sessionToken = localStorage.getItem('session_token');
        const res = await fetch(
          `${API_BASE_URL}/analytics/product-comparison/${selectedCompany}?time_range=${timeRange}${
            recompute ? '&recompute=true' : ''
          }`,
          { headers: { Authorization: `Bearer ${sessionToken}` } },
        );
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.detail || 'Failed to load product comparison data');
        }
      } catch {
        setError('Error fetching data. Make sure the analytics service is running.');
      } finally {
        setLoading(false);
      }
    },
    [selectedCompany, timeRange],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxConvRate = useMemo(() => {
    if (!data) return 1;
    const { summary } = data;
    return Math.max(summary.avg_wom_conv_rate, summary.avg_non_wom_conv_rate) || 1;
  }, [data]);

  const maxTimeMs = useMemo(() => {
    if (!data) return 1;
    const { summary } = data;
    return Math.max(summary.avg_wom_time_ms, summary.avg_non_wom_time_ms) || 1;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="text-secondary-text text-sm">Comparing product performance…</p>
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
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, wom_products, non_wom_products } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">WOM Products vs Normal Products</h2>
          <p className="text-sm text-gray-500">
            How products with the WOM widget perform compared to products without it
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === r
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            title="Recompute from PostHog"
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            <span className={`material-symbols-outlined !text-[16px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Headline */}
      {summary.uplift_multiplier != null && summary.uplift_multiplier > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-black">{summary.uplift_multiplier}×</span>
            </div>
            <div>
              <p className="text-white/80 text-sm">Product-level finding</p>
              <p className="text-xl font-bold">
                Products with the WOM widget convert {summary.uplift_multiplier}× more than
                products without it
              </p>
              <p className="text-white/70 text-sm mt-1">
                {summary.avg_wom_conv_rate.toFixed(2)}% WOM products vs{' '}
                {summary.avg_non_wom_conv_rate.toFixed(2)}% non-WOM products (avg conversion rate)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'WOM Products',
            value: summary.wom_product_count,
            icon: 'verified',
            color: 'bg-green-50 border-green-200',
            iconColor: 'text-green-600',
            desc: 'Products with widget installed',
          },
          {
            label: 'Normal Products',
            value: summary.non_wom_product_count,
            icon: 'inventory_2',
            color: 'bg-gray-50 border-gray-200',
            iconColor: 'text-gray-500',
            desc: 'Products without widget',
          },
          {
            label: 'WOM Avg Conv.',
            value: `${summary.avg_wom_conv_rate.toFixed(2)}%`,
            icon: 'trending_up',
            color: 'bg-emerald-50 border-emerald-200',
            iconColor: 'text-emerald-600',
            desc: 'Avg conversion rate (WOM)',
          },
          {
            label: 'Non-WOM Avg Conv.',
            value: `${summary.avg_non_wom_conv_rate.toFixed(2)}%`,
            icon: 'trending_flat',
            color: 'bg-orange-50 border-orange-200',
            iconColor: 'text-orange-500',
            desc: 'Avg conversion rate (normal)',
          },
        ].map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border ${card.color} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center border ${card.color}`}>
                <span className={`material-symbols-outlined !text-[20px] ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Conversion rate comparison bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Conversion Rate Comparison
        </h3>
        <div className="flex flex-col gap-3">
          <CompBar
            label="WOM Products"
            value={summary.avg_wom_conv_rate}
            max={maxConvRate}
            barColor="bg-green-500"
            labelColor="text-white"
            badge={summary.uplift_multiplier != null && summary.uplift_multiplier > 0 ? `${summary.uplift_multiplier}× baseline` : undefined}
          />
          <CompBar
            label="Normal Products"
            value={summary.avg_non_wom_conv_rate}
            max={maxConvRate}
            barColor="bg-gray-400"
            labelColor="text-white"
            badge="Baseline"
          />
        </div>
      </div>

      {/* Time on page comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Avg Time on Page
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Longer time on WOM product pages signals trust — customers read reviews before buying
        </p>
        <div className="flex flex-col gap-3">
          <CompBar
            label="WOM Products"
            value={summary.avg_wom_time_ms / 1000}
            max={maxTimeMs / 1000}
            barColor="bg-blue-500"
            labelColor="text-white"
            badge={formatTime(summary.avg_wom_time_ms)}
          />
          <CompBar
            label="Normal Products"
            value={summary.avg_non_wom_time_ms / 1000}
            max={maxTimeMs / 1000}
            barColor="bg-gray-300"
            labelColor="text-gray-700"
            badge={formatTime(summary.avg_non_wom_time_ms)}
          />
        </div>
      </div>

      {/* Per-product tables */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Product Performance Details</h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTable('wom')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTable === 'wom'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              WOM Products ({summary.wom_product_count})
            </button>
            <button
              onClick={() => setActiveTable('nowom')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTable === 'nowom'
                  ? 'bg-white text-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Normal Products ({summary.non_wom_product_count})
            </button>
          </div>
        </div>

        {activeTable === 'wom' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">#</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">Product</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Visitors</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Conv Rate</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Avg Time</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">WOM Engagement</th>
              </tr>
            </thead>
            <tbody>
              {wom_products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No WOM product data found for this period
                  </td>
                </tr>
              ) : (
                wom_products.map((p, i) => (
                  <ProductRow key={p.product_handle} product={p} isWom rank={i + 1} />
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">#</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium">Product</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Visitors</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Conv Rate</th>
                <th className="px-4 py-2 text-xs text-gray-500 font-medium text-right">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {non_wom_products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No non-WOM product data found for this period
                  </td>
                </tr>
              ) : (
                non_wom_products.map((p, i) => (
                  <ProductRow key={p.product_handle} product={p} isWom={false} rank={i + 1} />
                ))
              )}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 mt-3 italic">
          Top 20 products by conversion rate shown. Normal products with fewer than 5 visitors are excluded.
        </p>
      </div>
    </div>
  );
};

export default ProductComparisonTab;
