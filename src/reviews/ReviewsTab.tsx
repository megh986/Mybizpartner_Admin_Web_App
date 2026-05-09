import React, { useState, useEffect } from 'react';
import type {
  Company,
  Product,
  Review,
  ReviewImage,
  ReviewResponse,
} from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

export interface ReviewsTabProps {
  userData: { role?: string; company_ids?: string[] } | null;
  companies: Company[];
  products: Product[];
  selectedCompany: string;
  selectedProduct: string;
  loading: boolean;
  error: string;
  success: string;
  setError: (s: string) => void;
  setSuccess: (s: string) => void;
  setLoading: (b: boolean) => void;
  setSelectedCompany: (id: string) => void;
  setSelectedProduct: (id: string) => void;
  isCompanyAutoSelected: boolean;
  renderSearchableCompanyDropdown: (
    disabled: boolean,
    onCompanyChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
  renderSearchableProductDropdown: (
    disabled: boolean,
    onProductChange: (id: string) => void,
    placeholder: string,
    focusRingColor: string
  ) => React.ReactNode;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({
  userData,
  companies,
  products,
  selectedCompany,
  selectedProduct,
  loading,
  error,
  success,
  setError,
  setSuccess,
  setLoading,
  setSelectedCompany,
  setSelectedProduct,
  isCompanyAutoSelected,
  renderSearchableCompanyDropdown,
  renderSearchableProductDropdown,
}) => {
  const [reviewResult, setReviewResult] = useState<ReviewResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterWithImages, setFilterWithImages] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    review_text: string;
    rating: string;
    user_name: string;
    date: string;
    location: string;
    images: File[];
    imagesToDelete: string[];
  }>({
    title: '',
    review_text: '',
    rating: '5',
    user_name: '',
    date: '',
    location: '',
    images: [],
    imagesToDelete: [],
  });

  const [isEditingStats, setIsEditingStats] = useState(false);
  const [editRating, setEditRating] = useState('0');
  const [editTotalReviews, setEditTotalReviews] = useState('0');

  const [isEditingHighlights, setIsEditingHighlights] = useState(false);
  const [editHighlights, setEditHighlights] = useState<{
    keywords: string[];
    summary: string;
    customer_mentions: string[];
    social_proof_keywords: string[];
  }>({
    keywords: [],
    summary: '',
    customer_mentions: [],
    social_proof_keywords: [],
  });

  const [documentFields, setDocumentFields] = useState<{
    company_info: string;
    highlights: { keywords: string[]; summary: string };
    customer_mentions: string[];
    social_proof_keywords: string[];
    extras: { return_rate: string };
  }>({
    company_info: '',
    highlights: { keywords: [], summary: '' },
    customer_mentions: [],
    social_proof_keywords: [],
    extras: { return_rate: '' },
  });

  useEffect(() => {
    setReviewResult(null);
  }, [selectedCompany, selectedProduct]);

  const fetchReviews = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setReviewResult(null);

      const url = `${IMAGE_API_BASE_URL}/reviews/${selectedCompany}/${selectedProduct}`;
      const response = await fetch(url);

      if (!response.ok) {
        setError('Failed to fetch reviews');
        return;
      }

      const data: Record<string, unknown> = await response.json();

      if (data && data.success) {
        setReviewResult({
          success: true,
          reviews: (data.reviews as Review[]) || [],
          total_reviews: (data.total_reviews as number) || 0,
          overall_rating: (data.overall_rating as number) || 0,
          company_info: data.company_info as string,
          highlights: data.highlights as { keywords?: string[]; summary?: string },
          customer_mentions: (data.highlights as { customer_mentions?: string[] })?.customer_mentions || [],
          social_proof_keywords: (data.social_proof_keywords as string[]) || [],
          extras: data.extras as { return_rate?: string },
        });

        const highlights = (data.highlights as { keywords?: string[]; summary?: string; customer_mentions?: string[] }) || {};
        setDocumentFields({
          company_info: (data.company_info as string) || '',
          highlights: {
            keywords: highlights.keywords || [],
            summary: highlights.summary || '',
          },
          customer_mentions: highlights.customer_mentions || [],
          social_proof_keywords: (data.social_proof_keywords as string[]) || [],
          extras: { return_rate: (data.extras as { return_rate?: string })?.return_rate ?? '' },
        });

        setCurrentPage(1);
      } else {
        setError((data.message as string) || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Error fetching reviews. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (review: Review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReviewToDelete(null);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete || !selectedCompany || !selectedProduct) return;
    if (reviewToDelete.original_index === undefined) {
      setError('Cannot delete review: original index not found');
      closeDeleteDialog();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const url = `${IMAGE_API_BASE_URL}/reviews/${selectedCompany}/${selectedProduct}/${reviewToDelete.original_index}`;
      const response = await fetch(url, { method: 'DELETE' });

      if (!response.ok) {
        const errorData = await response.json();
        setError((errorData as { message?: string }).message || 'Failed to delete review');
        return;
      }

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (data?.success) {
        await fetchReviews();
        closeDeleteDialog();
        setSuccess('Review deleted successfully');
      } else {
        setError(data.message || 'Failed to delete review');
      }
    } catch (err) {
      setError('Error deleting review. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (review: Review) => {
    setReviewToEdit(review);
    setEditFormData({
      title: review.title || '',
      review_text: review.review_text || '',
      rating: String(review.rating || '5'),
      user_name: review.user_name || '',
      date: review.date || '',
      location: review.location || '',
      images: [],
      imagesToDelete: [],
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setReviewToEdit(null);
    setEditFormData({
      title: '',
      review_text: '',
      rating: '5',
      user_name: '',
      date: '',
      location: '',
      images: [],
      imagesToDelete: [],
    });
  };

  const handleEditFormChange = (field: string, value: string | File[]) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFormData((prev) => ({ ...prev, images: Array.from(e.target.files!) }));
    }
  };

  const deleteImageFromEdit = (imageId: string, imageIndex: number) => {
    setEditFormData((prev) => ({ ...prev, imagesToDelete: [...prev.imagesToDelete, imageId] }));
    if (reviewToEdit?.images && Array.isArray(reviewToEdit.images)) {
      const filteredImages: (ReviewImage | string)[] = [];
      reviewToEdit.images.forEach((img: ReviewImage | string, idx: number) => {
        if (typeof img === 'object' && img && 'id' in img && img.id) {
          if (img.id !== imageId) filteredImages.push(img);
        } else if (idx !== imageIndex) {
          filteredImages.push(img);
        }
      });
      setReviewToEdit({ ...reviewToEdit, images: filteredImages as ReviewImage[] | string[] });
    }
  };

  const confirmEditReview = async () => {
    if (!reviewToEdit || !selectedCompany || !selectedProduct) return;
    if (reviewToEdit.original_index === undefined) {
      setError('Cannot edit review: original index not found');
      closeEditDialog();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('title', editFormData.title);
      formData.append('review_text', editFormData.review_text);
      formData.append('rating', editFormData.rating);
      formData.append('user_name', editFormData.user_name);
      formData.append('date', editFormData.date);
      formData.append('location', editFormData.location);
      editFormData.images.forEach((image) => formData.append('images', image));
      editFormData.imagesToDelete.forEach((id) => formData.append('images_to_delete', id));

      const url = `${IMAGE_API_BASE_URL}/reviews/${selectedCompany}/${selectedProduct}/${reviewToEdit.original_index}`;
      const response = await fetch(url, { method: 'PUT', body: formData });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        setError(errorData.message || 'Failed to update review');
        return;
      }

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (data?.success) {
        await fetchReviews();
        closeEditDialog();
        setSuccess('Review updated successfully');
      } else {
        setError(data.message || 'Failed to update review');
      }
    } catch (err) {
      setError('Error updating review. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditingStats = () => {
    setEditRating(reviewResult?.overall_rating?.toFixed(1) || '0');
    setEditTotalReviews(reviewResult?.total_reviews?.toString() || '0');
    setIsEditingStats(true);
  };

  const cancelEditingStats = () => {
    setIsEditingStats(false);
    setEditRating('0');
    setEditTotalReviews('0');
  };

  const handleRatingChange = (value: string) => {
    if (value === '') {
      setEditRating('');
      return;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setEditRating('0');
      return;
    }
    setEditRating(Math.min(5, Math.max(0, numValue)).toFixed(1));
  };

  const handleReviewCountChange = (value: string) => {
    if (value === '') {
      setEditTotalReviews('');
      return;
    }
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      setEditTotalReviews('0');
      return;
    }
    setEditTotalReviews(numValue.toString());
  };

  const updateRatingAndCount = async () => {
    if (!selectedCompany || !selectedProduct) {
      setError('Company and product must be selected');
      return;
    }
    const rating = parseFloat(editRating);
    const totalReviews = parseInt(editTotalReviews, 10);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      setError('Rating must be between 0 and 5');
      return;
    }
    if (isNaN(totalReviews) || totalReviews < 0) {
      setError('Total reviews must be a positive number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('overall_rating', rating.toString());
      formData.append('total_reviews', totalReviews.toString());

      const response = await fetch(
        `${IMAGE_API_BASE_URL}/review-document/${selectedCompany}/${selectedProduct}`,
        { method: 'PUT', body: formData }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        setError(errorData.message || 'Failed to update stats');
        return;
      }

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (data?.success) {
        setSuccess('Stats updated successfully');
        if (reviewResult) {
          setReviewResult({
            ...reviewResult,
            overall_rating: rating,
            total_reviews: totalReviews,
          });
        }
        setIsEditingStats(false);
      } else {
        setError((data as { message?: string }).message || 'Failed to update stats');
      }
    } catch (err) {
      setError('Error updating stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditingHighlights = () => {
    setEditHighlights({
      keywords: [...documentFields.highlights.keywords],
      summary: documentFields.highlights.summary,
      customer_mentions: [...documentFields.customer_mentions],
      social_proof_keywords: [...documentFields.social_proof_keywords],
    });
    setIsEditingHighlights(true);
  };

  const cancelEditingHighlights = () => {
    setIsEditingHighlights(false);
    setEditHighlights({
      keywords: [],
      summary: '',
      customer_mentions: [],
      social_proof_keywords: [],
    });
  };

  const addKeyword = () =>
    setEditHighlights((prev) => ({ ...prev, keywords: [...prev.keywords, ''] }));
  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...editHighlights.keywords];
    newKeywords[index] = value;
    setEditHighlights((prev) => ({ ...prev, keywords: newKeywords }));
  };
  const removeKeyword = (index: number) =>
    setEditHighlights((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, idx) => idx !== index),
    }));

  const addCustomerMention = () =>
    setEditHighlights((prev) => ({ ...prev, customer_mentions: [...prev.customer_mentions, ''] }));
  const updateCustomerMention = (index: number, value: string) => {
    const newMentions = [...editHighlights.customer_mentions];
    newMentions[index] = value;
    setEditHighlights((prev) => ({ ...prev, customer_mentions: newMentions }));
  };
  const removeCustomerMention = (index: number) =>
    setEditHighlights((prev) => ({
      ...prev,
      customer_mentions: prev.customer_mentions.filter((_, idx) => idx !== index),
    }));

  const addSocialProofKeyword = () =>
    setEditHighlights((prev) => ({ ...prev, social_proof_keywords: [...prev.social_proof_keywords, ''] }));
  const updateSocialProofKeyword = (index: number, value: string) => {
    const newKeywords = [...editHighlights.social_proof_keywords];
    newKeywords[index] = value;
    setEditHighlights((prev) => ({ ...prev, social_proof_keywords: newKeywords }));
  };
  const removeSocialProofKeyword = (index: number) =>
    setEditHighlights((prev) => ({
      ...prev,
      social_proof_keywords: prev.social_proof_keywords.filter((_, idx) => idx !== index),
    }));

  const updateHighlights = async () => {
    if (!selectedCompany || !selectedProduct) {
      setError('Company and product must be selected');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const formData = new FormData();
      formData.append('highlights_keywords', JSON.stringify(editHighlights.keywords.filter((k) => k.trim())));
      formData.append('highlights_summary', editHighlights.summary);
      formData.append('customer_mentions', JSON.stringify(editHighlights.customer_mentions.filter((m) => m.trim())));
      formData.append(
        'social_proof_keywords',
        JSON.stringify(editHighlights.social_proof_keywords.filter((k) => k.trim()))
      );

      const response = await fetch(
        `${IMAGE_API_BASE_URL}/review-document/${selectedCompany}/${selectedProduct}`,
        { method: 'PUT', body: formData }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        setError(errorData.message || 'Failed to update highlights');
        return;
      }

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (data?.success) {
        setSuccess('Highlights updated successfully');
        setDocumentFields((prev) => ({
          ...prev,
          highlights: {
            keywords: editHighlights.keywords.filter((k) => k.trim()),
            summary: editHighlights.summary,
          },
          customer_mentions: editHighlights.customer_mentions.filter((m) => m.trim()),
          social_proof_keywords: editHighlights.social_proof_keywords.filter((k) => k.trim()),
        }));
        setIsEditingHighlights(false);
      } else {
        setError((data as { message?: string }).message || 'Failed to update highlights');
      }
    } catch (err) {
      setError('Error updating highlights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setError('');
    setSuccess('');
    setReviewResult(null);
  };

  const handleProductChange = (productId: string) => {
    setSelectedProduct(productId);
    setError('');
    setSuccess('');
    setReviewResult(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined">rate_review</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">View Reviews</h2>
            <p className="text-xs text-secondary-text mt-1">
              {isCompanyAutoSelected
                ? 'Select a product to view and manage reviews'
                : 'Select a company and product to view and manage reviews'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className={`grid gap-4 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`} style={{ overflow: 'visible' }}>
            {!isCompanyAutoSelected && (
              <div className="flex flex-col w-full" style={{ position: 'relative', zIndex: 30 }}>
                <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Select Company *</p>
                {renderSearchableCompanyDropdown(
                  loading,
                  handleCompanyChange,
                  'Select company...',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary'
                )}
              </div>
            )}
            <div className="flex flex-col w-full" style={{ position: 'relative', zIndex: 20 }}>
              <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Select Product *</p>
              {renderSearchableProductDropdown(
                !selectedCompany || loading,
                handleProductChange,
                'Select product...',
                'focus:ring-2 focus:ring-primary/20 focus:border-primary'
              )}
            </div>
          </div>

          <button
            onClick={fetchReviews}
            disabled={loading || !selectedCompany || !selectedProduct}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined !text-[20px]">search</span>
            {loading ? 'Loading...' : 'View Reviews'}
          </button>
        </div>
      </div>

      {reviewResult && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 relative z-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-primary-text">Reviews</h2>

            {!isEditingStats ? (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-yellow-500">star</span>
                  <span className="text-lg font-bold text-primary-text">
                    {reviewResult.overall_rating?.toFixed(1) || '0.0'}
                  </span>
                  <span className="text-sm text-secondary-text">Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">reviews</span>
                  <span className="text-lg font-bold text-primary-text">
                    {reviewResult.total_reviews || 0}
                  </span>
                  <span className="text-sm text-secondary-text whitespace-nowrap">Total Reviews</span>
                </div>
                <button
                  onClick={startEditingStats}
                  disabled={loading}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined !text-[20px]">edit</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-primary-text whitespace-nowrap">Rating (0-5)</label>
                  <input
                    type="number"
                    value={editRating}
                    onChange={(e) => handleRatingChange(e.target.value)}
                    min={0}
                    max={5}
                    step={0.1}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-primary-text whitespace-nowrap">Total Reviews</label>
                  <input
                    type="number"
                    value={editTotalReviews}
                    onChange={(e) => handleReviewCountChange(e.target.value)}
                    min={0}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={updateRatingAndCount}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditingStats}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Highlights Section */}
          {(documentFields.highlights.keywords.length > 0 ||
            documentFields.highlights.summary ||
            documentFields.customer_mentions.length > 0 ||
            documentFields.social_proof_keywords.length > 0 ||
            isEditingHighlights) && (
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary-text">Highlights</h3>
                {!isEditingHighlights && (
                  <button
                    onClick={startEditingHighlights}
                    disabled={loading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[20px]">edit</span>
                  </button>
                )}
              </div>

              {!isEditingHighlights ? (
                <>
                  {documentFields.highlights.summary && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-secondary-text mb-2">Summary</p>
                      <p className="text-sm text-primary-text leading-relaxed">
                        {documentFields.highlights.summary}
                      </p>
                    </div>
                  )}
                  {documentFields.highlights.keywords.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-secondary-text mb-3">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {documentFields.highlights.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {documentFields.customer_mentions.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-secondary-text mb-3">Customer Mentions</p>
                      <div className="space-y-2">
                        {documentFields.customer_mentions.map((mention, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-primary-text">
                            <span className="text-green-600 mt-0.5">✓</span>
                            <span>{mention}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {documentFields.social_proof_keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-secondary-text mb-3">Social Proof Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {documentFields.social_proof_keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-full border border-purple-100"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-secondary-text mb-2 block">Summary</label>
                    <textarea
                      value={editHighlights.summary}
                      onChange={(e) => setEditHighlights((prev) => ({ ...prev, summary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-secondary-text">Keywords</label>
                      <button
                        onClick={addKeyword}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        + Add Keyword
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editHighlights.keywords.map((keyword, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={keyword}
                            onChange={(e) => updateKeyword(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Enter keyword"
                            disabled={loading}
                          />
                          <button
                            onClick={() => removeKeyword(idx)}
                            disabled={loading}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-secondary-text">Customer Mentions</label>
                      <button
                        onClick={addCustomerMention}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        + Add Mention
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editHighlights.customer_mentions.map((mention, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={mention}
                            onChange={(e) => updateCustomerMention(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="e.g., 88% - Note it provides deep hydration..."
                            disabled={loading}
                          />
                          <button
                            onClick={() => removeCustomerMention(idx)}
                            disabled={loading}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-secondary-text">Social Proof Keywords</label>
                      <button
                        onClick={addSocialProofKeyword}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        + Add Keyword
                      </button>
                    </div>
                    <div className="space-y-2">
                      {editHighlights.social_proof_keywords.map((keyword, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={keyword}
                            onChange={(e) => updateSocialProofKeyword(idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Enter social proof keyword"
                            disabled={loading}
                          />
                          <button
                            onClick={() => removeSocialProofKeyword(idx)}
                            disabled={loading}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={updateHighlights}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Highlights'}
                    </button>
                    <button
                      onClick={cancelEditingHighlights}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          {reviewResult.reviews && reviewResult.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 mr-1">
                  <span className="material-symbols-outlined !text-[18px] text-primary">filter_list</span>
                  <span className="text-sm font-semibold text-primary-text">Filters</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined !text-[16px] text-secondary-text">sort</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'newest' | 'oldest');
                      setCurrentPage(1);
                    }}
                    className="text-sm bg-transparent border-none focus:ring-0 outline-none cursor-pointer text-primary-text font-medium"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="material-symbols-outlined !text-[16px] text-yellow-500">star</span>
                  <select
                    value={filterRating}
                    onChange={(e) => {
                      setFilterRating(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-sm bg-transparent border-none focus:ring-0 outline-none cursor-pointer text-primary-text font-medium"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setFilterWithImages(!filterWithImages);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    filterWithImages ? 'bg-primary text-white' : 'bg-gray-50 text-primary-text hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined !text-[16px]">image</span>
                  With Images
                </button>
                {(sortOrder !== 'newest' || filterRating !== 'all' || filterWithImages) && (
                  <button
                    onClick={() => {
                      setSortOrder('newest');
                      setFilterRating('all');
                      setFilterWithImages(false);
                      setCurrentPage(1);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[14px]">close</span>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviewResult.reviews && reviewResult.reviews.length > 0 ? (
            (() => {
              let filteredReviews = [...reviewResult.reviews];
              if (filterRating !== 'all') {
                filteredReviews = filteredReviews.filter((review) => {
                  const rating =
                    typeof review.rating === 'string' ? parseFloat(review.rating) : review.rating;
                  return rating !== undefined && Math.floor(rating) === parseInt(filterRating, 10);
                });
              }
              if (filterWithImages) {
                filteredReviews = filteredReviews.filter((r) => r.images && r.images.length > 0);
              }
              filteredReviews.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
              });

              const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
              const indexOfLastReview = currentPage * reviewsPerPage;
              const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
              const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);

              return (
                <>
                  <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">filter_list_off</span>
                        <p className="text-secondary-text">No reviews match the selected filters</p>
                      </div>
                    ) : (
                    currentReviews.map((review, index) => (
                      <div
                        key={review._id || index}
                        className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            {review.review_index && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mb-2">
                                Review #{review.review_index}
                              </span>
                            )}
                            {review.title && (
                              <h4 className="text-base font-semibold text-primary-text">{review.title}</h4>
                            )}
                            {review.user_name && (
                              <p className="text-sm text-secondary-text">by {review.user_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {review.rating && (
                              <span className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                                <span className="material-symbols-outlined !text-[16px]">star</span>
                                {review.rating}
                              </span>
                            )}
                            <button
                              onClick={() => openEditDialog(review)}
                              disabled={loading}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit review"
                            >
                              <span className="material-symbols-outlined !text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteDialog(review)}
                              disabled={loading}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete review"
                            >
                              <span className="material-symbols-outlined !text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-primary-text mb-3">
                          {review.review_text || 'No review text available'}
                        </p>

                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {review.images.map((image: ReviewImage | string, imgIndex: number) => {
                              const imageUrl =
                                typeof image === 'object' && image && 's3_url' in image
                                  ? (image as ReviewImage).s3_url
                                  : typeof image === 'string'
                                    ? image
                                    : null;
                              if (!imageUrl) return null;
                              return (
                                <div
                                  key={imgIndex}
                                  className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer border border-gray-200 hover:border-primary transition-colors"
                                  onClick={() => setSelectedImage(imageUrl)}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={
                                      typeof image === 'object' && image && 'filename' in image
                                        ? (image as ReviewImage).filename || 'Review content'
                                        : 'Review content'
                                    }
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(review.date || review.location) && (
                          <div className="flex items-center gap-4 mt-3 text-xs text-secondary-text">
                            {review.date && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[14px]">calendar_today</span>
                                {review.date}
                              </span>
                            )}
                            {review.location && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined !text-[14px]">location_on</span>
                                {review.location}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                      <p className="text-xs sm:text-sm text-secondary-text">
                        Showing {indexOfFirstReview + 1} to{' '}
                        {Math.min(indexOfLastReview, filteredReviews.length)} of {filteredReviews.length}{' '}
                        reviews
                        {filteredReviews.length !== reviewResult.reviews!.length && (
                          <span className="text-gray-400">
                            {' '}
                            (filtered from {reviewResult.reviews!.length})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-primary-text">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inbox</span>
              <p className="text-secondary-text">No reviews found for this product</p>
            </div>
          )}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <img
              src={selectedImage}
              alt="Review"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {deleteDialogOpen && reviewToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="text-lg font-bold text-primary-text">Delete Review</h3>
            </div>
            <p className="text-secondary-text mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteDialog}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-primary-text font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReview}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editDialogOpen && reviewToEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-text">Edit Review</h3>
              <button
                onClick={closeEditDialog}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col">
                <p className="text-sm font-medium text-primary-text mb-1">Title</p>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  placeholder="Review title"
                  className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none"
                />
              </label>
              <label className="flex flex-col">
                <p className="text-sm font-medium text-primary-text mb-1">Review Text *</p>
                <textarea
                  value={editFormData.review_text}
                  onChange={(e) => handleEditFormChange('review_text', e.target.value)}
                  placeholder="Review description"
                  rows={4}
                  className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none resize-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col">
                  <p className="text-sm font-medium text-primary-text mb-1">Rating</p>
                  <select
                    value={editFormData.rating}
                    onChange={(e) => handleEditFormChange('rating', e.target.value)}
                    className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} Star{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col">
                  <p className="text-sm font-medium text-primary-text mb-1">User Name</p>
                  <input
                    type="text"
                    value={editFormData.user_name}
                    onChange={(e) => handleEditFormChange('user_name', e.target.value)}
                    placeholder="Reviewer name"
                    className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col">
                  <p className="text-sm font-medium text-primary-text mb-1">Date</p>
                  <input
                    type="text"
                    value={editFormData.date}
                    onChange={(e) => handleEditFormChange('date', e.target.value)}
                    placeholder="Review date"
                    className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none"
                  />
                </label>
                <label className="flex flex-col">
                  <p className="text-sm font-medium text-primary-text mb-1">Location</p>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                    placeholder="Location"
                    className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none"
                  />
                </label>
              </div>
              {reviewToEdit.images && reviewToEdit.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-primary-text mb-2">Existing Images</p>
                  <div className="flex flex-wrap gap-2">
                    {reviewToEdit.images.map((image: ReviewImage | string, imgIndex: number) => {
                      const imageUrl =
                        typeof image === 'object' && image && 's3_url' in image
                          ? (image as ReviewImage).s3_url
                          : typeof image === 'string'
                            ? image
                            : null;
                      const imageId =
                        typeof image === 'object' && image && 'id' in image
                          ? (image as ReviewImage).id || ''
                          : '';
                      if (!imageUrl) return null;
                      return (
                        <div key={imgIndex} className="relative group">
                          <img
                            src={imageUrl}
                            alt="Review"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => deleteImageFromEdit(imageId, imgIndex)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined !text-[14px]">close</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <label className="flex flex-col">
                <p className="text-sm font-medium text-primary-text mb-1">Add New Images</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
              </label>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={closeEditDialog}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-primary-text font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEditReview}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Updating...' : 'Update Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
