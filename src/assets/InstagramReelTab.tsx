import React, { useState, useEffect } from 'react';
import type { Company, Product } from './types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

export interface InstagramReelTabProps {
  companies: Company[];
  loading: boolean;
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    user_id?: string;
    company_ids?: string[];
  } | null;
}

interface PendingPost {
  _id: string;
  post_url: string;
  source_url: string; // The tagged URL that was scraped
  user_id: string;
  company_id: string;
  status: 'pending' | 'classified' | 'saved';
  classification?: 'company' | 'product';
  product_id?: string;
  created_at: string;
  thumbnail_url?: string;
}

type InstagramTab = 'scraper' | 'review' | 'view' | 'upload' | 'delete';

const InstagramReelTab: React.FC<InstagramReelTabProps> = ({ companies, loading: parentLoading, userData }) => {
  const [activeTab, setActiveTab] = useState<InstagramTab>('scraper');

  // Scraper state
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [instagramTaggedUrl, setInstagramTaggedUrl] = useState<string>('');

  // Review Posts state
  const [reviewSourceUrl, setReviewSourceUrl] = useState<string>('');
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [reviewEditPostId, setReviewEditPostId] = useState<string | null>(null); // which post's Edit popup is open
  const [reviewEditClassification, setReviewEditClassification] = useState<'company' | 'product'>('company');
  const [reviewEditProductId, setReviewEditProductId] = useState<string>('');
  const [, setSelectedPendingPosts] = useState<Set<string>>(new Set());
  
  // View/Upload/Delete state
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [instagramUrls, setInstagramUrls] = useState<string>('');
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [deleteOption, setDeleteOption] = useState<'company' | 'product'>('company');
  const [deleteProductOption, setDeleteProductOption] = useState<'all' | 'specific'>('all'); // under "Delete product wise": all products vs specific product
  const [reelOption, setReelOption] = useState<'company' | 'product'>('product'); // Company wise vs Product wise for View/Upload
  const [, setExistingUrlsSource] = useState<'company' | 'product'>('product'); // where current existingUrls came from (for delete single URL)
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Product search state
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);

  // Company search state
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState<boolean>(false);
  const [companyIdSearchQuery, setCompanyIdSearchQuery] = useState<string>('');
  const [isCompanyIdDropdownOpen, setIsCompanyIdDropdownOpen] = useState<boolean>(false);

  // Track if we just saved posts (to show helpful "View Saved Posts" button)
  const [justSavedPosts, setJustSavedPosts] = useState<boolean>(false);
  const [lastSavedCompany, setLastSavedCompany] = useState<string>('');
  const [lastSavedProduct, setLastSavedProduct] = useState<string>('');

  // Track if we just uploaded URLs (to show helpful "View Uploaded URLs" button)
  const [justUploadedUrls, setJustUploadedUrls] = useState<boolean>(false);
  const [lastUploadedCompany, setLastUploadedCompany] = useState<string>('');
  const [lastUploadedProduct, setLastUploadedProduct] = useState<string>('');
  const [lastUploadedType, setLastUploadedType] = useState<'company' | 'product'>('company');

  // Track if we just deleted URLs (to show helpful "View Remaining URLs" button)
  const [justDeletedUrls, setJustDeletedUrls] = useState<boolean>(false);
  const [lastDeletedCompany, setLastDeletedCompany] = useState<string>('');
  const [lastDeletedProduct, setLastDeletedProduct] = useState<string>('');
  const [lastDeletedType, setLastDeletedType] = useState<'company' | 'product'>('company');

  // Determine if company should be auto-selected (non-admin with single company)
  const isCompanyAutoSelected = userData && userData.role !== 'admin' && companies.length === 1;

  // Auto-select company on mount if applicable
  useEffect(() => {
    if (isCompanyAutoSelected && companies.length === 1) {
      const companyId = companies[0].company_id;
      setSelectedCompanyId(companyId);
      setSelectedCompany(companyId);
    }
  }, [companies, isCompanyAutoSelected]);

  // Fetch products when company changes
  useEffect(() => {
    if (selectedCompany && (activeTab === 'view' || activeTab === 'upload' || activeTab === 'delete')) {
      fetchProducts(selectedCompany);
    }
    // Reset product search when company changes
    setProductSearchQuery('');
    setIsProductDropdownOpen(false);
    // Reset company search when company changes
    if (selectedCompany) {
      const companyName = companies.find(c => c.company_id === selectedCompany)?.company_id || '';
      setCompanySearchQuery(companyName);
    } else {
      setCompanySearchQuery('');
    }
  }, [selectedCompany, activeTab, companies]);

  // Reset company ID search when company ID changes
  useEffect(() => {
    if (selectedCompanyId) {
      const companyName = companies.find(c => c.company_id === selectedCompanyId)?.company_id || '';
      setCompanyIdSearchQuery(companyName);
    } else {
      setCompanyIdSearchQuery('');
    }
  }, [selectedCompanyId, companies]);

  // Fetch products when company is selected in Scraper (for "Product for product-wise reels" dropdown)
  useEffect(() => {
    if (selectedCompanyId && activeTab === 'scraper') {
      fetchProducts(selectedCompanyId);
    }
  }, [selectedCompanyId, activeTab]);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.product_id.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  // Filter companies based on search query
  const filteredCompanies = companies.filter(company =>
    company.company_id.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  // Filter companies for company ID search
  const filteredCompaniesForId = companies.filter(company =>
    company.company_id.toLowerCase().includes(companyIdSearchQuery.toLowerCase())
  );

  // Clear product search when product is cleared
  useEffect(() => {
    if (!selectedProduct && productSearchQuery) {
      const productName = products.find(p => p.product_id === productSearchQuery)?.product_id;
      // Only clear if the search query doesn't match any selected product
      if (!productName) {
        setProductSearchQuery('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const fetchProducts = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${IMAGE_API_BASE_URL}/products/${companyId}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scraper functions
  const handleQueueRequest = async () => {
    if (!selectedCompanyId) {
      setError('Please select a company');
      return;
    }

    if (!instagramTaggedUrl.trim()) {
      setError('Please enter an Instagram tagged URL');
      return;
    }

    const taggedUrlPattern = /instagram\.com\/[^/]+\/tagged/i;
    if (!taggedUrlPattern.test(instagramTaggedUrl)) {
      setError('Please enter a valid Instagram tagged URL format: https://www.instagram.com/username/tagged/');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE_URL}/instagram-scraper/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagram_url: instagramTaggedUrl,
          company_id: selectedCompanyId,
          user_id: userData?.user_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Your request has been queued! Posts will be scraped in the background. Check the "Review Posts" tab to classify them.');
        setInstagramTaggedUrl('');
      } else {
        setError(data.message || 'Failed to queue scraping request');
      }
    } catch (err) {
      setError('Error queuing request. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Review Posts functions
  const handleFetchPendingPosts = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const params = new URLSearchParams();
      if (userData?.user_id) {
        params.append('user_id', userData.user_id);
      }
      if (reviewSourceUrl.trim()) {
        params.append('source_url', reviewSourceUrl.trim());
      }

      const response = await fetch(`${API_BASE_URL}/instagram-scraper/pending?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPendingPosts(data.pending_posts || []);
        if (data.pending_posts.length === 0) {
          setSuccessMessage('No pending posts found.');
        } else {
          setSuccessMessage(`Found ${data.pending_posts.length} pending post(s) to review.`);
        }
      } else {
        setError(data.message || 'Failed to fetch pending posts');
        setPendingPosts([]);
      }
    } catch (err) {
      setError('Error fetching pending posts. Make sure the backend is running.');
      console.error(err);
      setPendingPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassifyPost = (postId: string, classification: 'company' | 'product', productId?: string) => {
    setPendingPosts(prev => prev.map(post =>
      post._id === postId
        ? { ...post, classification, product_id: classification === 'product' ? productId : undefined, status: 'classified' as const }
        : post
    ));
  };

  const handleSavePosts = async () => {
    const classifiedPosts = pendingPosts.filter(post => post.status === 'classified');
    if (classifiedPosts.length === 0) {
      setError('No posts have been classified yet. Please classify at least one post before saving.');
      return;
    }

    const missingProduct = classifiedPosts.find(post => post.classification === 'product' && !post.product_id);
    if (missingProduct) {
      setError('All product-classified posts must have a product selected.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`${API_BASE_URL}/instagram-scraper/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: classifiedPosts.map(post => ({
            post_id: post._id,
            classification: post.classification,
            product_id: post.product_id,
            company_id: post.company_id
          }))
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Count company vs product posts
        const companyCount = classifiedPosts.filter(p => p.classification === 'company').length;
        const productCount = classifiedPosts.filter(p => p.classification === 'product').length;

        let message = `Successfully saved ${classifiedPosts.length} post(s)! `;
        if (companyCount > 0) {
          message += `${companyCount} saved as company reels. `;
        }
        if (productCount > 0) {
          message += `${productCount} saved as product reels. `;
        }

        setSuccessMessage(message);

        // Track what was saved for the "View Saved Posts" button
        setJustSavedPosts(true);
        // Get the company from the first post (all should have the same company)
        if (classifiedPosts.length > 0) {
          setLastSavedCompany(classifiedPosts[0].company_id);
          // If any product posts, remember the first product
          const firstProductPost = classifiedPosts.find(p => p.classification === 'product' && p.product_id);
          if (firstProductPost) {
            setLastSavedProduct(firstProductPost.product_id || '');
          }
        }

        // Remove saved posts from the list
        setPendingPosts(prev => prev.filter(post => post.status !== 'classified'));
        setSelectedPendingPosts(new Set());
      } else {
        setError(data.message || 'Failed to save posts');
      }
    } catch (err) {
      setError('Error saving posts. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewEditPopup = (post: PendingPost) => {
    setReviewEditPostId(post._id);
    setReviewEditClassification(post.classification || 'company');
    setReviewEditProductId(post.classification === 'product' && post.product_id ? post.product_id : '');
    // Fetch products for the post's company if not already loaded
    if (post.company_id && products.length === 0) {
      fetchProducts(post.company_id);
    }
  };

  const closeReviewEditPopup = () => {
    setReviewEditPostId(null);
    setReviewEditProductId('');
  };

  const saveReviewEditPopup = () => {
    if (!reviewEditPostId) return;
    if (reviewEditClassification === 'product' && !reviewEditProductId) {
      setError('Please select a product for this post');
      return;
    }
    handleClassifyPost(reviewEditPostId, reviewEditClassification, reviewEditProductId);
    closeReviewEditPopup();
  };


  // View existing URLs (company-wise or product-wise)
  const handleFetchExisting = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (reelOption === 'product' && !selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      if (reelOption === 'company') {
        const response = await fetch(`${API_BASE_URL}/instagram-images/${selectedCompany}`);
        const data = await response.json();
        if (data.success) {
          const urls = data.instagram_urls || [];
          setExistingUrls(urls);
          setExistingUrlsSource('company');
          setSuccessMessage(`Found ${urls.length} company Instagram URLs`);
        } else {
          setError(data.message || 'Failed to fetch');
          setExistingUrls([]);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}`);
        const data = await response.json();
        if (data.success) {
          const urls = data.instagram_urls || data.urls || [];
          setExistingUrls(urls);
          setExistingUrlsSource('product');
          setSuccessMessage(`Found ${urls.length} product Instagram URLs`);
        } else {
          setError(data.message || 'Failed to fetch');
          setExistingUrls([]);
        }
      }
    } catch (err) {
      setError('Error fetching Instagram URLs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload URLs manually (company-wise or product-wise)
  const handleUploadUrls = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }
    if (reelOption === 'product' && !selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (!instagramUrls.trim()) {
      setError('Please enter Instagram URLs');
      return;
    }

    const urlArray = instagramUrls
      .split('\n')
      .map((url: string) => url.trim())
      .filter((url: string) => url.length > 0);

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const url = reelOption === 'company'
        ? `${API_BASE_URL}/instagram-images/company/${selectedCompany}`
        : `${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram_urls: urlArray }),
      });
      const data = await response.json();

      if (data.success) {
        if (data.urls_inserted !== undefined || data.new_urls_added !== undefined) {
          const added = data.urls_inserted ?? data.new_urls_added ?? 0;
          if (data.already_exists > 0) {
            setSuccessMessage(`${added} URL(s) added. ${data.already_exists} already exist.`);
          } else {
            setSuccessMessage(`Successfully added ${added} Instagram URL(s) ${reelOption === 'company' ? '(company)' : '(product)'}`);
          }
        } else {
          setSuccessMessage(`Successfully added Instagram URLs`);
        }
        setInstagramUrls('');

        // Track what was uploaded for the "View Uploaded URLs" button
        setJustUploadedUrls(true);
        setLastUploadedCompany(selectedCompany);
        setLastUploadedProduct(selectedProduct);
        setLastUploadedType(reelOption);
      } else {
        setError(data.message || 'Failed to upload URLs');
      }
    } catch (err) {
      setError('Error uploading URLs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete URLs
  const handleDelete = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }

    if (deleteOption === 'product' && deleteProductOption === 'specific' && !selectedProduct) {
      setError('Please select a product');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      let url = '';
      if (deleteOption === 'company') {
        // Delete company reels only (company_reels array)
        url = `${API_BASE_URL}/instagram-images/company/${selectedCompany}/company-reels`;
      } else {
        // Delete product wise
        if (deleteProductOption === 'all') {
          // Delete from all products (entire product_reels)
          url = `${API_BASE_URL}/instagram-images/company/${selectedCompany}/product-reels`;
        } else {
          // Delete from specific product
          url = `${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}`;
        }
      }

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        const deletedCount = data.total_urls_deleted ?? data.deleted_count ?? 0;
        setSuccessMessage(`Successfully deleted ${deletedCount} Instagram URL(s). Click below to view remaining URLs.`);
        if (activeTab === 'view') {
          setExistingUrls([]);
        }

        // Track what was deleted for the "View Remaining URLs" button
        setJustDeletedUrls(true);
        setLastDeletedCompany(selectedCompany);
        if (deleteOption === 'product' && deleteProductOption === 'specific') {
          setLastDeletedProduct(selectedProduct);
          setLastDeletedType('product');
        } else {
          setLastDeletedProduct('');
          setLastDeletedType('company');
        }
      } else {
        setError(data.message || 'Failed to delete URLs');
      }
    } catch (err) {
      setError('Error deleting URLs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reusable Searchable Company Dropdown Component (for selectedCompany)
  const renderSearchableCompanyDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "-- Select Company --",
    focusRingColor: string = "focus:ring-pink-200 focus:border-pink-400"
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompany)?.company_id || '';
    const displayValue = isCompanyDropdownOpen ? companySearchQuery : (selectedCompanyName || companySearchQuery);
    
    return (
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanySearchQuery(e.target.value);
              setIsCompanyDropdownOpen(true);
              // Clear selection if user starts typing something different
              if (selectedCompany && e.target.value !== selectedCompanyName) {
                setSelectedCompany('');
                onCompanyChange('');
              }
            }}
            onFocus={() => {
              setIsCompanyDropdownOpen(true);
              // If there's a selected company, show it in search, otherwise keep current search
              if (selectedCompanyName && !companySearchQuery) {
                setCompanySearchQuery(selectedCompanyName);
              }
            }}
            onBlur={() => {
              // Delay closing to allow click on dropdown item
              setTimeout(() => {
                setIsCompanyDropdownOpen(false);
                // If no company selected, clear search. Otherwise show selected company
                if (!selectedCompany) {
                  setCompanySearchQuery('');
                } else {
                  setCompanySearchQuery(selectedCompanyName);
                }
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>
        
        {/* Dropdown List */}
        {isCompanyDropdownOpen && !disabled && filteredCompanies.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                onMouseDown={(e) => {
                  // Use onMouseDown instead of onClick to prevent onBlur from firing first
                  e.preventDefault();
                  setSelectedCompany(company.company_id);
                  setCompanySearchQuery(company.company_id);
                  setIsCompanyDropdownOpen(false);
                  onCompanyChange(company.company_id);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedCompany === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                }`}
              >
                {company.company_id}
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {isCompanyDropdownOpen && !disabled && companySearchQuery && filteredCompanies.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No companies found matching "{companySearchQuery}"
          </div>
        )}
      </div>
    );
  };

  // Reusable Searchable Company Dropdown Component (for selectedCompanyId - scraper tab)
  const renderSearchableCompanyIdDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "-- Select Company --",
    focusRingColor: string = "focus:ring-pink-200 focus:border-pink-400"
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompanyId)?.company_id || '';
    const displayValue = isCompanyIdDropdownOpen ? companyIdSearchQuery : (selectedCompanyName || companyIdSearchQuery);
    
    return (
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanyIdSearchQuery(e.target.value);
              setIsCompanyIdDropdownOpen(true);
              // Clear selection if user starts typing something different
              if (selectedCompanyId && e.target.value !== selectedCompanyName) {
                setSelectedCompanyId('');
                onCompanyChange('');
              }
            }}
            onFocus={() => {
              setIsCompanyIdDropdownOpen(true);
              // If there's a selected company, show it in search, otherwise keep current search
              if (selectedCompanyName && !companyIdSearchQuery) {
                setCompanyIdSearchQuery(selectedCompanyName);
              }
            }}
            onBlur={() => {
              // Delay closing to allow click on dropdown item
              setTimeout(() => {
                setIsCompanyIdDropdownOpen(false);
                // If no company selected, clear search. Otherwise show selected company
                if (!selectedCompanyId) {
                  setCompanyIdSearchQuery('');
                } else {
                  setCompanyIdSearchQuery(selectedCompanyName);
                }
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>
        
        {/* Dropdown List */}
        {isCompanyIdDropdownOpen && !disabled && filteredCompaniesForId.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCompaniesForId.map((company) => (
              <div
                key={company._id}
                onMouseDown={(e) => {
                  // Use onMouseDown instead of onClick to prevent onBlur from firing first
                  e.preventDefault();
                  setSelectedCompanyId(company.company_id);
                  setCompanyIdSearchQuery(company.company_id);
                  setIsCompanyIdDropdownOpen(false);
                  onCompanyChange(company.company_id);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedCompanyId === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                }`}
              >
                {company.company_id}
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {isCompanyIdDropdownOpen && !disabled && companyIdSearchQuery && filteredCompaniesForId.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No companies found matching "{companyIdSearchQuery}"
          </div>
        )}
      </div>
    );
  };

  const renderScraper = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {!isCompanyAutoSelected && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
              Select Company <span className="text-red-500">*</span>
            </p>
            {renderSearchableCompanyIdDropdown(
              loading || parentLoading,
              (companyId) => {
                setSelectedCompanyId(companyId);
                setError('');
                setSuccessMessage('');
              },
              "-- Select Company --",
              "focus:ring-pink-200 focus:border-pink-400"
            )}
          </label>
        )}

        <label className="flex flex-col w-full">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
            Instagram Tagged URL <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-secondary-text pb-2">
            Enter the tagged posts URL of an Instagram profile (e.g., https://www.instagram.com/username/tagged/)
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-text">
              <span className="material-symbols-outlined !text-[20px]">link</span>
            </span>
            <input
              type="url"
              value={instagramTaggedUrl}
              onChange={(e) => {
                setInstagramTaggedUrl(e.target.value);
                setError('');
              }}
              placeholder="https://www.instagram.com/username/tagged/"
              disabled={loading || !selectedCompanyId}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 block p-3.5 pl-10 outline-none transition-all placeholder:text-secondary-text/60 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </label>
      </div>

      <button
        onClick={handleQueueRequest}
        disabled={loading || !selectedCompanyId || !instagramTaggedUrl.trim()}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
      >
        <span className="material-symbols-outlined !text-[20px]">
          {loading ? 'sync' : 'schedule'}
        </span>
        {loading ? 'Queuing Request...' : 'Queue Scraping Request'}
      </button>

      <div className="border-t border-gray-100 pt-6 mt-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined !text-[20px] shrink-0">info</span>
          <div className="text-sm">
            <p className="font-semibold mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Queue your Instagram tagged URL here</li>
              <li>Our system will scrape the posts in the background</li>
              <li>Go to the "Review Posts" tab to classify and save them</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  // Reusable Searchable Product Dropdown Component
  const renderSearchableProductDropdown = (
    disabled: boolean,
    onProductChange: (productId: string) => void,
    placeholder: string = "-- Select Product --",
    focusRingColor: string = "focus:ring-pink-200 focus:border-pink-400"
  ) => {
    const selectedProductName = products.find(p => p.product_id === selectedProduct)?.product_id || '';
    const displayValue = isProductDropdownOpen ? productSearchQuery : (selectedProductName || productSearchQuery);
    
    return (
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setProductSearchQuery(e.target.value);
              setIsProductDropdownOpen(true);
              // Clear selection if user starts typing something different
              if (selectedProduct && e.target.value !== selectedProductName) {
                setSelectedProduct('');
                onProductChange('');
              }
            }}
            onFocus={() => {
              setIsProductDropdownOpen(true);
              // If there's a selected product, show it in search, otherwise keep current search
              if (selectedProductName && !productSearchQuery) {
                setProductSearchQuery(selectedProductName);
              }
            }}
            onBlur={() => {
              // Delay closing to allow click on dropdown item
              setTimeout(() => {
                setIsProductDropdownOpen(false);
                // If no product selected, clear search. Otherwise show selected product
                if (!selectedProduct) {
                  setProductSearchQuery('');
                } else {
                  setProductSearchQuery(selectedProductName);
                }
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>
        
        {/* Dropdown List */}
        {isProductDropdownOpen && !disabled && filteredProducts.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onMouseDown={(e) => {
                  // Use onMouseDown instead of onClick to prevent onBlur from firing first
                  e.preventDefault();
                  setSelectedProduct(product.product_id);
                  setProductSearchQuery(product.product_id);
                  setIsProductDropdownOpen(false);
                  onProductChange(product.product_id);
                }}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedProduct === product.product_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                }`}
              >
                {product.product_id}
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {isProductDropdownOpen && !disabled && productSearchQuery && filteredProducts.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No products found matching "{productSearchQuery}"
          </div>
        )}
      </div>
    );
  };

  const renderReview = () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col w-full">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
            Instagram Tagged URL (Optional)
          </p>
          <p className="text-xs text-secondary-text pb-2">
            Enter the source URL to filter posts, or leave empty to see all your pending posts
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-text">
              <span className="material-symbols-outlined !text-[20px]">link</span>
            </span>
            <input
              type="url"
              value={reviewSourceUrl}
              onChange={(e) => {
                setReviewSourceUrl(e.target.value);
                setError('');
              }}
              placeholder="https://www.instagram.com/username/tagged/ (optional)"
              disabled={loading}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 block p-3.5 pl-10 outline-none transition-all placeholder:text-secondary-text/60 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </label>
      </div>

      <button
        onClick={handleFetchPendingPosts}
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
      >
        <span className="material-symbols-outlined !text-[20px]">
          {loading ? 'sync' : 'refresh'}
        </span>
        {loading ? 'Loading...' : 'Fetch Pending Posts'}
      </button>

      {pendingPosts.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-500 !text-[24px]">pending</span>
              <h3 className="text-base font-bold text-primary-text">
                Pending Posts ({pendingPosts.length})
              </h3>
            </div>
            <button
              onClick={handleSavePosts}
              disabled={loading || !pendingPosts.some(post => post.status === 'classified')}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
            >
              <span className="material-symbols-outlined !text-[20px]">
                {loading ? 'sync' : 'save'}
              </span>
              {loading ? 'Saving...' : 'Save Classified Posts'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPosts.map((post) => (
              <div
                key={post._id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  post.status === 'classified'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="relative bg-gray-100" style={{ paddingBottom: '125%' }}>
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt="Post preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-gray-400 !text-[48px]">image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      post.status === 'classified'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {post.status === 'classified' ? 'Classified' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate block mb-3"
                  >
                    View on Instagram
                  </a>
                  {post.status === 'classified' && (
                    <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-secondary-text mb-1">Classification:</p>
                      <p className={`text-sm font-medium ${post.classification === 'company' ? 'text-pink-600' : 'text-purple-600'}`}>
                        {post.classification === 'company' ? 'Company Video' : `Product Video${post.product_id ? ` (${post.product_id})` : ''}`}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => openReviewEditPopup(post)}
                    className="w-full py-2.5 px-4 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                    {post.status === 'classified' ? 'Edit Classification' : 'Classify Post'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Classification Popup */}
      {reviewEditPostId && (() => {
        const editPost = pendingPosts.find(p => p._id === reviewEditPostId);
        if (!editPost) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 shrink-0">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-full">
                  <span className="material-symbols-outlined">edit</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Classify Post</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {editPost.thumbnail_url ? (
                      <img
                        src={editPost.thumbnail_url}
                        alt="Post preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 !text-[64px]">image</span>
                      </div>
                    )}
                  </div>
                  <a
                    href={editPost.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate"
                  >
                    {editPost.post_url}
                  </a>
                  <div>
                    <p className="text-primary-text text-sm font-semibold mb-3">Classify as</p>
                    <div className="flex flex-col gap-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reviewEditClassification === 'company' ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="reviewEditClassification"
                          checked={reviewEditClassification === 'company'}
                          onChange={() => setReviewEditClassification('company')}
                          className="w-4 h-4 text-pink-600"
                        />
                        <span className="text-sm font-medium text-primary-text">Company Video</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${reviewEditClassification === 'product' ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="reviewEditClassification"
                          checked={reviewEditClassification === 'product'}
                          onChange={() => setReviewEditClassification('product')}
                          className="w-4 h-4 text-pink-600"
                        />
                        <span className="text-sm font-medium text-primary-text">Product Video</span>
                      </label>
                    </div>
                  </div>
                  {reviewEditClassification === 'product' && (
                    <div>
                      <p className="text-primary-text text-sm font-semibold mb-2">Select Product *</p>
                      <div className="relative">
                        <select
                          value={reviewEditProductId}
                          onChange={(e) => setReviewEditProductId(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm text-primary-text focus:ring-2 focus:ring-pink-200 focus:border-pink-400"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p._id} value={p.product_id}>{p.product_id}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none !text-[18px]">expand_more</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0">
                <button
                  onClick={closeReviewEditPopup}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReviewEditPopup}
                  disabled={reviewEditClassification === 'product' && !reviewEditProductId}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Classification
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderView = () => (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Show reels</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reelOptionView"
              value="company"
              checked={reelOption === 'company'}
              onChange={() => { setReelOption('company'); setExistingUrls([]); setError(''); setSuccessMessage(''); }}
              className="w-4 h-4 text-pink-600"
            />
            <span className="text-sm text-primary-text">Company wise</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reelOptionView"
              value="product"
              checked={reelOption === 'product'}
              onChange={() => { setReelOption('product'); setExistingUrls([]); setError(''); setSuccessMessage(''); }}
              className="w-4 h-4 text-pink-600"
            />
            <span className="text-sm text-primary-text">Product wise</span>
          </label>
        </div>
      </div>
      <div className={`grid gap-4 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {!isCompanyAutoSelected && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Company *</p>
            {renderSearchableCompanyDropdown(
              loading,
              (companyId) => {
                setSelectedCompany(companyId);
                setSelectedProduct('');
                setError('');
                setSuccessMessage('');
                setExistingUrls([]);
              },
              "-- Select Company --",
              "focus:ring-pink-200 focus:border-pink-400"
            )}
          </label>
        )}

        {reelOption === 'product' && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Product *</p>
            {renderSearchableProductDropdown(
            loading || !selectedCompany,
            (productId) => {
              setSelectedProduct(productId);
              setError('');
              setSuccessMessage('');
              setExistingUrls([]);
            },
            "-- Select Product --",
            "focus:ring-pink-200 focus:border-pink-400"
          )}
          </label>
        )}
      </div>

      <button
        onClick={handleFetchExisting}
        disabled={loading || !selectedCompany || (reelOption === 'product' && !selectedProduct)}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
      >
        <span className="material-symbols-outlined !text-[20px]">search</span>
        {loading ? 'Fetching...' : 'Fetch URLs'}
      </button>

      {existingUrls.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-base font-bold text-primary-text mb-4">
            Found {existingUrls.length} Instagram URL(s)
          </h3>
          <div className="flex flex-col gap-2">
            {existingUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span className="material-symbols-outlined text-pink-500">link</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 truncate flex-1 hover:underline"
                >
                  {url}
                </a>
                <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                <button
                  onClick={() => {
                    setUrlToDelete(url);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={loading}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete this URL"
                >
                  <span className="material-symbols-outlined !text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && urlToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <span className="material-symbols-outlined">delete</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Delete Instagram URL</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Are you sure you want to delete this Instagram URL?
              </p>
              <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">
                {urlToDelete}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setUrlToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!urlToDelete || !selectedCompany) return;
                  if (reelOption === 'product' && !selectedProduct) return;

                  setDeleteDialogOpen(false);
                  setLoading(true);
                  setError('');
                  setSuccessMessage('');

                  try {
                    const deleteUrl = reelOption === 'company'
                      ? `${API_BASE_URL}/instagram-images/company/${selectedCompany}/url?instagram_url=${encodeURIComponent(urlToDelete)}`
                      : `${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}/url?instagram_url=${encodeURIComponent(urlToDelete)}`;
                    const response = await fetch(deleteUrl, { method: 'DELETE' });
                    let data: { success?: boolean; message?: string } = {};
                    try {
                      data = await response.json();
                    } catch {
                      setError(response.ok ? 'Invalid response from server' : `Delete failed (${response.status})`);
                      setLoading(false);
                      setUrlToDelete(null);
                      return;
                    }

                    if (response.ok && data.success) {
                      setSuccessMessage('Instagram URL deleted successfully');
                      setExistingUrls(prev => prev.filter(url => url !== urlToDelete));
                      await handleFetchExisting();
                    } else {
                      setError(data.message || (response.ok ? 'Failed to delete URL' : `Delete failed (${response.status})`));
                    }
                  } catch (err) {
                    setError('Error deleting URL');
                    console.error(err);
                  } finally {
                    setLoading(false);
                    setUrlToDelete(null);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUpload = () => (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Upload reels</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reelOptionUpload"
              value="company"
              checked={reelOption === 'company'}
              onChange={() => { setReelOption('company'); setError(''); setSuccessMessage(''); }}
              className="w-4 h-4 text-pink-600"
            />
            <span className="text-sm text-primary-text">Company wise</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="reelOptionUpload"
              value="product"
              checked={reelOption === 'product'}
              onChange={() => { setReelOption('product'); setError(''); setSuccessMessage(''); }}
              className="w-4 h-4 text-pink-600"
            />
            <span className="text-sm text-primary-text">Product wise</span>
          </label>
        </div>
      </div>
      <div className={`grid gap-4 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {!isCompanyAutoSelected && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Company *</p>
            {renderSearchableCompanyDropdown(
              loading,
              (companyId) => {
                setSelectedCompany(companyId);
                setSelectedProduct('');
                setError('');
                setSuccessMessage('');
              },
              "-- Select Company --",
              "focus:ring-pink-200 focus:border-pink-400"
            )}
          </label>
        )}

        {reelOption === 'product' && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Product *</p>
            {renderSearchableProductDropdown(
              loading || !selectedCompany,
              (productId) => {
                setSelectedProduct(productId);
                setError('');
                setSuccessMessage('');
              },
              "-- Select Product --",
              "focus:ring-pink-200 focus:border-pink-400"
            )}
          </label>
        )}
      </div>

      <label className="flex flex-col w-full">
        <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
          Instagram Post URLs *
        </p>
        <p className="text-xs text-secondary-text pb-2">
          Enter one URL per line. Example: https://www.instagram.com/p/ABC123/
        </p>
        <textarea
          className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-pink-200 focus:border-pink-400 block p-3.5 outline-none transition-all min-h-[200px] resize-y"
          placeholder="https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/p/DEF456/"
          value={instagramUrls}
          onChange={(e) => setInstagramUrls(e.target.value)}
          disabled={loading}
        />
      </label>

      {instagramUrls.trim() && (
        <p className="text-xs text-primary-text font-medium">
          {instagramUrls.split('\n').filter((url: string) => url.trim()).length} URL(s) entered
        </p>
      )}

      <button
        onClick={handleUploadUrls}
        disabled={loading || !selectedCompany || (reelOption === 'product' && !selectedProduct) || !instagramUrls.trim()}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
      >
        <span className="material-symbols-outlined !text-[20px]">cloud_upload</span>
        {loading ? 'Uploading...' : `Add ${instagramUrls.split('\n').filter((url: string) => url.trim()).length} URL(s)`}
      </button>
    </div>
  );

  const renderDelete = () => (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-primary-text mb-4">Select Delete Option</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300">
            <input
              type="radio"
              name="deleteOption"
              value="company"
              checked={deleteOption === 'company'}
              onChange={() => {
                setDeleteOption('company');
                setError('');
                setSuccessMessage('');
              }}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm font-medium text-primary-text">Delete company insta URL</span>
          </label>
          <label className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300">
            <input
              type="radio"
              name="deleteOption"
              value="product"
              checked={deleteOption === 'product'}
              onChange={() => {
                setDeleteOption('product');
                setError('');
                setSuccessMessage('');
              }}
              className="w-4 h-4 text-red-600"
            />
            <span className="text-sm font-medium text-primary-text">Delete product wise</span>
          </label>

          {deleteOption === 'product' && (
            <div className="ml-6 mt-2 flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300">
                <input
                  type="radio"
                  name="deleteProductOption"
                  value="all"
                  checked={deleteProductOption === 'all'}
                  onChange={() => {
                    setDeleteProductOption('all');
                    setSelectedProduct('');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm font-medium text-primary-text">Delete from all product</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-gray-200 hover:border-gray-300">
                <input
                  type="radio"
                  name="deleteProductOption"
                  value="specific"
                  checked={deleteProductOption === 'specific'}
                  onChange={() => {
                    setDeleteProductOption('specific');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-sm font-medium text-primary-text">Delete from specific product</span>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-4 ${isCompanyAutoSelected ? 'grid-cols-1' : (deleteOption === 'product' && deleteProductOption === 'specific' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}`}>
        {!isCompanyAutoSelected && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Company *</p>
            {renderSearchableCompanyDropdown(
              loading,
              (companyId) => {
                setSelectedCompany(companyId);
                setSelectedProduct('');
                setError('');
                setSuccessMessage('');
              },
              "-- Select Company --",
              "focus:ring-red-200 focus:border-red-400"
            )}
          </label>
        )}

        {deleteOption === 'product' && deleteProductOption === 'specific' && (
          <label className="flex flex-col w-full">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Product *</p>
            {renderSearchableProductDropdown(
              loading || !selectedCompany,
              (productId) => {
                setSelectedProduct(productId);
                setError('');
                setSuccessMessage('');
              },
              "-- Select Product --",
              "focus:ring-red-200 focus:border-red-400"
            )}
          </label>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={loading || !selectedCompany || (deleteOption === 'product' && deleteProductOption === 'specific' && !selectedProduct)}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
      >
        <span className="material-symbols-outlined !text-[20px]">delete</span>
        {loading ? 'Deleting...' : 'Delete Instagram URLs'}
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-lg">
          <span className="material-symbols-outlined">photo_camera</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary-text">Instagram Post URLs</h2>
          <p className="text-xs text-secondary-text">Manage Instagram post URLs for your products</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('scraper')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'scraper'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
            }`}
          >
            Queue Request
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'review'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
            }`}
          >
            Review Posts
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'view'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
            }`}
          >
            View Existing
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
            }`}
          >
            Upload URLs
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'delete'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
            }`}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined !text-[20px]">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">check_circle</span>
            <span className="text-sm flex-1">{successMessage}</span>
          </div>
          {justSavedPosts && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view');
                setJustSavedPosts(false);
                // Set company and auto-fetch if we have the data
                if (lastSavedCompany) {
                  setSelectedCompany(lastSavedCompany);
                  if (lastSavedProduct) {
                    setReelOption('product');
                    setSelectedProduct(lastSavedProduct);
                    // Auto-fetch after a short delay to allow state to update
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  } else {
                    setReelOption('company');
                    // Auto-fetch after a short delay
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  }
                }
              }}
              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-[20px]">visibility</span>
              View Saved Posts
            </button>
          )}
          {justUploadedUrls && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view');
                setJustUploadedUrls(false);
                // Set company and auto-fetch
                if (lastUploadedCompany) {
                  setSelectedCompany(lastUploadedCompany);
                  if (lastUploadedType === 'product' && lastUploadedProduct) {
                    setReelOption('product');
                    setSelectedProduct(lastUploadedProduct);
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  } else {
                    setReelOption('company');
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  }
                }
              }}
              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-[20px]">visibility</span>
              View Uploaded URLs
            </button>
          )}
          {justDeletedUrls && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view');
                setJustDeletedUrls(false);
                // Set company and auto-fetch remaining URLs
                if (lastDeletedCompany) {
                  setSelectedCompany(lastDeletedCompany);
                  if (lastDeletedType === 'product' && lastDeletedProduct) {
                    setReelOption('product');
                    setSelectedProduct(lastDeletedProduct);
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  } else {
                    setReelOption('company');
                    setTimeout(() => {
                      handleFetchExisting();
                    }, 100);
                  }
                }
              }}
              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined !text-[20px]">visibility</span>
              View Remaining URLs
            </button>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {activeTab === 'scraper' && renderScraper()}
        {activeTab === 'review' && renderReview()}
        {activeTab === 'view' && renderView()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'delete' && renderDelete()}
      </div>
    </div>
    </div>
  );
};

export default InstagramReelTab;
