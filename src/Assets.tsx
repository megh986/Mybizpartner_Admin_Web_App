import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './css/Assets.css';
import Sidebar from './components/Sidebar';
import ProductMappingTab from './assets/ProductMappingTab';
import InstagramReelTab from './assets/InstagramReelTab';
import ContentTab from './assets/ContentTab';
import ExtraDetailTab from './assets/ExtraDetailTab';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

interface Company {
  _id: string;
  name: string;
  company_id: string;
}

interface Product {
  _id: string;
  name: string;
  product_id: string;
  company_id: string;
}

interface AssetsProps {
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
  onNavigateToReviews: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToWhatsApp?: () => void;
}

type AssetTab = 'product-mapping' | 'instagram-reel' | 'content' | 'extra-detail';

const Assets: React.FC<AssetsProps> = ({ userData, onBack, onNavigateToBilling, onNavigateToReviews, onNavigateToAnalytics, onNavigateToAdmin, onNavigateToPayment, onNavigateToProfile, onNavigateToHelp, onNavigateToWhatsApp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: AssetTab =
    location.pathname === '/assets/instagram-reel'
      ? 'instagram-reel'
      : location.pathname === '/assets/content'
        ? 'content'
        : location.pathname === '/assets/extra-detail'
          ? 'extra-detail'
          : 'product-mapping';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has access to a specific asset tab
  const hasTabAccess = (tab: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (!userData.tab_access) return true;
    // Accept both the specific key and the umbrella 'assets' key
    return userData.tab_access.includes(tab) || userData.tab_access.includes('assets');
  };

  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Product search state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Company search state
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  // Determine if company should be auto-selected (non-admin with single company)
  const isCompanyAutoSelected = userData && userData.role !== 'admin' && companies.length === 1;

  // Clear success/error when user switches tab
  useEffect(() => {
    setSuccess('');
    setError('');
  }, [activeTab]);

  // Auto-dismiss success and error banners after 3 seconds so they don't block the UI (e.g. updated display locations)
  useEffect(() => {
    if (!success && !error) return;
    const timer = setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [success, error]);

  // Fetch companies on mount
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

        // Auto-select company for non-admin users with only one company
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

  // Fetch products when company is selected
  useEffect(() => {
    if (selectedCompany) {
      fetchProducts(selectedCompany);
    } else {
      setProducts([]);
      setSelectedProduct('');
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
  }, [selectedCompany, companies]);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.product_id.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  // Filter companies based on search query (by company_id)
  const filteredCompanies = companies.filter(company =>
    company.company_id.toLowerCase().includes(companySearchQuery.toLowerCase())
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

  // Reusable Searchable Product Dropdown Component
  const renderSearchableProductDropdown = (
    disabled: boolean,
    onProductChange: (productId: string) => void,
    placeholder: string = "Select product...",
    focusRingColor: string = "focus:ring-primary/20 focus:border-primary"
  ) => {
    const selectedProductName = products.find(p => p.product_id === selectedProduct)?.product_id || '';
    const displayValue = isProductDropdownOpen ? productSearchQuery : (selectedProductName || productSearchQuery);

    return (
      <div className="relative z-20">
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
            className={`w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg ${focusRingColor} block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>

        {/* Dropdown List */}
        {isProductDropdownOpen && !disabled && filteredProducts.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedProduct === product.product_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                  }`}
              >
                {product.product_id}
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {isProductDropdownOpen && !disabled && productSearchQuery && filteredProducts.length === 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No products found matching "{productSearchQuery}"
          </div>
        )}
      </div>
    );
  };

  // Reusable Searchable Company Dropdown Component
  const renderSearchableCompanyDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "Select company...",
    focusRingColor: string = "focus:ring-primary/20 focus:border-primary",
    useCompanyName: boolean = false
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompany);
    const displayValue = isCompanyDropdownOpen
      ? companySearchQuery
      : (selectedCompanyName
        ? (useCompanyName ? selectedCompanyName.name || selectedCompanyName.company_id : selectedCompanyName.company_id)
        : companySearchQuery);

    return (
      <div className="relative z-20">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanySearchQuery(e.target.value);
              setIsCompanyDropdownOpen(true);
              // Clear selection if user starts typing something different
              if (selectedCompany) {
                const currentName = useCompanyName
                  ? (selectedCompanyName?.name || selectedCompanyName?.company_id || '')
                  : (selectedCompanyName?.company_id || '');
                if (e.target.value !== currentName) {
                  setSelectedCompany('');
                  onCompanyChange('');
                }
              }
            }}
            onFocus={() => {
              setIsCompanyDropdownOpen(true);
              // If there's a selected company, show it in search, otherwise keep current search
              if (selectedCompanyName && !companySearchQuery) {
                const companyDisplay = useCompanyName
                  ? (selectedCompanyName.name || selectedCompanyName.company_id)
                  : selectedCompanyName.company_id;
                setCompanySearchQuery(companyDisplay);
              }
            }}
            onBlur={() => {
              // Delay closing to allow click on dropdown item
              setTimeout(() => {
                setIsCompanyDropdownOpen(false);
                // If no company selected, clear search. Otherwise show selected company
                if (!selectedCompany) {
                  setCompanySearchQuery('');
                } else if (selectedCompanyName) {
                  const companyDisplay = useCompanyName
                    ? (selectedCompanyName.name || selectedCompanyName.company_id)
                    : selectedCompanyName.company_id;
                  setCompanySearchQuery(companyDisplay);
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

        {/* Dropdown List */}
        {isCompanyDropdownOpen && !disabled && filteredCompanies.length > 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCompanies.map((company) => {
              const companyDisplay = useCompanyName ? (company.name || company.company_id) : company.company_id;
              return (
                <div
                  key={company._id}
                  onMouseDown={(e) => {
                    // Use onMouseDown instead of onClick to prevent onBlur from firing first
                    e.preventDefault();
                    setSelectedCompany(company.company_id);
                    setCompanySearchQuery(companyDisplay);
                    setIsCompanyDropdownOpen(false);
                    onCompanyChange(company.company_id);
                  }}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors ${selectedCompany === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                    }`}
                >
                  {companyDisplay}
                </div>
              );
            })}
          </div>
        )}

        {/* No results message */}
        {isCompanyDropdownOpen && !disabled && companySearchQuery && filteredCompanies.length === 0 && (
          <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No companies found matching "{companySearchQuery}"
          </div>
        )}
      </div>
    );
  };

  const sharedProductMappingProps = {
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

  const sharedContentProps = { ...sharedProductMappingProps };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="assets"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={() => { }}
        // onNavigateToBilling={onNavigateToBilling}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative w-full min-w-0 bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-7xl mx-auto w-full">
          {/* Breadcrumbs */}
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
              Assets
            </span>
          </div>

          {/* Page Heading */}
          <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-primary-text text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                Connect Your Brand Presence
              </h1>
              <p className="text-secondary-text text-base font-normal leading-relaxed">
                Manage product mapping, social connections, and upload content to power your trust engine.
              </p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              {hasTabAccess('assets_product_mapping') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'product-mapping'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                    }`}
                  onClick={() => navigate('/assets/product-mapping')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">inventory_2</span>
                    Product Mapping
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">inventory_2</span>
                    Product Mapping
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
              {hasTabAccess('assets_instagram_reel') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'instagram-reel'
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                  onClick={() => navigate('/assets/instagram-reel')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">movie</span>
                    Instagram Reel
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">movie</span>
                    Instagram Reel
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
              {hasTabAccess('assets_content') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'content'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                  onClick={() => navigate('/assets/content')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">folder</span>
                    Content
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">folder</span>
                    Content
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
              {hasTabAccess('assets_extra_detail') ? (
                <button
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'extra-detail'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                  onClick={() => navigate('/assets/extra-detail')}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">tune</span>
                    Extra Detail
                  </span>
                </button>
              ) : (
                <button
                  className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group"
                  disabled
                  title="Contact admin to unlock this feature"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">tune</span>
                    Extra Detail
                    <span className="material-symbols-outlined !text-[14px]">lock</span>
                  </span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-20">
          {activeTab === 'product-mapping' && <ProductMappingTab {...sharedProductMappingProps} />}
          {activeTab === 'instagram-reel' && <InstagramReelTab companies={companies} loading={loading} userData={userData} />}
          {activeTab === 'content' && <ContentTab {...sharedContentProps} />}
          {activeTab === 'extra-detail' && (
            <ExtraDetailTab
              userData={userData}
              companies={companies}
              selectedCompany={selectedCompany}
              loading={loading}
              error={error}
              success={success}
              setError={setError}
              setSuccess={setSuccess}
              setLoading={setLoading}
              setSelectedCompany={setSelectedCompany}
              isCompanyAutoSelected={!!isCompanyAutoSelected}
              renderSearchableCompanyDropdown={renderSearchableCompanyDropdown}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Assets;
