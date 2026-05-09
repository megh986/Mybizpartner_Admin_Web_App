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
        {/* Header */}
        <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 text-sm text-secondary-text mb-4">
            <button
              className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button onClick={onBack} className="hover:text-primary transition-colors">Home</button>
            <span>/</span>
            <span className="text-primary-text">WhatsApp</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-text font-heading tracking-tight">
                WhatsApp
              </h1>
              <p className="text-secondary-text mt-2 max-w-2xl">
                Manage WhatsApp Business configurations for each company.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex gap-1 overflow-x-auto">
              {([
                { id: 'create-config', label: 'Create Config', icon: 'add_circle', path: '/whatsapp/create-config' },
                { id: 'view-config',   label: 'View Config',   icon: 'visibility',  path: '/whatsapp/view-config'   },
                { id: 'bulk-upload',   label: 'Bulk Upload',   icon: 'upload_file', path: '/whatsapp/bulk-upload'   },
              ] as { id: WhatsAppTab; label: string; icon: string; path: string }[]).map(tab => (
                <button
                  key={tab.id}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-500'
                      : 'border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300'
                  }`}
                  onClick={() => navigate(tab.path)}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[18px]">{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </header>

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
