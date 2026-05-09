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
        <div className="relative">
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
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>

        {isProductDropdownOpen && !disabled && filteredProducts.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedProduct === product.product_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                  }`}
              >
                {product.product_id}
              </div>
            ))}
          </div>
        )}

        {isProductDropdownOpen && !disabled && productSearchQuery && filteredProducts.length === 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No products found matching &quot;{productSearchQuery}&quot;
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
        <div className="relative">
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
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>

        {isCompanyDropdownOpen && !disabled && filteredCompanies.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedCompany === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                  }`}
              >
                {company.company_id}
              </div>
            ))}
          </div>
        )}

        {isCompanyDropdownOpen && !disabled && companySearchQuery && filteredCompanies.length === 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No companies found matching &quot;{companySearchQuery}&quot;
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
        <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap gap-2 items-center mb-6">
            <button
              className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button
              onClick={onBack}
              className="text-secondary-text text-sm font-medium hover:text-primary transition-colors"
            >
              Home
            </button>
            <span className="text-secondary-text text-sm font-medium">/</span>
            <span className="text-primary-text text-sm font-semibold bg-gray-200/50 px-2 py-0.5 rounded text-primary">
              Reviews
            </span>
          </div>

          <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-primary-text text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                Review Management
              </h1>
              <p className="text-secondary-text text-base font-normal leading-relaxed">
                View, edit, and manage product reviews and image statistics.
              </p>
            </div>
            {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-secondary-text hover:bg-gray-50 hover:text-primary-text transition-all">
              <span className="material-symbols-outlined !text-[20px]">help</span>
              Help Guide
            </button> */}
          </div>
        </header>

        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              {hasTabAccess('reviews') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reviews'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                    }`}
                  onClick={() => navigate('/reviews')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">rate_review</span>
                    Reviews
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">rate_review</span>
                    Reviews
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
              {hasTabAccess('reviews_stats') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats'
                      ? 'border-purple-500 text-purple-500'
                      : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
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
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">bar_chart</span>
                    Stats
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
              {hasTabAccess('real_reviews') && (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'real_reviews'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                    }`}
                  onClick={() => navigate('/reviews/real-reviews')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">verified</span>
                    Real Reviews
                  </span>
                </button>
              )}
            </div>
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
