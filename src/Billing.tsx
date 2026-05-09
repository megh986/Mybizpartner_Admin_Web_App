import React, { useState } from 'react';
import './css/Billing.css';
import Sidebar from './components/Sidebar';

interface BillingProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
  } | null;
  onBack: () => void;
  onNavigateToReviews: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToProfile?: () => void;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Archived';
  downloadUrl: string;
}

const Billing: React.FC<BillingProps> = ({ userData, onBack, onNavigateToReviews, onNavigateToAssets, onNavigateToAdmin, onNavigateToPayment, onNavigateToProfile }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const itemsPerPage = 5;

  // Mock invoice data
  const invoices: Invoice[] = [
    { id: 'INV-2026-001', date: 'Jan 1, 2026', amount: '$99.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2025-012', date: 'Dec 1, 2025', amount: '$99.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2025-011', date: 'Nov 1, 2025', amount: '$99.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2025-010', date: 'Oct 1, 2025', amount: '$99.00', status: 'Paid', downloadUrl: '#' },
    { id: 'INV-2025-009', date: 'Sep 1, 2025', amount: '$99.00', status: 'Archived', downloadUrl: '#' },
    { id: 'INV-2025-008', date: 'Aug 1, 2025', amount: '$99.00', status: 'Archived', downloadUrl: '#' },
    { id: 'INV-2025-007', date: 'Jul 1, 2025', amount: '$99.00', status: 'Archived', downloadUrl: '#' },
  ];

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = invoices.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen w-full">
      <Sidebar
        userData={userData}
        activePage="billing"
        onNavigateToDashboard={onBack}
        onNavigateToReviews={onNavigateToReviews}
        // onNavigateToAnalytics={() => { }}
        onNavigateToAssets={onNavigateToAssets}
        // onNavigateToBilling={() => { }}
        onNavigateToAdmin={onNavigateToAdmin}
        onNavigateToPayment={onNavigateToPayment}
        onNavigateToProfile={onNavigateToProfile}
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
            <h2 className="text-lg font-bold font-heading tracking-tight">Billing & Subscription</h2>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-500 hover:text-primary transition-colors border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="h-10 px-4 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-700 dark:text-gray-200 font-bold text-sm gap-2 hover:bg-gray-50 transition-colors border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span>Help &amp; Support</span>
            </button>
          </div>
        </header>

        {/* Scrollable Billing Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
            {/* Current Plan Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Plan Card */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-primary dark:text-white font-heading mb-2">
                      Professional Plan
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Billed monthly
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-primary dark:text-white">$99</span>
                    <span className="text-slate-500 dark:text-slate-400 text-lg">/month</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Next billing date: February 1, 2026
                  </p>
                </div>

                {/* Usage Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-primary dark:text-white">Reviews Processed</span>
                    <span className="text-sm font-bold text-primary dark:text-white">4,500 / 5,000</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: '90%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    500 reviews remaining this month
                  </p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">upgrade</span>
                    <span>Upgrade Plan</span>
                  </button>
                  <button className="py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">settings</span>
                    <span>Manage</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-2xl font-bold text-primary dark:text-white font-heading">
                    Payment Method
                  </h3>
                  <button className="text-sm font-bold text-primary dark:text-white hover:underline">
                    Update
                  </button>
                </div>

                {/* Card Display */}
                <div className="bg-gradient-to-br from-primary to-blue-900 p-6 rounded-2xl mb-6 text-white">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-sm font-medium opacity-80">Credit Card</span>
                    <span className="material-symbols-outlined text-2xl">credit_card</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-lg font-mono tracking-wider mb-1">•••• •••• •••• 4242</p>
                    <p className="text-xs opacity-80">Expires 12/2027</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">{userData?.name || 'User'}</p>
                    <div className="flex items-center gap-1">
                      <div className="size-6 rounded-full bg-red-500 opacity-80"></div>
                      <div className="size-6 rounded-full bg-orange-500 opacity-80 -ml-2"></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">add_card</span>
                    <span>Add Payment Method</span>
                  </button>
                  <button className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary dark:text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">support_agent</span>
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Invoice History Section */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-2xl font-bold text-primary dark:text-white font-heading">
                  Invoice History
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  View and download your billing history
                </p>
              </div>

              {/* Invoice Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {currentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-primary dark:text-white">
                            {invoice.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {invoice.date}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-primary dark:text-white">
                            {invoice.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${invoice.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="inline-flex items-center gap-1 text-sm font-bold text-primary dark:text-white hover:underline">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, invoices.length)} of {invoices.length} invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="size-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`size-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === page
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="size-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
