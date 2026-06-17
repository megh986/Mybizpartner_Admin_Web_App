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
    focusRingColor: string = "focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]"
  ) => {
    const selectedProductName = products.find(p => p.product_id === selectedProduct)?.product_id || '';
    const displayValue = isProductDropdownOpen ? productSearchQuery : (selectedProductName || productSearchQuery);

    return (
      <div className={`relative ${isProductDropdownOpen ? 'z-[100]' : 'z-20'}`}>
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

  // Reusable Searchable Company Dropdown Component
  const renderSearchableCompanyDropdown = (
    disabled: boolean,
    onCompanyChange: (companyId: string) => void,
    placeholder: string = "Select company...",
    focusRingColor: string = "focus:ring-[#FF6B35]/20 focus:border-[#FF6B35]",
    useCompanyName: boolean = false
  ) => {
    const selectedCompanyName = companies.find(c => c.company_id === selectedCompany);
    const displayValue = isCompanyDropdownOpen
      ? companySearchQuery
      : (selectedCompanyName
        ? (useCompanyName ? selectedCompanyName.name || selectedCompanyName.company_id : selectedCompanyName.company_id)
        : companySearchQuery);

    return (
      <div className={`relative ${isCompanyDropdownOpen ? 'z-[100]' : 'z-20'}`}>
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
              if (selectedCompanyName && !companySearchQuery) {
                const companyDisplay = useCompanyName
                  ? (selectedCompanyName.name || selectedCompanyName.company_id)
                  : selectedCompanyName.company_id;
                setCompanySearchQuery(companyDisplay);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsCompanyDropdownOpen(false);
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
                {filteredCompanies.map((company) => {
                  const companyDisplay = useCompanyName ? (company.name || company.company_id) : company.company_id;
                  return (
                    <div
                      key={company._id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCompany(company.company_id);
                        setCompanySearchQuery(companyDisplay);
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
                        {companyDisplay}
                      </span>
                      {selectedCompany === company.company_id && (
                        <span className="material-symbols-outlined !text-[15px]">check</span>
                      )}
                    </div>
                  );
                })}
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
        {/* Mobile Sidebar Toggle Header */}
        <header className="lg:hidden relative bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 py-3.5 px-4 flex items-center shrink-0">
          <button
            className="size-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full mt-6">
          <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-4 max-w-fit shadow-xs">
            <div className="flex flex-wrap gap-1">
              {hasTabAccess('assets_product_mapping') ? (
                <button
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'product-mapping'
                      ? 'bg-[#FF6B35] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => navigate('/assets/product-mapping')}
                >
                  <span className="material-symbols-outlined !text-[15px]">link</span>
                  Product Mapping
                </button>
              ) : (
                <button
                  className="px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed flex items-center gap-1.5 relative group"
                  disabled
                >
                  <span className="material-symbols-outlined !text-[15px]">link</span>
                  Product Mapping
                  <span className="material-symbols-outlined !text-[12px]">lock</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}

              {hasTabAccess('assets_instagram_reel') ? (
                <button
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'instagram-reel'
                      ? 'bg-[#FF6B35] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => navigate('/assets/instagram-reel')}
                >
                  <span className="material-symbols-outlined !text-[15px]">smart_display</span>
                  Instagram Reel
                </button>
              ) : (
                <button
                  className="px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed flex items-center gap-1.5 relative group"
                  disabled
                >
                  <span className="material-symbols-outlined !text-[15px]">smart_display</span>
                  Instagram Reel
                  <span className="material-symbols-outlined !text-[12px]">lock</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}

              {hasTabAccess('assets_content') ? (
                <button
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'content'
                      ? 'bg-[#FF6B35] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => navigate('/assets/content')}
                >
                  <span className="material-symbols-outlined !text-[15px]">collections</span>
                  Content
                </button>
              ) : (
                <button
                  className="px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed flex items-center gap-1.5 relative group"
                  disabled
                >
                  <span className="material-symbols-outlined !text-[15px]">collections</span>
                  Content
                  <span className="material-symbols-outlined !text-[12px]">lock</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}

              {hasTabAccess('assets_extra_detail') ? (
                <button
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === 'extra-detail'
                      ? 'bg-[#FF6B35] text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                  }`}
                  onClick={() => navigate('/assets/extra-detail')}
                >
                  <span className="material-symbols-outlined !text-[15px]">tune</span>
                  Extra Detail
                </button>
              ) : (
                <button
                  className="px-4 py-2 text-xs font-bold text-slate-300 dark:text-slate-700 cursor-not-allowed flex items-center gap-1.5 relative group"
                  disabled
                >
                  <span className="material-symbols-outlined !text-[15px]">tune</span>
                  Extra Detail
                  <span className="material-symbols-outlined !text-[12px]">lock</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    Contact admin to unlock
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4 md:px-10 lg:px-12 py-2 max-w-7xl mx-auto w-full flex flex-col gap-4 pb-10">
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
