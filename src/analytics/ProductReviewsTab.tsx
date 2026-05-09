import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  ProductReview,
  ProductReviewsApiResponse,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface Product {
  _id: string;
  name: string;
  product_id: string;
  company_id: string;
}

interface ProductReviewsTabProps {
  selectedCompany: string;
  companyName: string;
  products: Product[];
}

const ProductReviewsTab: React.FC<ProductReviewsTabProps> = ({
  selectedCompany,
  companyName,
  products,
}) => {
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProductReviews = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/analytics/products/${selectedCompany}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      const data: ProductReviewsApiResponse = await res.json();
      if (data.success) {
        setProductReviews(data.products ?? []);
      } else {
        setError('Failed to load product reviews');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching product analytics. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    fetchProductReviews();
  }, [fetchProductReviews]);

  const totals = useMemo(() => {
    const totalReviewsToday = productReviews.reduce((sum, p) => sum + p.reviews_today, 0);
    const totalAllReviews = productReviews.reduce((sum, p) => sum + p.total_reviews, 0);
    const avgDailyReviews = productReviews.reduce((sum, p) => sum + p.daily_average, 0);
    return {
      totalReviewsToday,
      totalAllReviews,
      avgDailyReviews,
      productCount: productReviews.length,
    };
  }, [productReviews]);

  const sourceLabel: Record<string, string> = {
    generated: 'AI Generated',
    actual_customer: 'Real Customer',
    marketplace: 'Marketplace',
    untagged: 'Untagged',
  };
  const sourceColor: Record<string, { bg: string; text: string; bar: string }> = {
    generated:       { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-400' },
    actual_customer: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
    marketplace:     { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-400' },
    untagged:        { bg: 'bg-gray-50',   text: 'text-gray-500',   bar: 'bg-gray-300' },
  };
  const fallbackColor = { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-400' };

  // Loading state
  if (loading && productReviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-secondary-text text-sm">Loading product analytics…</p>
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
            onClick={fetchProductReviews}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
        <h3 className="text-lg font-bold text-primary-text mb-2">No Products Found</h3>
        <p className="text-secondary-text text-sm text-center max-w-md">
          No products are listed for <strong>{companyName}</strong>. Please add products to see review analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Company Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <span className="material-symbols-outlined">business</span>
          </div>
          <div>
            <p className="text-xs text-secondary-text">Product reviews for</p>
            <p className="text-lg font-bold text-primary-text">{companyName}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <span className="material-symbols-outlined text-blue-600 !text-[18px]">inventory_2</span>
            <span className="text-sm font-medium text-blue-700">{products.length} Products Listed</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined !text-[24px]">today</span>
            <span className="text-sm font-medium text-white/80">Reviews Today</span>
          </div>
          <p className="text-3xl font-bold">{totals.totalReviewsToday}</p>
          <p className="text-xs text-white/70 mt-1">across all products</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined !text-[24px]">reviews</span>
            <span className="text-sm font-medium text-white/80">Total Reviews</span>
          </div>
          <p className="text-3xl font-bold">{totals.totalAllReviews.toLocaleString()}</p>
          <p className="text-xs text-white/70 mt-1">all time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined !text-[24px]">trending_up</span>
            <span className="text-sm font-medium text-white/80">Daily Average</span>
          </div>
          <p className="text-3xl font-bold">{totals.avgDailyReviews.toFixed(1)}</p>
          <p className="text-xs text-white/70 mt-1">reviews per day (all products)</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined !text-[24px]">inventory_2</span>
            <span className="text-sm font-medium text-white/80">Active Products</span>
          </div>
          <p className="text-3xl font-bold">{totals.productCount}</p>
          <p className="text-xs text-white/70 mt-1">with reviews</p>
        </div>
      </div>

      {/* Product Reviews Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <span className="material-symbols-outlined">list_alt</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-text">Product-wise Reviews</h2>
              <p className="text-xs text-secondary-text mt-0.5">Click a product to see source breakdown</p>
            </div>
          </div>
          <button
            onClick={fetchProductReviews}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-secondary-text hover:text-primary-text rounded-lg transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined !text-[18px]">refresh</span>
            Refresh Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 w-8"><span className="sr-only">Expand</span></th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-text uppercase tracking-wider">Today</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-text uppercase tracking-wider">Daily Avg</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-text uppercase tracking-wider">Total Reviews</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-text uppercase tracking-wider">Stars</th>
              </tr>
            </thead>
            <tbody>
              {productReviews.map((product, index) => {
                const isOpen = selectedProduct === product.product_id;
                return (
                  <React.Fragment key={product.product_id}>
                    {/* Product row */}
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isOpen ? 'bg-purple-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() =>
                        setSelectedProduct(isOpen ? null : product.product_id)
                      }
                    >
                      {/* Chevron */}
                      <td className="px-6 py-4">
                        <span className={`material-symbols-outlined !text-[18px] text-gray-400 inline-block transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                          chevron_right
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                              ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500'][index % 6]
                            }`}
                          >
                            {(product.product_name || product.product_id).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary-text">{product.product_name}</p>
                            <p className="text-xs text-secondary-text">{product.product_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                          +{product.reviews_today}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-primary-text">{product.daily_average.toFixed(1)}</span>
                        <span className="text-xs text-secondary-text ml-1">/day</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-primary-text">{product.total_reviews}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 min-w-[80px]">
                          {['5', '4', '3', '2', '1'].map((star) => {
                            const count = product.star_breakdown?.[star] ?? 0;
                            const total = product.total_reviews || 1;
                            const pct = Math.round((count / total) * 100);
                            const filled = Math.round(pct / 10); // 0–10 segments
                            return (
                              <div key={star} className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-400 w-3 shrink-0">{star}★</span>
                                <div className="flex gap-px flex-1">
                                  {Array.from({ length: 10 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className={`h-1.5 flex-1 rounded-sm ${i < filled ? 'bg-amber-400' : 'bg-gray-100'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[9px] text-gray-400 w-4 text-right shrink-0">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>

                    {/* Inline source breakdown — renders immediately below the clicked row */}
                    {isOpen && (
                      <tr className="bg-purple-50/40">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Real reviews highlight */}
                            <div className="flex items-center gap-4 bg-purple-100 rounded-xl px-5 py-4">
                              <span className="material-symbols-outlined text-purple-600 !text-[32px]">person_check</span>
                              <div>
                                <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Real Customer Reviews</p>
                                <p className="text-3xl font-bold text-purple-700">{product.real_review_count ?? 0}</p>
                                <p className="text-xs text-purple-500 mt-0.5">
                                  {product.total_reviews > 0
                                    ? `${Math.round(((product.real_review_count ?? 0) / product.total_reviews) * 100)}% of total`
                                    : 'no reviews yet'}
                                </p>
                              </div>
                            </div>

                            {/* Source breakdown */}
                            <div>
                              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">Reviews by Source</p>
                              {!product.source_breakdown || Object.keys(product.source_breakdown).length === 0 ? (
                                <p className="text-xs text-secondary-text italic">No reviews yet</p>
                              ) : (
                                <div className="space-y-2">
                                  {Object.entries(product.source_breakdown)
                                    .filter(([, cnt]) => cnt > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([src, cnt]) => {
                                      const col = sourceColor[src] ?? fallbackColor;
                                      const pct = product.total_reviews > 0
                                        ? Math.round((cnt / product.total_reviews) * 100)
                                        : 0;
                                      const filled = Math.round(pct / 10);
                                      return (
                                        <div key={src} className="flex items-center gap-3">
                                          <span className={`text-xs font-medium w-28 shrink-0 capitalize ${col.text}`}>
                                            {sourceLabel[src] ?? src.replace(/_/g, ' ')}
                                          </span>
                                          <div className="flex gap-px flex-1">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                              <div key={i} className={`h-2 flex-1 rounded-sm ${i < filled ? col.bar : 'bg-gray-200'}`} />
                                            ))}
                                          </div>
                                          <span className={`text-xs font-bold w-8 text-right ${col.text}`}>{cnt}</span>
                                          <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-6 py-4" />
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-primary-text">TOTAL</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-500 text-white">
                    +{totals.totalReviewsToday}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-bold text-primary-text">{totals.avgDailyReviews.toFixed(1)}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xl font-bold text-primary-text">{totals.totalAllReviews.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <span className="material-symbols-outlined !text-[18px]">trending_up</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-medium text-white/80 mb-1">Grand Total of All Reviews</h3>
            <p className="text-4xl font-bold">{totals.totalAllReviews.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
            <span className="material-symbols-outlined">verified</span>
            <span className="text-sm font-medium">Verified Reviews</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/70">
            Based on {totals.productCount} active products with an average of{' '}
            {totals.productCount > 0 ? (totals.avgDailyReviews / totals.productCount).toFixed(1) : '0'} reviews per
            product per day
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsTab;
