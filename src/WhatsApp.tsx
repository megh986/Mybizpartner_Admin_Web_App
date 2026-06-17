import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CompanyConfigTab from './whatsapp/CompanyConfigTab';
import ViewConfigTab from './whatsapp/ViewConfigTab';
import BulkUploadTab from './whatsapp/BulkUploadTab';

interface WhatsAppProps {
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
  onNavigateToReviews: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToPayment: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToAdmin?: () => void;
}

type WhatsAppTab = 'create-config' | 'view-config' | 'bulk-upload';

const WhatsApp: React.FC<WhatsAppProps> = ({
  userData, onBack, onNavigateToAssets, onNavigateToReviews,
  onNavigateToAnalytics, onNavigateToPayment, onNavigateToProfile, onNavigateToAdmin,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const activeTab: WhatsAppTab =
    location.pathname === '/whatsapp/bulk-upload' ? 'bulk-upload'
    : location.pathname === '/whatsapp/view-config' ? 'view-config'
    : 'create-config';

  // Admin only
  if (userData?.role !== 'admin') {
    onBack();
    return null;
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="whatsapp"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={onNavigateToAssets}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToWhatsApp={() => navigate('/whatsapp/company-config')}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative w-full min-w-0 bg-background-light dark:bg-background-dark">
        {/* Page Header & Tabs */}
        <div className="px-4 md:px-10 lg:px-12 max-w-7xl mx-auto w-full mt-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-3.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="lg:hidden size-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#FF6B35] hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors shrink-0 cursor-pointer"
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm hidden lg:block">
                  <span className="material-symbols-outlined !text-[18px]">chat</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">WhatsApp Integration</h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Manage WhatsApp Business configurations for each company.
                  </p>
                </div>
              </div>
              
              {/* Setup Guide in top right */}
              <a
                href="https://www.notion.so/Meta-app-for-whatapp-get-steps-316902d09c9480b6bcd0c458edd3d375"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg px-3 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors group cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined !text-[16px] text-indigo-600 dark:text-indigo-400 shrink-0">menu_book</span>
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Setup Guide</span>
                <span className="material-symbols-outlined !text-[14px] text-indigo-400 dark:text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">open_in_new</span>
              </a>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {([
                { id: 'create-config', label: 'Create Config', icon: 'add_circle', path: '/whatsapp/create-config' },
                { id: 'view-config',   label: 'View Config',   icon: 'visibility',  path: '/whatsapp/view-config'   },
                { id: 'bulk-upload',   label: 'Bulk Upload',   icon: 'upload_file', path: '/whatsapp/bulk-upload'   },
              ] as { id: WhatsAppTab; label: string; icon: string; path: string }[]).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => navigate(tab.path)}
                  >
                    <span className="material-symbols-outlined !text-[14px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-20">
          {activeTab === 'create-config' && <CompanyConfigTab />}
          {activeTab === 'view-config'   && <ViewConfigTab />}
          {activeTab === 'bulk-upload'   && <BulkUploadTab />}
        </div>
      </main>
    </div>
  );
};

export default WhatsApp;
