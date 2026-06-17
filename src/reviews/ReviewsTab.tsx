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
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-sort-dropdown')) {
        setIsSortDropdownOpen(false);
      }
      if (!target.closest('.custom-rating-dropdown')) {
        setIsRatingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const gsap = (window as any).gsap;
    if (gsap) {
      gsap.to('.gsap-tab-floater-orange-1', {
        y: -4,
        x: 2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
      gsap.to('.gsap-tab-floater-orange-2', {
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 relative z-10">
        {/* Decorative Floating Elements */}
        <div className="absolute -right-3 -top-3 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shadow-md border border-white gsap-tab-floater-orange-1 pointer-events-none z-50">
          <span className="material-symbols-outlined text-[#FF6B35] !text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        </div>
        <div className="absolute -left-3 -bottom-3 w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center shadow-md border border-white gsap-tab-floater-orange-2 pointer-events-none z-50">
          <span className="material-symbols-outlined text-[#FF9770] !text-[12px]">rate_review</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3 pb-3 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF6B35] !text-[20px]">rate_review</span>
            <h2 className="text-sm font-bold text-primary-text">View Reviews</h2>
          </div>
          <p className="text-[11px] text-secondary-text">
            {isCompanyAutoSelected
              ? 'Select a product to view and manage reviews'
              : 'Select a company and product to view and manage reviews'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3.5" style={{ overflow: 'visible' }}>
          {!isCompanyAutoSelected && (
            <div className="flex-1 relative z-30">
              <label className="block text-xs font-semibold text-primary-text mb-1">Company Name</label>
              {renderSearchableCompanyDropdown(
                loading,
                handleCompanyChange,
                'Select company...',
                'focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
              )}
            </div>
          )}
          <div className="flex-1 relative z-20">
            <label className="block text-xs font-semibold text-primary-text mb-1">Product Name</label>
            {renderSearchableProductDropdown(
              !selectedCompany || loading,
              handleProductChange,
              'Select product...',
              'focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]'
            )}
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading || !selectedCompany || !selectedProduct}
            className="px-6 md:w-auto h-[46px] bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-glow shrink-0 whitespace-nowrap"
          >
            <span className="material-symbols-outlined !text-[18px]">search</span>
            {loading ? 'Loading...' : 'View Reviews'}
          </button>
        </div>
      </div>

      {reviewResult && (
        <div className="flex flex-col gap-6 relative z-0">
          
          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-3.5">
                 <div className="size-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E5521C] text-white flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,107,53,0.3)]">
                    <span className="material-symbols-outlined !text-[24px]">insights</span>
                 </div>
                 <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Review Analytics</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Overview of product performance</p>
                 </div>
              </div>

              {!isEditingStats ? (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-5 px-6 py-3 bg-slate-50 border border-slate-100/80 rounded-2xl shadow-inner shadow-slate-100/50">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-yellow-500 !text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {reviewResult.overall_rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Avg Rating</span>
                      </div>
                      <div className="w-px h-10 bg-slate-200"></div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-blue-500 !text-[22px]">reviews</span>
                          <span className="text-2xl font-black text-slate-900 tracking-tight">
                            {reviewResult.total_reviews || 0}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Reviews</span>
                      </div>
                  </div>
                  <button
                    onClick={startEditingStats}
                    disabled={loading}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all shadow-sm"
                    title="Edit stats"
                  >
                    <span className="material-symbols-outlined !text-[20px]">edit_square</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Rating (0-5)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-yellow-500 !text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      </span>
                      <input
                        type="number"
                        value={editRating}
                        onChange={(e) => handleRatingChange(e.target.value)}
                        min={0}
                        max={5}
                        step={0.1}
                        className="w-24 px-3 py-2 pl-8 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Reviews</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-blue-500 !text-[16px]">reviews</span>
                      </span>
                      <input
                        type="number"
                        value={editTotalReviews}
                        onChange={(e) => handleReviewCountChange(e.target.value)}
                        min={0}
                        className="w-32 px-3 py-2 pl-8 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-full pt-[22px]">
                    <button
                      onClick={updateRatingAndCount}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={cancelEditingStats}
                      disabled={loading}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Highlights Section */}
          {(documentFields.highlights.keywords.length > 0 ||
            documentFields.highlights.summary ||
            documentFields.customer_mentions.length > 0 ||
            documentFields.social_proof_keywords.length > 0 ||
            isEditingHighlights) && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-500 !text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <h3 className="text-lg font-extrabold text-slate-900">AI Highlights</h3>
                </div>
                {!isEditingHighlights && (
                  <button
                    onClick={startEditingHighlights}
                    disabled={loading}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all shadow-sm"
                    title="Edit highlights"
                  >
                    <span className="material-symbols-outlined !text-[20px]">edit_square</span>
                  </button>
                )}
              </div>
              {!isEditingHighlights ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Summary */}
                  {documentFields.highlights.summary && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">AI Summary</p>
                      <p className="text-sm text-primary-text leading-relaxed font-medium">
                        {documentFields.highlights.summary}
                      </p>
                    </div>
                  )}

                  {/* Right Column: Badges & Mentions */}
                  <div className="space-y-4">
                    {documentFields.highlights.keywords.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {documentFields.highlights.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100/50"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {documentFields.customer_mentions.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Customer Mentions</p>
                        <div className="space-y-1.5">
                          {documentFields.customer_mentions.map((mention, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs text-primary-text font-medium">
                              <span className="text-green-600 font-bold">✓</span>
                              <span>{mention}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {documentFields.social_proof_keywords.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Social Proof Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {documentFields.social_proof_keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100/50"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

          {/* Reviews List Section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 !text-[22px]">format_list_bulleted</span>
                <h3 className="text-lg font-extrabold text-slate-900">All Reviews</h3>
              </div>
            </div>

            {/* Filter Bar */}
            {reviewResult.reviews && reviewResult.reviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Sort Order */}
              <div className="relative inline-flex items-center custom-sort-dropdown">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-2 py-2 outline-none shadow-sm cursor-pointer hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all w-36"
                >
                  <span className="material-symbols-outlined !text-[15px] text-slate-400">sort</span>
                  <span className="flex-1 text-left">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                  <span className="material-symbols-outlined !text-[15px] text-slate-400">
                    {isSortDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('newest');
                        setCurrentPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        sortOrder === 'newest' ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('oldest');
                        setCurrentPage(1);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        sortOrder === 'oldest' ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      Oldest First
                    </button>
                  </div>
                )}
              </div>

              {/* Rating Filter */}
              <div className="relative inline-flex items-center custom-rating-dropdown">
                <button
                  type="button"
                  onClick={() => setIsRatingDropdownOpen(!isRatingDropdownOpen)}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-2 py-2 outline-none shadow-sm cursor-pointer hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all w-32"
                >
                  <span className="material-symbols-outlined !text-[15px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="flex-1 text-left">
                    {filterRating === 'all' ? 'All Ratings' : `${filterRating} Stars`}
                  </span>
                  <span className="material-symbols-outlined !text-[15px] text-slate-400">
                    {isRatingDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isRatingDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                    {[
                      { value: 'all', label: 'All Ratings' },
                      { value: '5', label: '5 Stars' },
                      { value: '4', label: '4 Stars' },
                      { value: '3', label: '3 Stars' },
                      { value: '2', label: '2 Stars' },
                      { value: '1', label: '1 Star' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFilterRating(option.value);
                          setCurrentPage(1);
                          setIsRatingDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                          filterRating === option.value ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* With Images toggle */}
              <button
                onClick={() => {
                  setFilterWithImages(!filterWithImages);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 border shadow-sm transition-all ${
                  filterWithImages
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined !text-[14px]">image</span>
                With Images
              </button>

              {/* Clear */}
              {(sortOrder !== 'newest' || filterRating !== 'all' || filterWithImages) && (
                <button
                  onClick={() => {
                    setSortOrder('newest');
                    setFilterRating('all');
                    setFilterWithImages(false);
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-2 transition-all"
                >
                  <span className="material-symbols-outlined !text-[13px]">close</span>
                  Clear
                </button>
              )}
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredReviews.length === 0 ? (
                      <div className="text-center py-8 col-span-full">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">filter_list_off</span>
                        <p className="text-secondary-text">No reviews match the selected filters</p>
                      </div>
                    ) : (
                      currentReviews.map((review, index) => (
                        <div
                          key={review._id || index}
                          className="p-3.5 bg-white border border-slate-100 hover:border-slate-200 rounded-xl hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group"
                        >
                          <div>
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {review.user_name ? (
                                  <span className="font-semibold text-xs text-slate-800">{review.user_name}</span>
                                ) : (
                                  <span className="text-xs italic text-slate-400">Anonymous</span>
                                )}
                                {review.review_index && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                    #{review.review_index}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {review.rating && (
                                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-100 rounded text-[11px] font-semibold text-yellow-700">
                                    <span className="material-symbols-outlined !text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    {review.rating}
                                  </span>
                                )}
                                <button
                                  onClick={() => openEditDialog(review)}
                                  disabled={loading}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                                  title="Edit review"
                                >
                                  <span className="material-symbols-outlined !text-[16px]">edit</span>
                                </button>
                                <button
                                  onClick={() => openDeleteDialog(review)}
                                  disabled={loading}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded transition-colors"
                                  title="Delete review"
                                >
                                  <span className="material-symbols-outlined !text-[16px]">delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Title (if any) */}
                            {review.title && (
                              <h4 className="text-xs font-bold text-slate-900 mt-1 mb-1 tracking-tight">{review.title}</h4>
                            )}

                            {/* Review Text */}
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {review.review_text || 'No review text available'}
                            </p>

                            {/* Images */}
                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
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
                                      className="w-10 h-10 rounded overflow-hidden cursor-pointer border border-slate-100 hover:border-orange-500 transition-colors shrink-0"
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
                          </div>

                          {/* Footer details */}
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
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 inset-y-0 flex items-center">
                      <span className="material-symbols-outlined !text-[15px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </span>
                    <select
                      value={editFormData.rating}
                      onChange={(e) => handleEditFormChange('rating', e.target.value)}
                      className="appearance-none w-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl pl-9 pr-8 py-2.5 outline-none shadow-sm cursor-pointer hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Star{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 inset-y-0 flex items-center text-slate-400">
                      <span className="material-symbols-outlined !text-[16px]">expand_more</span>
                    </span>
                  </div>
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
