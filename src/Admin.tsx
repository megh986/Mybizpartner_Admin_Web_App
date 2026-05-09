import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RegisterUserTab from './admin/RegisterUserTab';
import CreateCompanyTab from './admin/CreateCompanyTab';
import ManageAccessTab from './admin/ManageAccessTab';
import AnalyticsConfigTab from './admin/AnalyticsConfigTab';

interface AdminProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
  } | null;
  onBack: () => void;
  onNavigateToAssets: () => void;
  onNavigateToBilling: () => void;
  onNavigateToReviews: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToPayment: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToWhatsApp?: () => void;
}

type AdminTab = 'register-user' | 'create-company' | 'manage-access' | 'analytics-config';

const Admin: React.FC<AdminProps> = ({ userData, onBack, onNavigateToAssets, onNavigateToBilling, onNavigateToReviews, onNavigateToAnalytics, onNavigateToPayment, onNavigateToProfile, onNavigateToHelp, onNavigateToWhatsApp }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: AdminTab =
    location.pathname === '/admin/create-company' ? 'create-company'
    : location.pathname === '/admin/manage-access' ? 'manage-access'
    : location.pathname === '/admin/analytics-config' ? 'analytics-config'
    : 'register-user';
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (userData?.role !== 'admin') {
      onBack();
    }
  }, [userData, onBack]);

  // Don't render for non-admin users
  if (userData?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="admin"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={onNavigateToAssets}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToAdmin={() => { }}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative w-full min-w-0 bg-background-light dark:bg-background-dark">
        {/* Header */}
        <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-7xl mx-auto w-full">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-secondary-text mb-4">
            <button
              type="button"
              className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button type="button" onClick={onBack} className="hover:text-primary transition-colors">Home</button>
            <span>/</span>
            <span className="text-primary-text">Admin</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-text font-heading tracking-tight">
                Admin Panel
              </h1>
              <p className="text-secondary-text mt-2 max-w-2xl">
                Manage users and companies. Register new users and create company accounts.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex gap-1 overflow-x-auto">
              <button
                type="button"
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'register-user'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                onClick={() => navigate('/admin/register-user')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">person_add</span>
                  Register User
                </span>
              </button>
              <button
                type="button"
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'create-company'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                onClick={() => navigate('/admin/create-company')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">domain_add</span>
                  Create Company
                </span>
              </button>
              <button
                type="button"
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'manage-access'
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                onClick={() => navigate('/admin/manage-access')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">shield_person</span>
                  Manage Access
                </span>
              </button>
              <button
                type="button"
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'analytics-config'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                onClick={() => navigate('/admin/analytics-config')}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[18px]">analytics</span>
                  Analytics Config
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-20">
          {activeTab === 'register-user' && <RegisterUserTab />}
          {activeTab === 'create-company' && <CreateCompanyTab />}
          {activeTab === 'manage-access' && <ManageAccessTab />}
          {activeTab === 'analytics-config' && <AnalyticsConfigTab />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
