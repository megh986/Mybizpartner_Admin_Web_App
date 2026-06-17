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
        {/* Page Hero Header */}
        <header className="relative overflow-hidden bg-white border-b border-slate-100">
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute -top-10 -right-8 w-60 h-60 rounded-full bg-indigo-500/7 blur-3xl" />
            <div className="absolute top-4 right-48 w-40 h-40 rounded-full bg-violet-400/5 blur-2xl" />
          </div>
          <div className="relative flex items-center justify-between px-4 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden size-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div>
                <h1 className="text-primary-text text-2xl md:text-3xl font-bold tracking-tight font-heading">
                  Admin Panel
                </h1>
                <p className="text-secondary-text text-sm font-normal mt-0.5">
                  Manage users and companies. Register new users and create company accounts.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full mt-6">
          <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-4 max-w-fit shadow-xs">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === 'register-user'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => navigate('/admin/register-user')}
              >
                <span className="material-symbols-outlined !text-[16px]">person_add</span>
                Register User
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === 'create-company'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => navigate('/admin/create-company')}
              >
                <span className="material-symbols-outlined !text-[16px]">domain_add</span>
                Create Company
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === 'manage-access'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => navigate('/admin/manage-access')}
              >
                <span className="material-symbols-outlined !text-[16px]">shield_person</span>
                Manage Access
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === 'analytics-config'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                }`}
                onClick={() => navigate('/admin/analytics-config')}
              >
                <span className="material-symbols-outlined !text-[16px]">analytics</span>
                Analytics Config
              </button>
            </div>
          </div>
        </div>

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
