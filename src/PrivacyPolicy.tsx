import React, { useState } from 'react';
import Sidebar from './components/Sidebar';

interface PrivacyPolicyProps {
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

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
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
                activePage="dashboard"
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
                {/* Header - Mobile Menu Button Only */}
                <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-5xl mx-auto w-full">
                    <div className="lg:hidden mb-4">
                        <button
                            className="size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 px-4 md:px-8 lg:px-10 py-4 max-w-5xl mx-auto w-full pb-20">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 lg:p-10">
                        <div className="
                            text-slate-600 dark:text-slate-400 leading-relaxed
                            [&_section]:mt-8 [&_section]:border-t [&_section]:border-slate-100 [&_section]:dark:border-slate-800 [&_section]:pt-6
                            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:dark:text-slate-100 [&_h2]:mb-4
                            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:dark:text-slate-200 [&_h3]:mt-5 [&_h3]:mb-2
                            [&_p]:mb-3
                            [&_ul]:list-disc [&_ul]:list-outside [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_ul]:mb-5
                            [&_li]:text-slate-600 [&_li]:dark:text-slate-400 [&_li>ul]:mt-1.5
                            [&_a]:text-indigo-600 [&_a]:font-medium [&_a]:hover:underline [&_a]:dark:text-indigo-400
                            [&_.privacy-intro]:text-[16px] [&_.privacy-intro]:text-slate-700 [&_.privacy-intro]:dark:text-slate-300 [&_.privacy-intro]:mb-6 [&_.privacy-intro]:leading-relaxed
                            [&_strong]:text-slate-800 [&_strong]:dark:text-slate-200 [&_strong]:font-semibold
                            [&_.contact-info]:mt-4 [&_.contact-info]:p-5 [&_.contact-info]:bg-slate-50 [&_.contact-info]:dark:bg-slate-800/50 [&_.contact-info]:rounded-xl [&_.contact-info>p]:mb-1 [&_.contact-info>p:last-child]:mb-0
                        ">
                            <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-heading tracking-tight mb-2">
                                    Privacy Policy
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Last updated: 30th January, 2026
                                </p>
                            </div>

                            <div className="privacy-intro">
                                <p>
                                    Word of Mouth ("WordOfMouth", "we", "our", or "us") operates the website <a href="https://thewordofmouth.in" target="_blank" rel="noopener noreferrer">https://thewordofmouth.in</a> and provides trust, review, and on-site experience enablement services for ecommerce brands.
                                </p>
                                <p>
                                    We are committed to protecting your privacy and handling data responsibly. This Privacy Policy explains what information we collect, how we use it, and your rights in relation to that information.
                                </p>
                            </div>

                            <section>
                                <h2>1. Information We Collect</h2>
                                <p>We may collect the following categories of information:</p>

                                <h3>a) Information You Provide Voluntarily</h3>
                                <ul>
                                    <li>Name, email address, phone number</li>
                                    <li>Company / brand name</li>
                                    <li>Any information submitted via contact forms, demo requests, or onboarding communications</li>
                                </ul>

                                <h3>b) Website Usage Data</h3>
                                <ul>
                                    <li>IP address, browser type, device information</li>
                                    <li>Pages visited, time spent, and referral sources</li>
                                    <li>(Collected via standard analytics tools)</li>
                                </ul>

                                <h3>c) Client Platform Access (For Customers Only)</h3>
                                <p>When a client integrates Word of Mouth with their ecommerce platform (e.g. Shopify), we may receive limited technical access strictly required to deliver our services, such as:</p>
                                <ul>
                                    <li>Product metadata</li>
                                    <li>Publicly visible reviews or content</li>
                                    <li>Widget configuration data</li>
                                </ul>
                                <p><strong>We do not access or store:</strong></p>
                                <ul>
                                    <li>Payment or checkout data</li>
                                    <li>Customer passwords</li>
                                    <li>Sensitive personal information</li>
                                </ul>
                            </section>

                            <section>
                                <h2>2. How We Use Information</h2>
                                <p>We use collected information to:</p>
                                <ul>
                                    <li>Provide, operate, and improve our services</li>
                                    <li>Communicate with you regarding demos, onboarding, and support</li>
                                    <li>Monitor performance, security, and reliability</li>
                                    <li>Comply with legal and regulatory obligations</li>
                                </ul>
                                <p>We follow privacy-first and data-minimization principles at all times.</p>
                            </section>

                            <section>
                                <h2>3. AI-Generated & Displayed Content</h2>
                                <p>
                                    Some content displayed through Word of Mouth (such as reviews, summaries, or media widgets) may be AI-assisted, human-curated, or a blend of both, and is intended for experience enhancement and trust signaling.
                                </p>
                                <p>
                                    Clients remain responsible for ensuring compliance with applicable consumer protection, advertising, and regulatory requirements.
                                </p>
                            </section>

                            <section>
                                <h2>4. Data Sharing & Third Parties</h2>
                                <ul>
                                    <li>We do not sell, rent, or trade personal data.</li>
                                    <li>We may use trusted third-party services (such as hosting providers, analytics tools, or ecommerce platforms) solely to operate our services. These providers are bound by confidentiality and data protection obligations.</li>
                                </ul>
                            </section>

                            <section>
                                <h2>5. Data Security</h2>
                                <ul>
                                    <li>We maintain reasonable technical and organizational safeguards to protect information against unauthorized access, loss, or misuse.</li>
                                    <li>In the event of a confirmed security incident affecting client data, we will notify affected parties without undue delay.</li>
                                </ul>
                            </section>

                            <section>
                                <h2>6. Data Ownership</h2>
                                <ul>
                                    <li>Clients retain full ownership of their customer and business data.</li>
                                    <li>Word of Mouth does not claim ownership over any client-provided data or brand assets.</li>
                                </ul>
                            </section>

                            <section>
                                <h2>7. Cookies</h2>
                                <p>
                                    We may use cookies or similar technologies to improve website functionality and understand usage patterns. You may control cookies through your browser settings.
                                </p>
                            </section>

                            <section>
                                <h2>8. Your Rights</h2>
                                <p>Depending on applicable law, you may have the right to:</p>
                                <ul>
                                    <li>Access or update your information</li>
                                    <li>Request deletion of your personal data</li>
                                    <li>Withdraw consent for communications</li>
                                </ul>
                                <p>Requests can be made by contacting us at the email below.</p>
                            </section>

                            <section>
                                <h2>9. Changes to This Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised "Last updated" date.
                                </p>
                            </section>

                            <section>
                                <h2>10. Contact Us</h2>
                                <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
                                <div className="contact-info">
                                    <p><strong>Word of Mouth</strong></p>
                                    <p>Email: <a href="mailto:support@hyperint.tech">support@hyperint.tech</a></p>
                                    <p>India</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
