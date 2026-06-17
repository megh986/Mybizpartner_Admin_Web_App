import React, { useState, useEffect } from 'react';
import type { ReviewsTabProps } from './ReviewsTab';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface MediaItem {
  filename: string;
  content_type: string;
  s3_url: string;
}

interface RealReview {
  title: string;
  review_text: string;
  date: string;
  location: string;
  user_name: string;
  rating: string;
  verified_batch: boolean;
  published: boolean;
  source?: string;
  images: (string | MediaItem)[];
}

interface ProductGroup {
  product_id: string;
  overall_rating: number;
  total_reviews: number;
  reviews: RealReview[];
}

type ViewMode = 'product' | 'company';
type PublishedFilter = 'all' | 'published' | 'unpublished';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`material-symbols-outlined !text-[16px] ${s <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    ))}
  </span>
);

const ReviewCard: React.FC<{
  review: RealReview;
  absoluteIndex: number;
  togglingKey: string | null;
  toggleKey: string;
  onToggle: () => void;
  productId?: string;
}> = ({ review, absoluteIndex, togglingKey, toggleKey, onToggle, productId }) => (
  <div className="p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group">
    <div>
      {/* Product ID tag if company-wise mode */}
      {productId && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary-text bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
            <span className="material-symbols-outlined !text-[10px]">inventory_2</span>
            {productId}
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-xs text-slate-800">{review.user_name || 'Anonymous'}</span>
          {review.verified_batch && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-green-700 bg-green-50 px-1.5 py-0.2 rounded-full border border-green-100">
              <span className="material-symbols-outlined !text-[9px]">verified</span>
              Verified
            </span>
          )}
          {review.published && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-100">
              <span className="material-symbols-outlined !text-[9px]">publish</span>
              Published
            </span>
          )}
          {review.source && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded-full border border-gray-200">
              <span className="material-symbols-outlined !text-[9px]">edit_note</span>
              {review.source}
            </span>
          )}
        </div>

        <button
          onClick={onToggle}
          disabled={togglingKey === toggleKey}
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors disabled:opacity-50 ${
            review.published
              ? 'bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-700 border border-green-100 hover:border-red-100'
              : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-100'
          }`}
        >
          {togglingKey === toggleKey ? (
            <span className="material-symbols-outlined !text-[10px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined !text-[10px]">
              {review.published ? 'visibility' : 'visibility_off'}
            </span>
          )}
          {review.published ? 'Published' : 'Unpublished'}
        </button>
      </div>

      <div className="mb-1">
        <StarRating rating={parseFloat(review.rating)} />
      </div>

      {review.title && <h4 className="text-xs font-bold text-slate-900 mt-1 mb-1 tracking-tight">{review.title}</h4>}
      {review.review_text && <p className="text-xs text-slate-600 leading-relaxed">{review.review_text}</p>}

      {review.images?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {review.images.map((media, mIdx) => {
            if (typeof media === 'string') return null;
            const isVideo = media.content_type?.startsWith('video/');
            return isVideo ? (
              <video key={mIdx} src={media.s3_url} controls className="h-10 rounded border border-gray-200 bg-black shrink-0" />
            ) : (
              <img
                key={mIdx}
                src={media.s3_url}
                alt={media.filename}
                className="h-10 w-10 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                onClick={() => window.open(media.s3_url, '_blank')}
              />
            );
          })}
        </div>
      )}
    </div>

    {/* Footer metadata */}
    {(review.date || review.location) && (
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400">
        {review.date && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[12px]">calendar_today</span>
            {review.date}
          </span>
        )}
        {review.location && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[12px]">location_on</span>
            {review.location}
          </span>
        )}
      </div>
    )}
  </div>
);

const RealReviewsTab: React.FC<ReviewsTabProps> = ({
  selectedCompany,
  selectedProduct,
  loading,
  error,
  setError,
  setLoading,
  setSelectedCompany,
  setSelectedProduct,
  isCompanyAutoSelected,
  renderSearchableCompanyDropdown,
  renderSearchableProductDropdown,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(isCompanyAutoSelected ? 'company' : 'product');
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('all');

  // Product mode state
  const [reviews, setReviews] = useState<RealReview[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [overallRating, setOverallRating] = useState(0);

  // Company mode state
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [companyTotal, setCompanyTotal] = useState(0);

  const [fetched, setFetched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const reviewsPerPage = 10;
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    const gsap = (window as any).gsap;
    if (gsap) {
      gsap.to('.gsap-tab-floater-emerald-1', {
        y: -4,
        x: 2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
      gsap.to('.gsap-tab-floater-emerald-2', {
        y: 4,
        x: -2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 0.3
      });
    }
  }, []);

  const reset = () => { setFetched(false); setReviews([]); setProductGroups([]); setCompanyPage(1); };

  const fetchRealReviews = async () => {
    if (!selectedCompany) { setError('Please select a company'); return; }
    if (viewMode === 'product' && !selectedProduct) { setError('Please select a product'); return; }
    try {
      setLoading(true);
      setError('');
      const sessionToken = localStorage.getItem('session_token');
      const publishedParam =
        publishedFilter === 'published' ? '?published=true' : publishedFilter === 'unpublished' ? '?published=false' : '';
      if (viewMode === 'product') {
        const res = await fetch(`${API_BASE_URL}/real-reviews/${selectedCompany}/${selectedProduct}${publishedParam}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalReviews(data.total_reviews || 0);
        setOverallRating(data.overall_rating || 0);
      } else {
        const res = await fetch(`${API_BASE_URL}/real-reviews/${selectedCompany}${publishedParam}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        setProductGroups(data.products || []);
        setCompanyTotal(data.total_reviews || 0);
      }
      setFetched(true);
      setCurrentPage(1);
      setCompanyPage(1);
    } catch (err) {
      setError('Error fetching real reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany && viewMode === 'company' && !fetched) {
      fetchRealReviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, viewMode]);

  const togglePublished = async (productId: string, reviewIndex: number, toggleKey: string) => {
    setTogglingKey(toggleKey);
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/real-reviews/${selectedCompany}/${productId}/${reviewIndex}/published`,
        { method: 'PATCH', headers: { 'Authorization': `Bearer ${sessionToken}` } }
      );
      const data = await res.json();
      if (res.ok) {
        if (viewMode === 'product') {
          setReviews((prev) => prev.map((r, i) => i === reviewIndex ? { ...r, published: data.published } : r));
        } else {
          setProductGroups((prev) => prev.map((pg) =>
            pg.product_id === productId
              ? { ...pg, reviews: pg.reviews.map((r, i) => i === reviewIndex ? { ...r, published: data.published } : r) }
              : pg
          ));
        }
      }
    } catch (err) {
      console.error('Error toggling published', err);
    } finally {
      setTogglingKey(null);
    }
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = reviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

  return (
    <div className="flex flex-col gap-6">
      {/* Selector card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative z-10">
        {/* Decorative Floating Elements */}
        <div className="absolute -right-3 -top-3 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shadow-md border border-white gsap-tab-floater-emerald-1 pointer-events-none z-50">
          <span className="material-symbols-outlined text-emerald-600 !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        </div>
        <div className="absolute -left-3 -bottom-3 w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shadow-md border border-white gsap-tab-floater-emerald-2 pointer-events-none z-50">
          <span className="material-symbols-outlined text-teal-500 !text-[12px]">shield</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 !text-[20px]">verified</span>
            <h2 className="text-sm font-bold text-primary-text">View Real Reviews</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View mode toggle */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/50 shadow-sm">
              {(['product', 'company'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setViewMode(mode); reset(); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    viewMode === mode
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-600 hover:text-primary-text'
                  }`}
                >
                  <span className="material-symbols-outlined !text-[14px]">
                    {mode === 'product' ? 'inventory_2' : 'domain'}
                  </span>
                  {mode === 'product' ? 'Product Wise' : 'Company Wise'}
                </button>
              ))}
            </div>

            {/* Published filter */}
            <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/50 shadow-sm">
              {(['all', 'published', 'unpublished'] as PublishedFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => { setPublishedFilter(filter); reset(); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    publishedFilter === filter
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-600 hover:text-primary-text'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'published' ? 'Published' : 'Unpublished'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3.5" style={{ overflow: 'visible' }}>
          {!isCompanyAutoSelected && (
            <div className="flex-1 relative z-30">
              <label className="block text-xs font-semibold text-primary-text mb-1">Company Name</label>
              {renderSearchableCompanyDropdown(
                loading,
                (id) => { setSelectedCompany(id); reset(); },
                'Select company...',
                'focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600'
              )}
            </div>
          )}
          {viewMode === 'product' && (
            <div className="flex-1 relative z-20">
              <label className="block text-xs font-semibold text-primary-text mb-1">Product Name</label>
              {renderSearchableProductDropdown(
                !selectedCompany || loading,
                (id) => { setSelectedProduct(id); reset(); },
                'Select product...',
                'focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600'
              )}
            </div>
          )}
          <button
            onClick={fetchRealReviews}
            disabled={loading || !selectedCompany || (viewMode === 'product' && !selectedProduct)}
            className="px-6 md:w-auto h-[46px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 whitespace-nowrap"
          >
            <span className="material-symbols-outlined !text-[18px]">search</span>
            {loading ? 'Loading...' : 'View Real Reviews'}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 flex items-center gap-1">
            <span className="material-symbols-outlined !text-[14px]">error</span>
            {error}
          </p>
        )}
      </div>

      {/* Results — Product Wise */}
      {fetched && viewMode === 'product' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-primary-text font-bold text-sm">
                {totalReviews} Real Review{totalReviews !== 1 ? 's' : ''}
              </span>
              {overallRating > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-secondary-text">
                  <StarRating rating={Math.round(overallRating)} />
                  <span className="font-semibold text-primary-text">{overallRating}</span>
                </span>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-text">
              <span className="material-symbols-outlined !text-[40px] mb-2 text-gray-300">rate_review</span>
              <p className="text-xs font-semibold">No real reviews found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50/30 border-b border-gray-100">
                {paginatedReviews.map((review, idx) => {
                  const absoluteIndex = (currentPage - 1) * reviewsPerPage + idx;
                  const toggleKey = `${selectedProduct}-${absoluteIndex}`;
                  return (
                    <ReviewCard
                      key={idx}
                      review={review}
                      absoluteIndex={absoluteIndex}
                      togglingKey={togglingKey}
                      toggleKey={toggleKey}
                      onToggle={() => togglePublished(selectedProduct, absoluteIndex, toggleKey)}
                    />
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-secondary-text">
                  Showing {Math.min((currentPage - 1) * reviewsPerPage + 1, reviews.length)} to {Math.min(currentPage * reviewsPerPage, reviews.length)} of {reviews.length} reviews
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                    </button>
                    <span className="text-xs text-secondary-text">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Results — Company Wise */}
      {fetched && viewMode === 'company' && (() => {
        const allReviews = productGroups.flatMap((pg) =>
          pg.reviews.map((r, i) => ({ review: r, productId: pg.product_id, productIndex: i }))
        );
        const cTotalPages = Math.ceil(allReviews.length / reviewsPerPage);
        const cPaginated = allReviews.slice((companyPage - 1) * reviewsPerPage, companyPage * reviewsPerPage);
        return (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-primary-text font-bold text-sm">
                  {companyTotal} Real Review{companyTotal !== 1 ? 's' : ''}
                </span>
                <span className="text-secondary-text text-xs ml-2">across {productGroups.length} product{productGroups.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {allReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-secondary-text">
                <span className="material-symbols-outlined !text-[40px] mb-2 text-gray-300">rate_review</span>
                <p className="text-xs font-semibold">No real reviews found for this company</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-slate-50/30 border-b border-gray-100">
                  {cPaginated.map(({ review, productId, productIndex }, idx) => {
                    const toggleKey = `${productId}-${productIndex}`;
                    return (
                      <ReviewCard
                        key={idx}
                        review={review}
                        absoluteIndex={productIndex}
                        togglingKey={togglingKey}
                        toggleKey={toggleKey}
                        onToggle={() => togglePublished(productId, productIndex, toggleKey)}
                        productId={productId}
                      />
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-secondary-text">
                    Showing {Math.min((companyPage - 1) * reviewsPerPage + 1, allReviews.length)} to {Math.min(companyPage * reviewsPerPage, allReviews.length)} of {allReviews.length} reviews
                  </span>
                  {cTotalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCompanyPage((p) => Math.max(1, p - 1))} disabled={companyPage === 1}
                        className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                      </button>
                      <span className="text-xs text-secondary-text">Page {companyPage} of {cTotalPages}</span>
                      <button onClick={() => setCompanyPage((p) => Math.min(cTotalPages, p + 1))} disabled={companyPage === cTotalPages}
                        className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default RealReviewsTab;
