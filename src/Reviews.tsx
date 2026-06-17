import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ReviewsTab from './reviews/ReviewsTab';
import StatsTab from './reviews/StatsTab';
import RealReviewsTab from './reviews/RealReviewsTab';
import type { Company, Product } from './reviews/types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

type ReviewTab = 'reviews' | 'stats' | 'real_reviews';

interface ReviewsProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
    tab_access?: string[];
  } | null;
  onBack: () => void;
  onNavigateToBilling: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToWhatsApp?: () => void;
}

const Reviews: React.FC<ReviewsProps> = ({
  userData,
  onBack,
  onNavigateToAssets,
  onNavigateToAnalytics,
  onNavigateToAdmin,
  onNavigateToPayment,
  onNavigateToProfile,
  onNavigateToWhatsApp,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: ReviewTab =
    location.pathname === '/reviews/stats' ? 'stats' :
    location.pathname === '/reviews/real-reviews' ? 'real_reviews' : 'reviews';

  const [sidebarOpen, setSidebarOpen] = useState(false);



  // Check if user has access to a specific reviews tab
  const hasTabAccess = (tab: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (!userData.tab_access) return true;
    if (tab === 'real_reviews') return userData.tab_access.includes('real_reviews');
    return userData.tab_access.includes(tab) || userData.tab_access.includes('reviews');
  };
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const isCompanyAutoSelected =
    userData && userData.role !== 'admin' && companies.length === 1;

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem('session_token');
      const response = await fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Backend now filters companies based on user role
        setCompanies(data.companies);

        if (userData && userData.role !== 'admin' && data.companies.length === 1) {
          setSelectedCompany(data.companies[0].company_id);
        }
      } else {
        setError('Failed to fetch companies');
      }
    } catch (err) {
      setError('Error fetching companies. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const fetchProducts = async (companyId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${IMAGE_API_BASE_URL}/products/${companyId}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Error fetching products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchProducts(selectedCompany);
    } else {
      setProducts([]);
      setSelectedProduct('');
    }
    setProductSearchQuery('');
    setIsProductDropdownOpen(false);
    if (selectedCompany) {
      const companyName = companies.find((c) => c.company_id === selectedCompany)?.company_id || '';
      setCompanySearchQuery(companyName);
    } else {
      setCompanySearchQuery('');
    }
  }, [selectedCompany, companies]);

  const filteredProducts = products.filter((product) =>
    product.product_id.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter((company) =>
    company.company_id.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!selectedProduct) {
      setProductSearchQuery('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, products]);

  const renderSearchableProductDropdown = (
    disabled: boolean,
    onProductChange: (productId: string) => void,
    placeholder: string = 'Select product...',
    focusRingColor: string = 'focus:ring-primary/20 focus:border-primary'
  ) => {
    const selectedProductName = products.find((p) => p.product_id === selectedProduct)?.product_id || '';
    const displayValue = isProductDropdownOpen ? productSearchQuery : selectedProductName || productSearchQuery;

    return (
      <div className="relative z-20">
        {/* Input */}
        <div className="relative group">
          {/* Left search icon */}
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
              if (selectedProductName && !productSearchQuery) {
                setProductSearchQuery(selectedProductName);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsProductDropdownOpen(false);
                if (!selectedProduct) {
                  setProductSearchQuery('');
                } else {
                  setProductSearchQuery(selectedProductName);
                }
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm
              placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5
              disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50
              ${selectedProduct ? 'font-medium' : ''}`}
          />
          {/* Right: clear button or chevron */}
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

        {/* Dropdown panel */}
        {isProductDropdownOpen && !disabled && (
          <div className="absolute z-[100] w-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
            {filteredProducts.length > 0 ? (
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedProduct(product.product_id);
                      setProductSearchQuery(product.product_id);
                      setIsProductDropdownOpen(false);
                      onProductChange(product.product_id);
                    }}
                    className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      selectedProduct === product.product_id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined !text-[14px] opacity-50">inventory_2</span>
                      {product.product_id}
                    </span>
                    {selectedProduct === product.product_id && (
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

  const renderSearchableCompanyDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = 'Select company...',
    focusRingColor: string = 'focus:ring-primary/20 focus:border-primary'
  ) => {
    const selectedCompanyName = companies.find((c) => c.company_id === selectedCompany)?.company_id || '';
    const displayValue = isCompanyDropdownOpen ? companySearchQuery : selectedCompanyName || companySearchQuery;

    return (
      <div className="relative z-20">
        {/* Input */}
        <div className="relative group">
          {/* Left domain icon */}
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
              if (selectedCompanyName && !companySearchQuery) {
                setCompanySearchQuery(selectedCompanyName);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsCompanyDropdownOpen(false);
                if (!selectedCompany) {
                  setCompanySearchQuery('');
                } else {
                  setCompanySearchQuery(selectedCompanyName);
                }
              }, 200);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm
              placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5
              disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50
              ${selectedCompany ? 'font-medium' : ''}`}
          />
          {/* Right: clear or chevron */}
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

        {/* Dropdown panel */}
        {isCompanyDropdownOpen && !disabled && (
          <div className="absolute z-[100] w-full mt-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
            {filteredCompanies.length > 0 ? (
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredCompanies.map((company) => (
                  <div
                    key={company._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSelectedCompany(company.company_id);
                      setCompanySearchQuery(company.company_id);
                      setIsCompanyDropdownOpen(false);
                      onCompanyChange(company.company_id);
                    }}
                    className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                      selectedCompany === company.company_id
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined !text-[14px] opacity-50">domain</span>
                      {company.company_id}
                    </span>
                    {selectedCompany === company.company_id && (
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

  const sharedTabProps = {
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
    isCompanyAutoSelected: !!isCompanyAutoSelected,
    renderSearchableCompanyDropdown,
    renderSearchableProductDropdown,
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="reviews"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={() => { }}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={onNavigateToAssets}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative w-full min-w-0 bg-background-light dark:bg-background-dark">

        {/* Page Hero Header — replaces breadcrumb */}
        <header className="relative overflow-hidden bg-white border-b border-slate-100">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-[#FF6B35]/6 blur-3xl" />
            <div className="absolute top-4 right-60 w-40 h-40 rounded-full bg-purple-500/5 blur-2xl" />
          </div>

          <div className="relative flex items-center justify-between px-4 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full">
            {/* Left: hamburger (mobile) + text */}
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden size-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div>
                <h1 className="text-primary-text text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                  Review Management
                </h1>
                <p className="text-secondary-text text-sm font-normal mt-0.5">
                  View, edit, and manage product reviews and image statistics.
                </p>
              </div>
            </div>

          </div>
        </header>


        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80 shadow-sm flex flex-wrap gap-1 w-fit mb-4">
            {hasTabAccess('reviews') ? (
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reviews'
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#ff9770] text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary-text hover:bg-white/60 dark:hover:bg-slate-800/50'
                  }`}
                onClick={() => navigate('/reviews')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">rate_review</span>
                  Manage
                </span>
              </button>
            ) : (
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed relative group flex items-center gap-2"
                disabled
                title="Contact admin to unlock this feature"
              >
                <span className="material-symbols-outlined !text-[18px]">rate_review</span>
                Manage
                <span className="material-symbols-outlined !text-[14px]">lock</span>
              </button>
            )}
            {hasTabAccess('reviews_stats') ? (
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary-text hover:bg-white/60 dark:hover:bg-slate-800/50'
                  }`}
                onClick={() => navigate('/reviews/stats')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">bar_chart</span>
                  Stats
                </span>
              </button>
            ) : (
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed relative group flex items-center gap-2"
                disabled
                title="Contact admin to unlock this feature"
              >
                <span className="material-symbols-outlined !text-[18px]">bar_chart</span>
                Stats
                <span className="material-symbols-outlined !text-[14px]">lock</span>
              </button>
            )}
            {hasTabAccess('real_reviews') && (
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'real_reviews'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary-text hover:bg-white/60 dark:hover:bg-slate-800/50'
                  }`}
                onClick={() => navigate('/reviews/real-reviews')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">verified</span>
                  Verified
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-20">
          {activeTab === 'reviews' && <ReviewsTab {...sharedTabProps} />}
          {activeTab === 'stats' && <StatsTab {...sharedTabProps} />}
          {activeTab === 'real_reviews' && <RealReviewsTab {...sharedTabProps} />}
        </div>
      </main>
    </div>
  );
};

export default Reviews;
