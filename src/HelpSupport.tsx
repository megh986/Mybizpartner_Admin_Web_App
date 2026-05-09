import React, { useState } from 'react';
import './css/HelpSupport.css';
import Sidebar from './components/Sidebar';

interface HelpSupportProps {
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
    onNavigateToBilling: () => void;
    onNavigateToAdmin: () => void;
    onNavigateToPayment?: () => void;
    onNavigateToProfile?: () => void;
}

const HelpSupport: React.FC<HelpSupportProps> = ({
    userData,
    onBack,
    onNavigateToReviews,
    onNavigateToAssets,
    onNavigateToBilling,
    onNavigateToAdmin,
    onNavigateToPayment,
    onNavigateToProfile,
}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full">
            <Sidebar
                userData={userData}
                activePage="help"
                onNavigateToDashboard={onBack}
                onNavigateToReviews={onNavigateToReviews}
                // onNavigateToAnalytics={() => { }}
                onNavigateToAssets={onNavigateToAssets}
                // onNavigateToBilling={onNavigateToBilling}
                onNavigateToAdmin={onNavigateToAdmin}
                onNavigateToPayment={onNavigateToPayment}
                onNavigateToProfile={onNavigateToProfile}
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
                            className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <button onClick={onBack} className="hover:text-primary transition-colors">
                            Home
                        </button>
                        <span>/</span>
                        <span className="text-primary-text">Help & Support</span>
                    </div>

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-primary-text font-heading tracking-tight">
                            Help & Support
                        </h1>
                        <p className="text-secondary-text mt-2">
                            Get in touch with our support team
                        </p>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-7xl mx-auto w-full pb-20">
                    <div className="help-support-card">
                        <div className="help-content">
                            <div className="help-icon-wrapper">
                                <span className="material-symbols-outlined help-icon">mail</span>
                            </div>

                            <h2 className="help-title">Contact Support</h2>

                            <a href="mailto:support@thewordofmouth.in" className="email-link">
                                support@thewordofmouth.in
                            </a>

                            <p className="help-response-time">We typically respond within 24 hours</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HelpSupport;
