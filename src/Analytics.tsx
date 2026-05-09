import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import OverviewTab from './analytics/OverviewTab';
import WomEffectivenessTab from './analytics/WomEffectivenessTab';
import UserPatternsTab from './analytics/UserPatternsTab';
import ProductComparisonTab from './analytics/ProductComparisonTab';
import HomePageTab from './analytics/HomePageTab';
import ProductReviewMetricsTab from './analytics/ProductReviewMetricsTab';

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

type AnalyticsTab = 'overview' | 'wom-effectiveness' | 'user-patterns' | 'product-comparison' | 'homepage' | 'product-review-metrics';

interface AnalyticsProps {
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
  onNavigateToReviews: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToWhatsApp?: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({
  userData,
  onBack,
  onNavigateToReviews,
  onNavigateToAssets,
  onNavigateToAdmin,
  onNavigateToPayment,
  onNavigateToProfile,
  onNavigateToWhatsApp,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on URL
  const activeTab: AnalyticsTab = (() => {
    if (location.pathname === '/analytics/wom-effectiveness') return 'wom-effectiveness';
    if (location.pathname === '/analytics/user-patterns') return 'user-patterns';
    if (location.pathname === '/analytics/product-comparison') return 'product-comparison';
    if (location.pathname === '/analytics/homepage') return 'homepage';
    if (location.pathname === '/analytics/product-review-metrics') return 'product-review-metrics';
    return 'overview';
  })();

  // Enabled formulas for the selected company (fetched from analytics config)
  const [enabledFormulas, setEnabledFormulas] = useState<string[]>(['overview']);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has access to a specific analytics tab
  const hasTabAccess = (tab: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (!userData.tab_access) return true;
    return userData.tab_access.includes(tab) || userData.tab_access.includes('analytics');
  };

  // State for company and product selection
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const isCompanyAutoSelected = userData && userData.role !== 'admin' && companies.length === 1;

  // Fetch enabled formulas for the selected company
  useEffect(() => {
    if (!selectedCompany) return;
    const sessionToken = localStorage.getItem('session_token');
    fetch(`${API_BASE_URL}/analytics/companies/${selectedCompany}`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.enabled_formulas) {
          setEnabledFormulas(json.enabled_formulas);
        }
      })
      .catch(() => {/* silently fall back to default */});
  }, [selectedCompany]);

  // Fetch companies
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
        let filteredCompanies = data.companies;

        if (userData?.role === 'user' && userData?.company_ids) {
          filteredCompanies = data.companies.filter((company: Company) =>
            userData.company_ids?.includes(company.company_id)
          );
        }

        setCompanies(filteredCompanies);

        // Auto-select if user has only one company
        if (userData && userData.role !== 'admin' && filteredCompanies.length === 1) {
          setSelectedCompany(filteredCompanies[0].company_id);
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
      const companyName = companies.find((c) => c.company_id === selectedCompany)?.company_id || '';
      setCompanySearchQuery(companyName);
    } else {
      setProducts([]);
      setCompanySearchQuery('');
    }
    setIsCompanyDropdownOpen(false);
  }, [selectedCompany, companies]);

  const filteredCompanies = companies.filter((company) =>
    company.company_id.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const selectedCompanyData = companies.find(c => c.company_id === selectedCompany);

  // Searchable company dropdown renderer
  const renderSearchableCompanyDropdown = () => {
    const selectedCompanyName = companies.find((c) => c.company_id === selectedCompany)?.company_id || '';
    const displayValue = isCompanyDropdownOpen ? companySearchQuery : selectedCompanyName || companySearchQuery;

    return (
      <div className="relative w-full max-w-md">
        <div className="relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setCompanySearchQuery(e.target.value);
              setIsCompanyDropdownOpen(true);
              if (selectedCompany && e.target.value !== selectedCompanyName) {
                setSelectedCompany('');
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
            placeholder="Search by company ID..."
            disabled={loading}
            className="w-full bg-white border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-3.5 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-secondary-text">
            <span className="material-symbols-outlined">search</span>
          </div>
        </div>

        {isCompanyDropdownOpen && !loading && filteredCompanies.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelectedCompany(company.company_id);
                  setCompanySearchQuery(company.company_id);
                  setIsCompanyDropdownOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                  selectedCompany === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'
                }`}
              >
                <p className="font-medium">{company.company_id}</p>
                {company.name && <p className="text-xs text-secondary-text">{company.name}</p>}
              </div>
            ))}
          </div>
        )}

        {isCompanyDropdownOpen && !loading && companySearchQuery && filteredCompanies.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
            No companies found matching "{companySearchQuery}"
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="analytics"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAssets={onNavigateToAssets}
        onNavigateToAnalytics={() => navigate('/analytics')}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative w-full min-w-0 bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-7xl mx-auto w-full">
          {/* Breadcrumb */}
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
              Analytics
            </span>
          </div>

          {/* Title Section */}
          <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
            <div className="flex flex-col gap-2 max-w-2xl">
              <h1 className="text-primary-text text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-secondary-text text-base font-normal leading-relaxed">
                Track visitor engagement, review interactions, and product performance metrics.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live Data</span>
            </div>
          </div>
        </header>

        {/* Company Selection Card */}
        <div className="px-6 md:px-10 lg:px-12 max-w-7xl mx-auto w-full mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <span className="material-symbols-outlined">business</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-text">Select Company</h2>
                <p className="text-xs text-secondary-text mt-0.5">Choose a company to view analytics</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
            )}

            {!isCompanyAutoSelected ? (
              <div className="flex flex-col gap-2">
                <label className="text-primary-text text-sm font-semibold">Company *</label>
                {renderSearchableCompanyDropdown()}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <span className="material-symbols-outlined text-blue-600">check_circle</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">Company Auto-Selected</p>
                  <p className="text-lg font-bold text-blue-700">{selectedCompanyData?.company_id || selectedCompany}</p>
                </div>
              </div>
            )}

            {selectedCompany && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <span className="material-symbols-outlined text-green-600">verified</span>
                <div>
                  <p className="text-sm font-medium text-green-800">Currently Viewing</p>
                  <p className="text-lg font-bold text-green-700">{selectedCompanyData?.company_id || selectedCompany}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-green-600">{products.length} Products</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show content only if company is selected */}
        {selectedCompany ? (
          <>
            {/* Tabs Navigation */}
            <div className="px-6 md:px-10 lg:px-12 max-w-7xl mx-auto w-full">
              <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-1 overflow-x-auto">
                  {/* Overview tab */}
                  {hasTabAccess('analytics') ? (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'overview'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">insights</span>
                        Overview
                      </span>
                    </button>
                  ) : (
                    <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-300 cursor-not-allowed relative group whitespace-nowrap" disabled>
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">insights</span>
                        Overview
                        <span className="material-symbols-outlined !text-[14px]">lock</span>
                      </span>
                    </button>
                  )}

                  {/* WOM Effectiveness tab — only if formula is enabled */}
                  {enabledFormulas.includes('wom_effectiveness') && (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'wom-effectiveness'
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics/wom-effectiveness')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">trending_up</span>
                        WOM Effectiveness
                      </span>
                    </button>
                  )}

                  {/* User Patterns tab — only if formula is enabled */}
                  {enabledFormulas.includes('user_patterns') && (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'user-patterns'
                          ? 'border-violet-600 text-violet-600'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics/user-patterns')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">people</span>
                        User Patterns
                      </span>
                    </button>
                  )}

                  {/* Product Comparison tab — only if formula is enabled */}
                  {enabledFormulas.includes('product_comparison') && (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'product-comparison'
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics/product-comparison')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">compare_arrows</span>
                        WOM vs Normal
                      </span>
                    </button>
                  )}

                  {/* Homepage tab — only if formula is enabled */}
                  {enabledFormulas.includes('homepage') && (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'homepage'
                          ? 'border-orange-500 text-orange-500'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics/homepage')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">home</span>
                        Homepage
                      </span>
                    </button>
                  )}

                  {/* Product Review Metrics tab — always accessible like Product Reviews */}
                  {hasTabAccess('analytics_product_reviews') && (
                    <button
                      className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                        activeTab === 'product-review-metrics'
                          ? 'border-pink-500 text-pink-500'
                          : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                      }`}
                      onClick={() => navigate('/analytics/product-review-metrics')}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined !text-[18px]">star_rate</span>
                        Review Metrics
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content — all tabs stay mounted; only the active one is visible */}
            <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full pb-20">
              <div className={activeTab === 'overview' ? 'flex flex-col gap-8' : 'hidden'}>
                <OverviewTab
                  selectedCompany={selectedCompany}
                  companyName={selectedCompanyData?.name || selectedCompany}
                  products={products}
                />
              </div>
              {enabledFormulas.includes('wom_effectiveness') && (
                <div className={activeTab === 'wom-effectiveness' ? 'flex flex-col gap-8' : 'hidden'}>
                  <WomEffectivenessTab
                    selectedCompany={selectedCompany}
                    companyName={selectedCompanyData?.name || selectedCompany}
                  />
                </div>
              )}
              {enabledFormulas.includes('user_patterns') && (
                <div className={activeTab === 'user-patterns' ? 'flex flex-col gap-8' : 'hidden'}>
                  <UserPatternsTab
                    selectedCompany={selectedCompany}
                    companyName={selectedCompanyData?.name || selectedCompany}
                  />
                </div>
              )}
              {enabledFormulas.includes('product_comparison') && (
                <div className={activeTab === 'product-comparison' ? 'flex flex-col gap-8' : 'hidden'}>
                  <ProductComparisonTab
                    selectedCompany={selectedCompany}
                    companyName={selectedCompanyData?.name || selectedCompany}
                  />
                </div>
              )}
              {enabledFormulas.includes('homepage') && (
                <div className={activeTab === 'homepage' ? 'flex flex-col gap-8' : 'hidden'}>
                  <HomePageTab
                    selectedCompany={selectedCompany}
                    companyName={selectedCompanyData?.name || selectedCompany}
                  />
                </div>
              )}
              {hasTabAccess('analytics_product_reviews') && (
                <div className={activeTab === 'product-review-metrics' ? 'flex flex-col gap-8' : 'hidden'}>
                  <ProductReviewMetricsTab
                    selectedCompany={selectedCompany}
                    companyName={selectedCompanyData?.name || selectedCompany}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full flex items-center justify-center">
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 max-w-md">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">analytics</span>
              <h3 className="text-lg font-bold text-primary-text mb-2">Select a Company</h3>
              <p className="text-secondary-text text-sm">
                Please select a company from the dropdown above to view analytics and product reviews.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
