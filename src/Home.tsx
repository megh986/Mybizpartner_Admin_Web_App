import React, { useState } from 'react';
import './css/Home.css';
import Sidebar from './components/Sidebar';

interface HomeProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
  } | null;
  onNavigateToDashboard: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAssetsContent?: () => void;
  onNavigateToAssetsInstagram?: () => void;
  onNavigateToBilling: () => void;
  onNavigateToReviews: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToPayment: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHelp?: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToWhatsApp?: () => void;
}

const Home: React.FC<HomeProps> = ({ userData, onNavigateToDashboard, onNavigateToAssets, onNavigateToAssetsContent, onNavigateToAssetsInstagram, onNavigateToBilling, onNavigateToReviews, onNavigateToAnalytics, onNavigateToAdmin, onNavigateToPayment, onNavigateToProfile, onNavigateToHelp, onNavigateToTerms, onNavigateToPrivacy, onNavigateToWhatsApp }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="dashboard"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToReviews={onNavigateToReviews}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToAssets={onNavigateToAssets}
        // onNavigateToBilling={onNavigateToBilling}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToWhatsApp={onNavigateToWhatsApp}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToHelp={onNavigateToHelp}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 bg-background-light dark:bg-background-dark">
        {/* Top Navigation Bar */}
        <header className="h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-between shrink-0 bg-background-light dark:bg-background-dark z-10">
          {/* Breadcrumbs/Title */}
          <div className="flex items-center gap-2 text-primary dark:text-white">
            <button
              className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="material-symbols-outlined text-gray-400 hidden lg:inline">home</span>
            <span className="text-gray-400 hidden lg:inline">/</span>
            <h2 className="text-lg font-bold font-heading tracking-tight">Dashboard</h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-500 hover:text-primary transition-colors border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button> */}
            <button onClick={onNavigateToHelp} className="h-10 px-4 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-700 dark:text-gray-200 font-bold text-sm gap-2 hover:bg-gray-50 transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="hidden sm:inline">Help &amp; Support</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20">
            {/* Welcome Header & Progress */}
            <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
              <div className="flex flex-col gap-3 max-w-2xl">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-primary dark:text-white font-heading tracking-tight">
                  Let's get your brand setup
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg leading-relaxed">
                  Complete these 3 steps to start automating your trust infrastructure and collecting reviews.
                </p>
              </div>

            </div>

            {/* Setup Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Connect Social */}
              <div className="group bg-white dark:bg-surface-dark p-5 lg:p-8 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(8,19,38,0.03)] hover:shadow-[0_10px_30px_rgba(8,19,38,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[280px] lg:h-[320px]">
                <div className="flex flex-col gap-4 lg:gap-6">
                  <div className="size-12 lg:size-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-orange-200 dark:shadow-none">
                    <span className="material-symbols-outlined text-2xl lg:text-3xl">add_photo_alternate</span>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-primary dark:text-white font-heading mb-2 lg:mb-3">
                      Connect Social
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                      Link your Instagram account to automatically pull tagged posts and stories into your dashboard.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onNavigateToAssetsInstagram}
                  className="mt-auto w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                >
                  <span>Connect Account</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Card 2: Upload Content */}
              <div className="group bg-white dark:bg-surface-dark p-5 lg:p-8 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(8,19,38,0.03)] hover:shadow-[0_10px_30px_rgba(8,19,38,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[280px] lg:h-[320px]">
                <div className="flex flex-col gap-4 lg:gap-6">
                  <div className="size-12 lg:size-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                    <span className="material-symbols-outlined text-2xl lg:text-3xl">upload_file</span>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-primary dark:text-white font-heading mb-2 lg:mb-3">
                      Upload Content
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                      Manually add your first piece of User Generated Content (UGC) to start your library.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onNavigateToAssetsContent}
                  className="mt-auto w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                >
                  <span>Upload Media</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* Card 3: Map Products */}
              <div className="group bg-white dark:bg-surface-dark p-5 lg:p-8 rounded-[16px] border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(8,19,38,0.03)] hover:shadow-[0_10px_30px_rgba(8,19,38,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[280px] lg:h-[320px]">
                <div className="flex flex-col gap-4 lg:gap-6">
                  <div className="size-12 lg:size-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                    <span className="material-symbols-outlined text-2xl lg:text-3xl">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-primary dark:text-white font-heading mb-2 lg:mb-3">
                      Map Products
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                      Sync your Shopify catalog to tag specific products in your reviews and showcase them.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onNavigateToAssets}
                  className="mt-auto w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                >
                  <span>Sync Catalog</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Placeholder for Future Data (Ghost State) */}
            {/* <div
              aria-hidden="true"
              className="mt-8 border-t border-dashed border-gray-300 dark:border-gray-700 pt-8 opacity-50 select-none grayscale pointer-events-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary dark:text-white font-heading">Recent Activity</h3>
                <div className="text-sm font-medium text-gray-400">View All</div>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-xl p-6 h-48 flex items-center justify-center border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center gap-2 text-gray-300">
                  <span className="material-symbols-outlined text-4xl">bar_chart</span>
                  <span className="text-sm font-medium">Activity will appear here after setup</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
