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
  source_url: string;
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
  const [reviewEditPostId, setReviewEditPostId] = useState<string | null>(null);
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
  const [deleteProductOption, setDeleteProductOption] = useState<'all' | 'specific'>('all');
  const [reelOption, setReelOption] = useState<'company' | 'product'>('product');
  const [, setExistingUrlsSource] = useState<'company' | 'product'>('product');
  const [urlToDelete, setUrlToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [hasFetchedReels, setHasFetchedReels] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Dropdown states
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState<boolean>(false);
  const [companyIdSearchQuery, setCompanyIdSearchQuery] = useState<string>('');
  const [isCompanyIdDropdownOpen, setIsCompanyIdDropdownOpen] = useState<boolean>(false);

  // Track actions for contextual redirects
  const [justSavedPosts, setJustSavedPosts] = useState<boolean>(false);
  const [lastSavedCompany, setLastSavedCompany] = useState<string>('');
  const [lastSavedProduct, setLastSavedProduct] = useState<string>('');
  const [justUploadedUrls, setJustUploadedUrls] = useState<boolean>(false);
  const [lastUploadedCompany, setLastUploadedCompany] = useState<string>('');
  const [lastUploadedProduct, setLastUploadedProduct] = useState<string>('');
  const [lastUploadedType, setLastUploadedType] = useState<'company' | 'product'>('company');
  const [justDeletedUrls, setJustDeletedUrls] = useState<boolean>(false);
  const [lastDeletedCompany, setLastDeletedCompany] = useState<string>('');
  const [lastDeletedProduct, setLastDeletedProduct] = useState<string>('');
  const [lastDeletedType, setLastDeletedType] = useState<'company' | 'product'>('company');

  const isCompanyAutoSelected = userData && userData.role !== 'admin' && companies.length === 1;

  useEffect(() => {
    if (isCompanyAutoSelected && companies.length === 1) {
      const companyId = companies[0].company_id;
      setSelectedCompanyId(companyId);
      setSelectedCompany(companyId);
    }
    const gsap = (window as any).gsap;
    if (gsap) {
      gsap.to('.gsap-reel-floater-pink-1', { y: -4, x: 1.5, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.gsap-reel-floater-pink-2', { y: 4, x: -1.5, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.2 });
    }
  }, [companies, isCompanyAutoSelected]);

  useEffect(() => {
    if (selectedCompany && (activeTab === 'view' || activeTab === 'upload' || activeTab === 'delete')) {
      fetchProducts(selectedCompany);
    }
    setProductSearchQuery('');
    setIsProductDropdownOpen(false);
    if (selectedCompany) {
      const companyName = companies.find(c => c.company_id === selectedCompany)?.company_id || '';
      setCompanySearchQuery(companyName);
    } else {
      setCompanySearchQuery('');
    }
  }, [selectedCompany, activeTab, companies]);

  useEffect(() => {
    if (selectedCompanyId) {
      const companyName = companies.find(c => c.company_id === selectedCompanyId)?.company_id || '';
      setCompanyIdSearchQuery(companyName);
    } else {
      setCompanyIdSearchQuery('');
    }
  }, [selectedCompanyId, companies]);

  useEffect(() => {
    if (selectedCompanyId && activeTab === 'scraper') {
      fetchProducts(selectedCompanyId);
    }
  }, [selectedCompanyId, activeTab]);

  const filteredProducts = products.filter(product =>
    product.product_id.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.company_id.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const filteredCompaniesForId = companies.filter(company =>
    company.company_id.toLowerCase().includes(companyIdSearchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedProduct && productSearchQuery) {
      const productName = products.find(p => p.product_id === productSearchQuery)?.product_id;
      if (!productName) {
        setProductSearchQuery('');
      }
    }
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

  const handleQueueRequest = async () => {
    if (!selectedCompanyId) { setError('Select company'); return; }
    if (!instagramTaggedUrl.trim()) { setError('Enter tagged URL'); return; }
    const taggedUrlPattern = /instagram\.com\/[^/]+\/tagged/i;
    if (!taggedUrlPattern.test(instagramTaggedUrl)) {
      setError('Enter valid tagged URL: https://www.instagram.com/username/tagged/');
      return;
    }
    try {
      setLoading(true); setError(''); setSuccessMessage('');
      const response = await fetch(`${API_BASE_URL}/instagram-scraper/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagram_url: instagramTaggedUrl, company_id: selectedCompanyId, user_id: userData?.user_id }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage('Scraper queued! Classify under Review.');
        setInstagramTaggedUrl('');
      } else {
        setError(data.message || 'Scraping queue failed');
      }
    } catch (err) {
      setError('Connection error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPendingPosts = async () => {
    try {
      setLoading(true); setError(''); setSuccessMessage('');
      const params = new URLSearchParams();
      if (userData?.user_id) params.append('user_id', userData.user_id);
      if (reviewSourceUrl.trim()) params.append('source_url', reviewSourceUrl.trim());

      const response = await fetch(`${API_BASE_URL}/instagram-scraper/pending?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setPendingPosts(data.pending_posts || []);
        if (data.pending_posts.length === 0) {
          setSuccessMessage('No pending posts.');
        } else {
          setSuccessMessage(`Found ${data.pending_posts.length} pending post(s).`);
        }
      } else {
        setError(data.message || 'Failed fetching posts');
        setPendingPosts([]);
      }
    } catch (err) {
      setError('Connection error');
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
      setError('Classify at least one post.');
      return;
    }
    const missingProduct = classifiedPosts.find(post => post.classification === 'product' && !post.product_id);
    if (missingProduct) {
      setError('Select a product for classified posts.');
      return;
    }
    try {
      setLoading(true); setError(''); setSuccessMessage('');
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
        setSuccessMessage(`Saved ${classifiedPosts.length} post(s)!`);
        setJustSavedPosts(true);
        if (classifiedPosts.length > 0) {
          setLastSavedCompany(classifiedPosts[0].company_id);
          const firstProd = classifiedPosts.find(p => p.classification === 'product' && p.product_id);
          if (firstProd) setLastSavedProduct(firstProd.product_id || '');
        }
        setPendingPosts(prev => prev.filter(post => post.status !== 'classified'));
        setSelectedPendingPosts(new Set());
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Connection error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewEditPopup = (post: PendingPost) => {
    setReviewEditPostId(post._id);
    setReviewEditClassification(post.classification || 'company');
    setReviewEditProductId(post.classification === 'product' && post.product_id ? post.product_id : '');
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
      setError('Select product');
      return;
    }
    handleClassifyPost(reviewEditPostId, reviewEditClassification, reviewEditProductId);
    closeReviewEditPopup();
  };

  const handleFetchExisting = async () => {
    if (!selectedCompany) { setError('Select company'); return; }
    if (reelOption === 'product' && !selectedProduct) { setError('Select product'); return; }
    try {
      setLoading(true); setError(''); setSuccessMessage(''); setHasFetchedReels(false);
      if (reelOption === 'company') {
        const response = await fetch(`${API_BASE_URL}/instagram-images/${selectedCompany}`);
        const data = await response.json();
        if (data.success) {
          const urls = data.instagram_urls || [];
          setExistingUrls(urls);
          setExistingUrlsSource('company');
          setHasFetchedReels(true);
          if (urls.length > 0) setSuccessMessage(`Found ${urls.length} URLs`);
        } else {
          setError(data.message || 'Fetch failed');
          setExistingUrls([]);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}`);
        const data = await response.json();
        if (data.success) {
          const urls = data.instagram_urls || data.urls || [];
          setExistingUrls(urls);
          setExistingUrlsSource('product');
          setHasFetchedReels(true);
          if (urls.length > 0) setSuccessMessage(`Found ${urls.length} URLs`);
        } else {
          setError(data.message || 'Fetch failed');
          setExistingUrls([]);
        }
      }
    } catch (err) {
      setError('Fetch failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadUrls = async () => {
    if (!selectedCompany) { setError('Select company'); return; }
    if (reelOption === 'product' && !selectedProduct) { setError('Select product'); return; }
    if (!instagramUrls.trim()) { setError('Enter URLs'); return; }
    const urlArray = instagramUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    try {
      setLoading(true); setError(''); setSuccessMessage('');
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
        const added = data.urls_inserted ?? data.new_urls_added ?? 0;
        setSuccessMessage(`Added ${added} URL(s)`);
        setInstagramUrls('');
        setJustUploadedUrls(true);
        setLastUploadedCompany(selectedCompany);
        setLastUploadedProduct(selectedProduct);
        setLastUploadedType(reelOption);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) { setError('Select company'); return; }
    if (deleteOption === 'product' && deleteProductOption === 'specific' && !selectedProduct) {
      setError('Select product');
      return;
    }
    try {
      setLoading(true); setError(''); setSuccessMessage('');
      const url = deleteOption === 'company'
        ? `${API_BASE_URL}/instagram-images/company/${selectedCompany}/company-reels`
        : deleteProductOption === 'all'
          ? `${API_BASE_URL}/instagram-images/company/${selectedCompany}/product-reels`
          : `${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}`;

      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        const deletedCount = data.total_urls_deleted ?? data.deleted_count ?? 0;
        setSuccessMessage(`Deleted ${deletedCount} URL(s).`);
        if (activeTab === 'view') setExistingUrls([]);
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
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('Delete failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchableCompanyDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "Select Company...",
    focusRingColor: string = "focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompany)?.company_id || '';
    const displayValue = isCompanyDropdownOpen ? companySearchQuery : (selectedCompanyName || companySearchQuery);
    return (
      <div className={`relative ${isCompanyDropdownOpen ? 'z-[100]' : 'z-10'}`}>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined !text-[17px]">domain</span>
          </div>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanySearchQuery(e.target.value);
              setIsCompanyDropdownOpen(true);
              if (selectedCompany && e.target.value !== selectedCompanyName) {
                setSelectedCompany('');
                onCompanyChange('');
              }
            }}
            onFocus={() => {
              setIsCompanyDropdownOpen(true);
              if (selectedCompanyName && !companySearchQuery) setCompanySearchQuery(selectedCompanyName);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsCompanyDropdownOpen(false);
                setCompanySearchQuery(selectedCompany ? selectedCompanyName : '');
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm
              placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5
              disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50
              ${selectedCompany ? 'font-medium' : ''}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedCompany && !disabled ? (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setSelectedCompany(''); onCompanyChange(''); setCompanySearchQuery(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined !text-[18px] text-slate-400 pointer-events-none">
                {isCompanyDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            )}
          </div>
        </div>
        {isCompanyDropdownOpen && !disabled && (
          <div className="absolute z-[100] w-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
            {filteredCompanies.length > 0 ? (
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredCompanies.map(c => (
                  <div
                    key={c._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCompany(c.company_id);
                      setCompanySearchQuery(c.company_id);
                      setIsCompanyDropdownOpen(false);
                      onCompanyChange(c.company_id);
                    }}
                    className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      selectedCompany === c.company_id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined !text-[14px] opacity-50">domain</span>
                      {c.company_id}
                    </span>
                    {selectedCompany === c.company_id && (
                      <span className="material-symbols-outlined !text-[15px]">check</span>
                    )}
                  </div>
                ))}
              </div>
            ) : companySearchQuery ? (
              <div className="flex flex-col items-center gap-1 py-6 text-slate-400">
                <span className="material-symbols-outlined !text-[28px]">search_off</span>
                <p className="text-xs font-medium">No companies found for &ldquo;{companySearchQuery}&rdquo;</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderSearchableCompanyIdDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "Select Company...",
    focusRingColor: string = "focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompanyId)?.company_id || '';
    const displayValue = isCompanyIdDropdownOpen ? companyIdSearchQuery : (selectedCompanyName || companyIdSearchQuery);
    return (
      <div className={`relative ${isCompanyIdDropdownOpen ? 'z-[100]' : 'z-10'}`}>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined !text-[17px]">domain</span>
          </div>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanyIdSearchQuery(e.target.value);
              setIsCompanyIdDropdownOpen(true);
              if (selectedCompanyId && e.target.value !== selectedCompanyName) {
                setSelectedCompanyId('');
                onCompanyChange('');
              }
            }}
            onFocus={() => {
              setIsCompanyIdDropdownOpen(true);
              if (selectedCompanyName && !companyIdSearchQuery) setCompanyIdSearchQuery(selectedCompanyName);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsCompanyIdDropdownOpen(false);
                setCompanyIdSearchQuery(selectedCompanyId ? selectedCompanyName : '');
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm
              placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5
              disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50
              ${selectedCompanyId ? 'font-medium' : ''}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedCompanyId && !disabled ? (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setSelectedCompanyId(''); onCompanyChange(''); setCompanyIdSearchQuery(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined !text-[18px] text-slate-400 pointer-events-none">
                {isCompanyIdDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            )}
          </div>
        </div>
        {isCompanyIdDropdownOpen && !disabled && (
          <div className="absolute z-[100] w-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
            {filteredCompaniesForId.length > 0 ? (
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredCompaniesForId.map(c => (
                  <div
                    key={c._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCompanyId(c.company_id);
                      setCompanyIdSearchQuery(c.company_id);
                      setIsCompanyIdDropdownOpen(false);
                      onCompanyChange(c.company_id);
                    }}
                    className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      selectedCompanyId === c.company_id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined !text-[14px] opacity-50">domain</span>
                      {c.company_id}
                    </span>
                    {selectedCompanyId === c.company_id && (
                      <span className="material-symbols-outlined !text-[15px]">check</span>
                    )}
                  </div>
                ))}
              </div>
            ) : companyIdSearchQuery ? (
              <div className="flex flex-col items-center gap-1 py-6 text-slate-400">
                <span className="material-symbols-outlined !text-[28px]">search_off</span>
                <p className="text-xs font-medium">No companies found for &ldquo;{companyIdSearchQuery}&rdquo;</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderSearchableProductDropdown = (
    disabled: boolean,
    onProductChange: (productId: string) => void,
    placeholder: string = "Select Product...",
    focusRingColor: string = "focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
  ) => {
    const selectedProductName = products.find(p => p.product_id === selectedProduct)?.product_id || '';
    const displayValue = isProductDropdownOpen ? productSearchQuery : (selectedProductName || productSearchQuery);
    return (
      <div className={`relative ${isProductDropdownOpen ? 'z-[100]' : 'z-10'}`}>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <span className="material-symbols-outlined !text-[17px]">search</span>
          </div>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setProductSearchQuery(e.target.value);
              setIsProductDropdownOpen(true);
              if (selectedProduct && e.target.value !== selectedProductName) {
                setSelectedProduct('');
                onProductChange('');
              }
            }}
            onFocus={() => {
              setIsProductDropdownOpen(true);
              if (selectedProductName && !productSearchQuery) setProductSearchQuery(selectedProductName);
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsProductDropdownOpen(false);
                setProductSearchQuery(selectedProduct ? selectedProductName : '');
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm
              placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5
              disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50
              ${selectedProduct ? 'font-medium' : ''}`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedProduct && !disabled ? (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setSelectedProduct(''); onProductChange(''); setProductSearchQuery(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined !text-[16px]">close</span>
              </button>
            ) : (
              <span className="material-symbols-outlined !text-[18px] text-slate-400 pointer-events-none">
                {isProductDropdownOpen ? 'expand_less' : 'expand_more'}
              </span>
            )}
          </div>
        </div>
        {isProductDropdownOpen && !disabled && (
          <div className="absolute z-[100] w-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
            {filteredProducts.length > 0 ? (
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredProducts.map(p => (
                  <div
                    key={p._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedProduct(p.product_id);
                      setProductSearchQuery(p.product_id);
                      setIsProductDropdownOpen(false);
                      onProductChange(p.product_id);
                    }}
                    className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      selectedProduct === p.product_id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined !text-[14px] opacity-50">inventory_2</span>
                      {p.product_id}
                    </span>
                    {selectedProduct === p.product_id && (
                      <span className="material-symbols-outlined !text-[15px]">check</span>
                    )}
                  </div>
                ))}
              </div>
            ) : productSearchQuery ? (
              <div className="flex flex-col items-center gap-1 py-6 text-slate-400">
                <span className="material-symbols-outlined !text-[28px]">search_off</span>
                <p className="text-xs font-medium">No products found for &ldquo;{productSearchQuery}&rdquo;</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 relative">
      {/* Floating Animations */}
      <div className="absolute top-3 right-3 flex gap-1.5 pointer-events-none select-none z-10">
        <div className="gsap-reel-floater-pink-1 w-6 h-6 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center opacity-60">
          <span className="material-symbols-outlined !text-[13px]">movie</span>
        </div>
        <div className="gsap-reel-floater-pink-2 w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center opacity-60">
          <span className="material-symbols-outlined !text-[13px]">link</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-2">
          <span className="material-symbols-outlined !text-[18px]">error</span>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">check_circle</span>
            <span className="flex-1">{successMessage}</span>
          </div>
          {justSavedPosts && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view'); setJustSavedPosts(false);
                if (lastSavedCompany) {
                  setSelectedCompany(lastSavedCompany);
                  if (lastSavedProduct) { setReelOption('product'); setSelectedProduct(lastSavedProduct); }
                  else { setReelOption('company'); }
                  setTimeout(() => handleFetchExisting(), 100);
                }
              }}
              className="mt-1 w-fit bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined !text-[14px]">visibility</span>
              View Saved Posts
            </button>
          )}
          {justUploadedUrls && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view'); setJustUploadedUrls(false);
                if (lastUploadedCompany) {
                  setSelectedCompany(lastUploadedCompany);
                  if (lastUploadedType === 'product' && lastUploadedProduct) {
                    setReelOption('product'); setSelectedProduct(lastUploadedProduct);
                  } else { setReelOption('company'); }
                  setTimeout(() => handleFetchExisting(), 100);
                }
              }}
              className="mt-1 w-fit bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined !text-[14px]">visibility</span>
              View Uploaded URLs
            </button>
          )}
          {justDeletedUrls && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('view'); setJustDeletedUrls(false);
                if (lastDeletedCompany) {
                  setSelectedCompany(lastDeletedCompany);
                  if (lastDeletedType === 'product' && lastDeletedProduct) {
                    setReelOption('product'); setSelectedProduct(lastDeletedProduct);
                  } else { setReelOption('company'); }
                  setTimeout(() => handleFetchExisting(), 100);
                }
              }}
              className="mt-1 w-fit bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined !text-[14px]">visibility</span>
              View Remaining URLs
            </button>
          )}
        </div>
      )}

      {/* Card 1: Header & Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 transition-all relative">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3.5">
          <div className="p-2 bg-[#FF6B35]/10 text-[#FF6B35] rounded-lg shadow-sm">
            <span className="material-symbols-outlined !text-[18px]">movie</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Instagram Reels Mapping</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Scrape tagged posts, classify them to products or company levels, and manage live URL connections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
          {[
            { id: 'scraper', label: 'Scraper', icon: 'schedule' },
            { id: 'review', label: 'Review', icon: 'pending' },
            { id: 'view', label: 'View', icon: 'visibility' },
            { id: 'upload', label: 'Upload', icon: 'cloud_upload' },
            { id: 'delete', label: 'Delete', icon: 'delete' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setError('');
                setSuccessMessage('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#FF6B35] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined !text-[14px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Form & Workspace Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm transition-all">
        {activeTab === 'scraper' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Queue Scraping Job</h3>
            {!isCompanyAutoSelected && (
              <div className="flex flex-col w-full">
                <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Select Company *</span>
                {renderSearchableCompanyIdDropdown(loading || parentLoading, (id) => { setSelectedCompanyId(id); setError(''); setSuccessMessage(''); })}
              </div>
            )}
            <div className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Instagram Tagged URL *</span>
              <input
                type="url"
                value={instagramTaggedUrl}
                onChange={(e) => { setInstagramTaggedUrl(e.target.value); setError(''); }}
                placeholder="https://www.instagram.com/username/tagged/"
                disabled={loading || !selectedCompanyId}
                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl p-2.5 outline-none transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] placeholder:text-slate-400 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleQueueRequest}
              disabled={loading || !selectedCompanyId || !instagramTaggedUrl.trim()}
              className="w-full bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined !text-[16px]">{loading ? 'sync' : 'schedule'}</span>
              {loading ? 'Queuing...' : 'Queue Scraping Request'}
            </button>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Review Tagged Scraped Posts</h3>
            <div className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Instagram Tagged URL (Optional filter)</span>
              <input
                type="url"
                value={reviewSourceUrl}
                onChange={(e) => { setReviewSourceUrl(e.target.value); setError(''); }}
                placeholder="https://www.instagram.com/username/tagged/ (optional)"
                disabled={loading}
                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl p-2.5 outline-none transition-all focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleFetchPendingPosts}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined !text-[16px]">{loading ? 'sync' : 'refresh'}</span>
              Fetch Pending Posts
            </button>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="flex flex-col gap-4">
            {/* Inline fetch-result callout — shown right at top of the view panel */}
            {hasFetchedReels && (
              existingUrls.length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[20px] text-amber-600">link_off</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-800">No reels mapped yet</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      No Instagram URLs are mapped for the selected {reelOption === 'product' ? 'product' : 'company'}.
                      Switch to the <span className="font-semibold">Upload</span> tab to add reel URLs.
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold text-amber-500 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">0 URLs</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="material-symbols-outlined !text-[18px] text-emerald-600">check_circle</span>
                  <p className="flex-1 text-xs font-semibold text-emerald-700">Fetched successfully</p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-0.5">{existingUrls.length} URLs</span>
                </div>
              )
            )}

            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">View Mapped Reels</h3>
            <div className="flex gap-4 p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="radio" value="company" checked={reelOption === 'company'} onChange={() => { setReelOption('company'); setExistingUrls([]); setError(''); setSuccessMessage(''); setHasFetchedReels(false); }} className="w-3.5 h-3.5 text-[#FF6B35] focus:ring-[#FF6B35]" />
                Company reels
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="radio" value="product" checked={reelOption === 'product'} onChange={() => { setReelOption('product'); setExistingUrls([]); setError(''); setSuccessMessage(''); setHasFetchedReels(false); }} className="w-3.5 h-3.5 text-[#FF6B35] focus:ring-[#FF6B35]" />
                Product reels
              </label>
            </div>

            <div className={`grid gap-3 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {!isCompanyAutoSelected && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Company *</span>
                  {renderSearchableCompanyDropdown(loading, (id) => { setSelectedCompany(id); setSelectedProduct(''); setError(''); setSuccessMessage(''); setExistingUrls([]); setHasFetchedReels(false); })}
                </div>
              )}
              {reelOption === 'product' && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Product *</span>
                  {renderSearchableProductDropdown(loading || !selectedCompany, (id) => { setSelectedProduct(id); setError(''); setSuccessMessage(''); setExistingUrls([]); setHasFetchedReels(false); })}
                </div>
              )}
            </div>

            <button
              onClick={handleFetchExisting}
              disabled={loading || !selectedCompany || (reelOption === 'product' && !selectedProduct)}
              className="w-full bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined !text-[16px]">search</span>
              Fetch Reels
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Add/Upload Reel URLs</h3>
            <div className="flex gap-4 p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="radio" value="company" checked={reelOption === 'company'} onChange={() => { setReelOption('company'); setError(''); setSuccessMessage(''); }} className="w-3.5 h-3.5 text-[#FF6B35] focus:ring-[#FF6B35]" />
                Company reels
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="radio" value="product" checked={reelOption === 'product'} onChange={() => { setReelOption('product'); setError(''); setSuccessMessage(''); }} className="w-3.5 h-3.5 text-[#FF6B35] focus:ring-[#FF6B35]" />
                Product reels
              </label>
            </div>

            <div className={`grid gap-3 ${isCompanyAutoSelected ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {!isCompanyAutoSelected && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Company *</span>
                  {renderSearchableCompanyDropdown(loading, (id) => { setSelectedCompany(id); setSelectedProduct(''); setError(''); setSuccessMessage(''); })}
                </div>
              )}
              {reelOption === 'product' && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Product *</span>
                  {renderSearchableProductDropdown(loading || !selectedCompany, (id) => { setSelectedProduct(id); setError(''); setSuccessMessage(''); })}
                </div>
              )}
            </div>

            <div className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Instagram Post URLs (One per line) *</span>
              <textarea
                className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-xl p-3 outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] min-h-[90px] font-mono transition-all"
                placeholder="https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/p/DEF456/"
                value={instagramUrls}
                onChange={(e) => setInstagramUrls(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleUploadUrls}
              disabled={loading || !selectedCompany || (reelOption === 'product' && !selectedProduct) || !instagramUrls.trim()}
              className="w-full bg-[#FF6B35] hover:bg-[#E5521C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined !text-[16px]">cloud_upload</span>
              Upload URLs
            </button>
          </div>
        )}

        {activeTab === 'delete' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Delete Reels Configuration</h3>
            <div className="flex flex-col gap-2.5 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/50">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
                <input type="radio" name="deleteOption" value="company" checked={deleteOption === 'company'} onChange={() => { setDeleteOption('company'); setError(''); setSuccessMessage(''); }} className="w-3.5 h-3.5 text-red-650 focus:ring-red-500" />
                Delete company level reels
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-100">
                <input type="radio" name="deleteOption" value="product" checked={deleteOption === 'product'} onChange={() => { setDeleteOption('product'); setError(''); setSuccessMessage(''); }} className="w-3.5 h-3.5 text-red-650 focus:ring-red-500" />
                Delete product wise reels
              </label>
              {deleteOption === 'product' && (
                <div className="ml-5 flex flex-col gap-2 border-l-2 border-slate-200 dark:border-slate-800 pl-3 mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" name="deleteProductOption" value="all" checked={deleteProductOption === 'all'} onChange={() => { setDeleteProductOption('all'); setSelectedProduct(''); setError(''); setSuccessMessage(''); }} className="w-3 h-3 text-red-500 focus:ring-red-400" />
                    Delete from all products
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="radio" name="deleteProductOption" value="specific" checked={deleteProductOption === 'specific'} onChange={() => { setDeleteProductOption('specific'); setError(''); setSuccessMessage(''); }} className="w-3 h-3 text-red-550 focus:ring-red-400" />
                    Delete specific product
                  </label>
                </div>
              )}
            </div>

            <div className={`grid gap-3 ${isCompanyAutoSelected ? 'grid-cols-1' : (deleteOption === 'product' && deleteProductOption === 'specific' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}`}>
              {!isCompanyAutoSelected && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Company *</span>
                  {renderSearchableCompanyDropdown(loading, (id) => { setSelectedCompany(id); setSelectedProduct(''); setError(''); setSuccessMessage(''); })}
                </div>
              )}
              {deleteOption === 'product' && deleteProductOption === 'specific' && (
                <div className="flex flex-col w-full">
                  <span className="text-slate-700 dark:text-slate-300 text-xs font-bold pb-1">Product *</span>
                  {renderSearchableProductDropdown(loading || !selectedCompany, (id) => { setSelectedProduct(id); setError(''); setSuccessMessage(''); })}
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={loading || !selectedCompany || (deleteOption === 'product' && deleteProductOption === 'specific' && !selectedProduct)}
              className="w-full bg-red-650 hover:bg-red-750 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span className="material-symbols-outlined !text-[16px]">delete_forever</span>
              Delete Mapped Reels
            </button>
          </div>
        )}
      </div>

      {/* Card 3: Results Display Panel (Conditional) */}
      {activeTab === 'review' && pendingPosts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#FF6B35] !text-[16px]">pending</span>
              Pending Posts ({pendingPosts.length})
            </span>
            <button
              onClick={handleSavePosts}
              disabled={loading || !pendingPosts.some(p => p.status === 'classified')}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined !text-[15px]">save</span>
              Save Classified
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pendingPosts.map((post) => (
              <div key={post._id} className={`border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-2 flex flex-col gap-2.5 transition-all ${post.status === 'classified' ? 'border-emerald-300 bg-emerald-50/5' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                  {post.thumbnail_url ? (
                    <img src={post.thumbnail_url} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><span className="material-symbols-outlined text-[32px]">image</span></div>
                  )}
                  <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider text-white ${post.status === 'classified' ? 'bg-emerald-600' : 'bg-[#FF6B35]'}`}>
                    {post.status === 'classified' ? 'Done' : 'Pending'}
                  </span>
                </div>
                <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 truncate">
                  Instagram <span className="material-symbols-outlined !text-[11px]">open_in_new</span>
                </a>
                {post.status === 'classified' && (
                  <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-md self-start truncate max-w-full">
                    {post.classification === 'company' ? 'Company' : `Prod: ${post.product_id}`}
                  </span>
                )}
                <button
                  onClick={() => openReviewEditPopup(post)}
                  className="w-full py-1.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/25 text-[#FF6B35] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined !text-[14px]">edit</span>
                  Classify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'view' && existingUrls.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 transition-all">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3">
            Existing Mapped URLs ({existingUrls.length})
          </span>
          <div className="flex flex-col gap-2">
            {existingUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20 rounded-xl hover:shadow-xs group transition-all">
                <span className="material-symbols-outlined text-[#FF6B35] !text-[15px]">link</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 truncate flex-1 hover:underline">{url}</a>
                <span className="material-symbols-outlined text-slate-400 !text-[14px]">open_in_new</span>
                <button
                  onClick={() => { setUrlToDelete(url); setDeleteDialogOpen(true); }}
                  disabled={loading}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                  title="Delete URL"
                >
                  <span className="material-symbols-outlined !text-[15px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit classification modal overlay popup */}
      {reviewEditPostId && (() => {
        const editPost = pendingPosts.find(p => p._id === reviewEditPostId);
        if (!editPost) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <span className="material-symbols-outlined text-[#FF6B35] !text-[18px]">edit</span>
                <h3 className="text-sm font-bold text-slate-855 dark:text-slate-100">Classify Video</h3>
              </div>
              <div className="p-4 flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto">
                <div className="aspect-square max-h-[140px] bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden self-center border border-slate-100 dark:border-slate-800">
                  {editPost.thumbnail_url ? <img src={editPost.thumbnail_url} alt="Post" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">image</span></div>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${reviewEditClassification === 'company' ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5 text-[#FF6B35]' : 'border-slate-150 dark:border-slate-800'}`}>
                    <input type="radio" checked={reviewEditClassification === 'company'} onChange={() => setReviewEditClassification('company')} className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]" />
                    <span className="text-xs font-bold">Company Video</span>
                  </label>
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${reviewEditClassification === 'product' ? 'border-[#FF6B35]/40 bg-[#FF6B35]/5 text-[#FF6B35]' : 'border-slate-150 dark:border-slate-800'}`}>
                    <input type="radio" checked={reviewEditClassification === 'product'} onChange={() => setReviewEditClassification('product')} className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]" />
                    <span className="text-xs font-bold">Product Video</span>
                  </label>
                </div>
                {reviewEditClassification === 'product' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Select Product *</span>
                    <select
                      value={reviewEditProductId}
                      onChange={(e) => setReviewEditProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 text-slate-800 dark:text-slate-100"
                    >
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p._id} value={p.product_id}>{p.product_id}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button onClick={closeReviewEditPopup} className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
                <button onClick={saveReviewEditPopup} disabled={reviewEditClassification === 'product' && !reviewEditProductId} className="flex-1 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E5521C] rounded-xl cursor-pointer disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete URL Modal Overlay */}
      {deleteDialogOpen && urlToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-xs w-full overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-4 flex flex-col gap-2">
              <h3 className="text-sm font-bold text-slate-855 dark:text-slate-100">Delete Link?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-150 dark:border-slate-800/80 font-mono">{urlToDelete}</p>
            </div>
            <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => { setDeleteDialogOpen(false); setUrlToDelete(null); }} className="flex-1 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button
                onClick={async () => {
                  if (!urlToDelete || !selectedCompany) return;
                  if (reelOption === 'product' && !selectedProduct) return;
                  setDeleteDialogOpen(false); setLoading(true); setError(''); setSuccessMessage('');
                  try {
                    const deleteUrl = reelOption === 'company'
                      ? `${API_BASE_URL}/instagram-images/company/${selectedCompany}/url?instagram_url=${encodeURIComponent(urlToDelete)}`
                      : `${API_BASE_URL}/instagram-images/${selectedCompany}/${selectedProduct}/url?instagram_url=${encodeURIComponent(urlToDelete)}`;
                    const response = await fetch(deleteUrl, { method: 'DELETE' });
                    const data = await response.json();
                    if (data.success) {
                      setSuccessMessage('URL deleted successfully');
                      setExistingUrls(prev => prev.filter(url => url !== urlToDelete));
                      await handleFetchExisting();
                    } else {
                      setError(data.message || 'Failed to delete');
                    }
                  } catch (err) {
                    setError('Error deleting URL');
                    console.error(err);
                  } finally {
                    setLoading(false); setUrlToDelete(null);
                  }
                }}
                className="flex-1 py-1.5 text-xs font-semibold text-white bg-red-650 hover:bg-red-755 rounded-lg cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramReelTab;
