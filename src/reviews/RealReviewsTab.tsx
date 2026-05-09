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
}> = ({ review, absoluteIndex, togglingKey, toggleKey, onToggle }) => (
  <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-primary-text text-sm">{review.user_name}</span>
          {review.verified_batch && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
              <span className="material-symbols-outlined !text-[12px]">verified</span>
              Verified
            </span>
          )}
          {review.published && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
              <span className="material-symbols-outlined !text-[12px]">publish</span>
              Published
            </span>
          )}
          {review.source && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
              <span className="material-symbols-outlined !text-[12px]">edit_note</span>
              {review.source}
            </span>
          )}
        </div>
        <StarRating rating={parseFloat(review.rating)} />
        {review.title && <p className="text-sm font-semibold text-primary-text mt-1.5">{review.title}</p>}
        {review.review_text && <p className="text-sm text-secondary-text mt-1 leading-relaxed">{review.review_text}</p>}
        {review.images?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {review.images.map((media, mIdx) => {
              if (typeof media === 'string') return null;
              const isVideo = media.content_type?.startsWith('video/');
              return isVideo ? (
                <video key={mIdx} src={media.s3_url} controls className="h-24 rounded-lg border border-gray-200 bg-black" />
              ) : (
                <img
                  key={mIdx}
                  src={media.s3_url}
                  alt={media.filename}
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(media.s3_url, '_blank')}
                />
              );
            })}
          </div>
        )}
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-2">
        <p className="text-xs text-secondary-text">{review.date}</p>
        {review.location && (
          <p className="text-xs text-secondary-text flex items-center justify-end gap-0.5">
            <span className="material-symbols-outlined !text-[12px]">location_on</span>
            {review.location}
          </p>
        )}
        <button
          onClick={onToggle}
          disabled={togglingKey === toggleKey}
          className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            review.published
              ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
          }`}
        >
          {togglingKey === toggleKey ? (
            <span className="material-symbols-outlined !text-[14px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined !text-[14px]">
              {review.published ? 'visibility' : 'visibility_off'}
            </span>
          )}
          {review.published ? 'Published' : 'Unpublished'}
        </button>
      </div>
    </div>
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600 !text-[20px]">verified</span>
          </div>
          <div>
            <h2 className="text-primary-text font-semibold text-base">View Real Reviews</h2>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
          {(['product', 'company'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); reset(); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text hover:text-primary-text'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined !text-[16px]">
                  {mode === 'product' ? 'inventory_2' : 'domain'}
                </span>
                {mode === 'product' ? 'Product Wise' : 'Company Wise'}
              </span>
            </button>
          ))}
        </div>

        {/* Published filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-primary-text">Status:</span>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
            {(['all', 'published', 'unpublished'] as PublishedFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => { setPublishedFilter(filter); reset(); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  publishedFilter === filter ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {filter === 'all' ? 'All' : filter === 'published' ? 'Published' : 'Unpublished'}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 mb-4 ${
          isCompanyAutoSelected
            ? 'grid-cols-1'
            : viewMode === 'product'
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-1 max-w-md'
        }`}>
          {!isCompanyAutoSelected && (
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">
                Select Company <span className="text-red-500">*</span>
              </label>
              {renderSearchableCompanyDropdown(
                false,
                (id) => { setSelectedCompany(id); reset(); },
                'Select company...',
                'focus:ring-green-500/20 focus:border-green-500'
              )}
            </div>
          )}
          {viewMode === 'product' && (
            <div>
              <label className="block text-sm font-medium text-primary-text mb-1.5">
                Select Product <span className="text-red-500">*</span>
              </label>
              {renderSearchableProductDropdown(
                !selectedCompany,
                (id) => { setSelectedProduct(id); reset(); },
                'Select product...',
                'focus:ring-green-500/20 focus:border-green-500'
              )}
            </div>
          )}
        </div>

        <button
          onClick={fetchRealReviews}
          disabled={loading || !selectedCompany || (viewMode === 'product' && !selectedProduct)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
        >
          <span className="material-symbols-outlined !text-[18px]">search</span>
          View Real Reviews
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">error</span>
            {error}
          </p>
        )}
      </div>

      {/* Results — Product Wise */}
      {fetched && viewMode === 'product' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-primary-text font-semibold text-sm">
                {totalReviews} Real Review{totalReviews !== 1 ? 's' : ''}
              </span>
              {overallRating > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-secondary-text">
                  <StarRating rating={Math.round(overallRating)} />
                  <span className="font-medium text-primary-text">{overallRating}</span>
                </span>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-secondary-text">
              <span className="material-symbols-outlined !text-[48px] mb-3 text-gray-300">rate_review</span>
              <p className="text-sm font-medium">No real reviews found</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
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
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-secondary-text">
                  Showing {Math.min((currentPage - 1) * reviewsPerPage + 1, reviews.length)} to {Math.min(currentPage * reviewsPerPage, reviews.length)} of {reviews.length} reviews
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
                    </button>
                    <span className="text-sm text-secondary-text">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                      <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <span className="text-primary-text font-semibold text-sm">
                {companyTotal} Real Review{companyTotal !== 1 ? 's' : ''}
              </span>
              <span className="text-secondary-text text-sm ml-2">across {productGroups.length} product{productGroups.length !== 1 ? 's' : ''}</span>
            </div>
            {allReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-secondary-text">
                <span className="material-symbols-outlined !text-[48px] mb-3 text-gray-300">rate_review</span>
                <p className="text-sm font-medium">No real reviews found for this company</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {cPaginated.map(({ review, productId, productIndex }, idx) => {
                    const toggleKey = `${productId}-${productIndex}`;
                    return (
                      <div key={idx}>
                        <div className="px-6 pt-3 pb-0">
                          <span className="inline-flex items-center gap-1 text-xs text-secondary-text bg-gray-100 px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined !text-[11px]">inventory_2</span>
                            {productId}
                          </span>
                        </div>
                        <ReviewCard
                          review={review}
                          absoluteIndex={productIndex}
                          togglingKey={togglingKey}
                          toggleKey={toggleKey}
                          onToggle={() => togglePublished(productId, productIndex, toggleKey)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-secondary-text">
                    Showing {Math.min((companyPage - 1) * reviewsPerPage + 1, allReviews.length)} to {Math.min(companyPage * reviewsPerPage, allReviews.length)} of {allReviews.length} reviews
                  </span>
                  {cTotalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCompanyPage((p) => Math.max(1, p - 1))} disabled={companyPage === 1}
                        className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
                      </button>
                      <span className="text-sm text-secondary-text">Page {companyPage} of {cTotalPages}</span>
                      <button onClick={() => setCompanyPage((p) => Math.min(cTotalPages, p + 1))} disabled={companyPage === cTotalPages}
                        className="p-1 text-secondary-text hover:text-primary-text disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
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
