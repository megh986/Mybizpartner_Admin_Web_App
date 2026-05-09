import React, { useState, useEffect, useCallback } from 'react';
import type {
  ProductReviewMetricsApiResponse,
  ProductReviewMetricsPerProduct,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface ProductReviewMetricsTabProps {
  selectedCompany: string;
  companyName: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = Math.round(rating);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`material-symbols-outlined !text-[14px] ${s <= stars ? 'text-yellow-400' : 'text-gray-300'}`}>
          star
        </span>
      ))}
    </span>
  );
};

// Colour for each source type key
const sourceColor: Record<string, { bg: string; text: string; dot: string }> = {
  generated:       { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  actual_customer: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  marketplace:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  untagged:        { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
};
const fallbackColor = { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' };

const sourceLabel: Record<string, string> = {
  generated: 'AI Generated',
  actual_customer: 'Real Customer',
  marketplace: 'Marketplace',
  untagged: 'WOM Reviews',
};

// Expanded detail panel shown below a product row
const ProductDetailPanel: React.FC<{ p: ProductReviewMetricsPerProduct }> = ({ p }) => {
  const starColors: Record<string, string> = {
    '5': 'bg-emerald-500', '4': 'bg-green-400',
    '3': 'bg-amber-400', '2': 'bg-orange-400', '1': 'bg-red-500',
  };


  const ImageStarBreakdown: React.FC<{ breakdown: Record<string, number>; total: number; label: string; color: string }> = ({ breakdown, total, label, color }) => (
    <div className="flex-1">
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
      <div className="space-y-1">
        {['5','4','3','2','1'].map((s) => {
          const cnt = breakdown?.[s] ?? 0;
          const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-right text-secondary-text font-medium">{s}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${starColors[s]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right text-secondary-text">{cnt}</span>
              <span className="w-8 text-right text-gray-400">{pct}%</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-secondary-text mt-2">Total: <span className="font-bold text-primary-text">{total}</span></p>
    </div>
  );

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 py-5 space-y-6">

      {/* ── Row 1: Star Breakdown | Review Sources | Quick Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Star Breakdown */}
        <div>
          <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">Star Breakdown</p>
          <div className="space-y-1.5">
            {['5','4','3','2','1'].map((s) => {
              const cnt = p.star_breakdown?.[s] ?? 0;
              const pct = p.total > 0 ? Math.round((cnt / p.total) * 100) : 0;
              return (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-secondary-text font-medium">{s}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${starColors[s]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-secondary-text">{cnt}</span>
                  <span className="w-8 text-right text-gray-400">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <RatingStars rating={p.avg_rating} />
            <span className="text-sm font-bold text-primary-text">{p.avg_rating.toFixed(1)}</span>
            <span className="text-xs text-secondary-text">avg</span>
          </div>
        </div>

        {/* Review Sources */}
        <div>
          <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">Review Sources</p>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1.5">Real</p>
              {p.real_review_count > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-purple-500" />
                  <span className="flex-1 text-xs text-primary-text">Real Customer</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-purple-500"
                      style={{ width: `${p.total > 0 ? Math.round((p.real_review_count / p.total) * 100) : 0}%` }} />
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">{p.real_review_count}</span>
                </div>
              ) : (
                <p className="text-xs text-secondary-text italic">No real customer reviews</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1.5">WOM</p>
              {Object.keys(p.wom_source_breakdown || {}).length === 0 ? (
                <p className="text-xs text-secondary-text italic">No WOM reviews</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(p.wom_source_breakdown || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).map(([src, cnt]) => {
                    const pct = p.total > 0 ? Math.round((cnt / p.total) * 100) : 0;
                    return (
                      <div key={src} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-blue-400" />
                        <span className="flex-1 text-xs text-primary-text capitalize">{src}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">Quick Stats</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="material-symbols-outlined !text-[14px]">person_check</span>
                Real Customer Reviews
              </span>
              <span className="font-bold text-purple-700 text-sm">{p.real_review_count}</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-secondary-text uppercase tracking-wider">Added Today</p>
              <div className="flex items-center justify-between text-xs pl-1">
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="material-symbols-outlined !text-[13px]">person_check</span>
                  Real
                </span>
                <span className="font-bold text-purple-700 text-sm">+{p.real_daily_added ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs pl-1">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="material-symbols-outlined !text-[13px]">trending_up</span>
                  WOM
                </span>
                <span className="font-bold text-emerald-700 text-sm">+{p.wom_daily_added ?? 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <span className="material-symbols-outlined !text-[14px]">reviews</span>
                Total Reviews
              </span>
              <span className="font-bold text-indigo-700 text-sm">{formatNumber(p.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Reviews with Images ── */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-4">Reviews with Images</p>

        {/* Summary counts */}
        <div className="flex gap-6 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined !text-[14px] text-pink-500">image</span>
            <span className="text-secondary-text">Customer Image Reviews</span>
            <span className="font-bold text-pink-700">
              {p.real_image_count ?? 0}
              <span className="text-gray-400 font-normal ml-1">
                ({p.real_review_count > 0 ? Math.round(((p.real_image_count ?? 0) / p.real_review_count) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="material-symbols-outlined !text-[14px] text-violet-500">auto_awesome</span>
            <span className="text-secondary-text">WOM Image Reviews</span>
            <span className="font-bold text-violet-700">
              {p.with_images ?? 0}
              <span className="text-gray-400 font-normal ml-1">
                ({p.total > 0 ? Math.round(((p.with_images ?? 0) / p.total) * 100) : 0}%)
              </span>
            </span>
          </div>
        </div>

        {/* Star breakdown side by side */}
        <div className="flex gap-8">
          <ImageStarBreakdown
            breakdown={p.real_image_star_breakdown ?? {}}
            total={p.real_image_count ?? 0}
            label="Real — by star"
            color="text-pink-500"
          />
          <ImageStarBreakdown
            breakdown={p.wom_image_star_breakdown ?? {}}
            total={p.with_images ?? 0}
            label="WOM — by star"
            color="text-violet-500"
          />
        </div>
      </div>

    </div>
  );
};


const ProductReviewMetricsTab: React.FC<ProductReviewMetricsTabProps> = ({ selectedCompany, companyName }) => {
  const [data, setData] = useState<ProductReviewMetricsApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const [productFilter, setProductFilter] = useState('');

  const toggleRow = (pid: string) => {
    setOpenRows((prev) => ({ ...prev, [pid]: !prev[pid] }));
  };

  const fetchData = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/reviews/review-metrics/${selectedCompany}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ProductReviewMetricsApiResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load review metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Global source type cards built dynamically from by_source_type
  const filteredProducts: ProductReviewMetricsPerProduct[] = data
    ? (productFilter.trim()
        ? data.per_product.filter((p) =>
            p.product_id.toLowerCase().includes(productFilter.trim().toLowerCase())
          )
        : data.per_product)
    : [];

  const displayProducts: ProductReviewMetricsPerProduct[] = productFilter.trim()
    ? filteredProducts
    : (showAll ? filteredProducts : filteredProducts.slice(0, 15));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary-text">Product Review Metrics</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            {companyName ? `${companyName} — ` : ''}review counts by source type and product
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Overall Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews',         value: formatNumber(data?.total_reviews ?? 0),         icon: 'rate_review', color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Products Under Review', value: `${formatNumber(data?.products_under_review ?? 0)} / ${formatNumber(data?.per_product?.length ?? 0)}`, icon: 'inventory_2', color: 'text-orange-600 bg-orange-50' },
          { label: 'Reviews with Images',   value: formatNumber(data?.reviews_with_images ?? 0),   icon: 'image',       color: 'text-pink-600 bg-pink-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>
              <span className="material-symbols-outlined !text-[18px]">{card.icon}</span>
            </div>
            <p className="text-xs text-secondary-text font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-primary-text mt-1">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>


      {/* Per-Product Table with expandable dropdown */}
      {data && data.per_product.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="text-sm font-bold text-primary-text">Per-Product Breakdown</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <span className="material-symbols-outlined !text-[16px] text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Filter by product ID…"
                  value={productFilter}
                  onChange={(e) => { setProductFilter(e.target.value); setShowAll(false); }}
                  className="pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
                />
                {productFilter && (
                  <button
                    onClick={() => setProductFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="material-symbols-outlined !text-[14px]">close</span>
                  </button>
                )}
              </div>
              <span className="text-xs text-secondary-text">
                {productFilter.trim()
                  ? `${filteredProducts.length} of ${data.per_product.length} products · click row to expand`
                  : `${data.per_product.length} products · ${data.products_under_review} with reviews · click row to expand`}
              </span>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-6"><span className="sr-only">Expand</span></th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider text-right">Real</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Stars</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Sources</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider text-right">Today</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">Avg Rating</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((p: ProductReviewMetricsPerProduct) => {
                const isOpen = !!openRows[p.product_id];
                const sources = Object.entries(p.source_breakdown || {}).filter(([, c]) => c > 0);
                return (
                  <React.Fragment key={p.product_id}>
                    <tr
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleRow(p.product_id)}
                    >
                      {/* Chevron */}
                      <td className="px-4 py-3">
                        <span className={`material-symbols-outlined !text-[16px] text-gray-400 inline-block transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                          chevron_right
                        </span>
                      </td>

                      {/* Product name + ID */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium text-primary-text truncate">{p.product_name || p.product_id}</p>
                        <p className="text-xs text-secondary-text truncate">{p.product_id}</p>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-bold text-primary-text">{formatNumber(p.total)}</td>

                      {/* Real customer reviews */}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                          <span className="material-symbols-outlined !text-[11px]">person_check</span>
                          {p.real_review_count}
                        </span>
                      </td>

                      {/* Mini star bar */}
                      <td className="px-4 py-3">
                        <div className="flex items-end gap-0.5 h-6">
                          {['5','4','3','2','1'].map((s) => {
                            const cnt = p.star_breakdown?.[s] ?? 0;
                            const pct = p.total > 0 ? Math.round((cnt / p.total) * 100) : 0;
                            const barColors: Record<string,string> = {'5':'bg-emerald-500','4':'bg-green-400','3':'bg-amber-400','2':'bg-orange-400','1':'bg-red-500'};
                            return (
                              <div key={s} className="group relative flex flex-col justify-end w-3 h-6">
                                <div className={`w-3 rounded-sm ${barColors[s]}`} style={{ height: `${Math.max(pct * 0.2, 2)}px` }} />
                                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 transition-opacity pointer-events-none">
                                  <div className="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{s}★ {cnt} ({pct}%)</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Source pills */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sources.slice(0, 3).map(([src, cnt]) => {
                            const col = sourceColor[src] ?? fallbackColor;
                            return (
                              <span key={src} className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${col.bg} ${col.text}`}>
                                {sourceLabel[src] ?? src.replace(/_/g, ' ')} {cnt}
                              </span>
                            );
                          })}
                          {sources.length > 3 && (
                            <span className="text-[10px] text-secondary-text">+{sources.length - 3}</span>
                          )}
                        </div>
                      </td>

                      {/* Daily added */}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 font-medium">
                          +{p.daily_added}
                        </span>
                      </td>

                      {/* Avg rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <RatingStars rating={p.avg_rating} />
                          <span className="text-xs text-secondary-text">{p.avg_rating.toFixed(1)}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable detail panel */}
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <ProductDetailPanel p={p} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && productFilter.trim() && (
            <div className="px-6 py-8 text-center text-xs text-secondary-text">
              No products found matching "<span className="font-medium text-primary-text">{productFilter}</span>"
            </div>
          )}

          {data.per_product.length > 15 && (
            <div className="px-6 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-xs text-primary font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${data.per_product.length} products`}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-12 text-secondary-text text-sm">Select a company to view review metrics.</div>
      )}
    </div>
  );
};

export default ProductReviewMetricsTab;
