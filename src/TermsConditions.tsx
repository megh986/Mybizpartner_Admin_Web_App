import React, { useState } from 'react';
import './css/TermsConditions.css';
import Sidebar from './components/Sidebar';

interface TermsConditionsProps {
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

const TermsConditions: React.FC<TermsConditionsProps> = ({
    userData,
    onBack,
    onNavigateToReviews,
    onNavigateToAssets,
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
                {/* Header */}
                <header className="px-4 py-4 md:px-10 lg:px-12 pb-0 max-w-5xl mx-auto w-full">
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
                        <span className="text-primary-text">Terms & Conditions</span>
                    </div>

                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-primary-text font-heading tracking-tight mb-2">
                            Terms & Conditions
                        </h1>
                        <p className="text-secondary-text text-sm">
                            Last updated: 30th January, 2026
                        </p>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 px-6 md:px-10 lg:px-12 py-6 max-w-5xl mx-auto w-full pb-20">
                    <div className="terms-content">
                        <div className="terms-intro">
                            <p>
                                Welcome to Word of Mouth ("WordOfMouth", "we", "our", or "us"). These Terms & Conditions govern your access to and use of our website <a href="https://thewordofmouth.in" target="_blank" rel="noopener noreferrer">https://thewordofmouth.in</a> and our products, services, widgets, and integrations (collectively, the "Services").
                            </p>
                            <p>
                                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use our Services.
                            </p>
                        </div>

                        <section className="terms-section">
                            <h2>1. About Word of Mouth</h2>
                            <p>Word of Mouth provides a trust, reviews, and on-site experience enablement layer for ecommerce brands, including:</p>
                            <ul>
                                <li>Review and testimonial widgets</li>
                                <li>AI-assisted reviews and summaries</li>
                                <li>Media and social proof sections</li>
                                <li>UI elements and ecommerce platform integrations</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>2. Eligibility & Authority</h2>
                            <ul>
                                <li>You must be legally capable of entering into a binding contract to use our Services.</li>
                                <li>If you use the Services on behalf of a business, you represent that you have authority to bind that business.</li>
                                <li>You are responsible for maintaining accurate and current information.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>3. Scope of Services</h2>
                            <ul>
                                <li>Services are provided as described on our website, proposals, or applicable commercial agreements.</li>
                                <li>Any material expansion of scope requires separate written agreement.</li>
                                <li>We may update, modify, or discontinue features without prior notice.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>4. Integrations & Platform Dependencies</h2>
                            <ul>
                                <li>Services may rely on third-party platforms (including Shopify, Meta, Instagram, or analytics tools).</li>
                                <li>We are not responsible for outages, limitations, API changes, or policy changes imposed by third parties.</li>
                                <li>Any platform access granted is limited strictly to service delivery.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>5. Data Access, Privacy & Ownership</h2>
                            <ul>
                                <li>We follow privacy-first and data-minimization principles.</li>
                                <li>We do not access or store checkout data, payment information, or sensitive personal data.</li>
                                <li>Clients retain full ownership of all customer and business data.</li>
                                <li>Data handling is governed by our Privacy Policy, which forms part of these Terms.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>6. AI-Generated Content & Disclaimers</h2>
                            <ul>
                                <li>Content displayed through the Services (including reviews, summaries, or media) may be AI-assisted, human-curated, or blended.</li>
                                <li>Such content is intended for experience enhancement and trust signaling only.</li>
                                <li>Nothing in the Services constitutes legal, regulatory, compliance, or advertising advice.</li>
                                <li>We do not guarantee business, marketing, conversion, or revenue outcomes.</li>
                                <li>You remain solely responsible for compliance with applicable laws, consumer protection rules, and advertising standards.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>7. Acceptable Use</h2>
                            <p>You agree not to:</p>
                            <ul>
                                <li>Copy, modify, reverse engineer, scrape, or resell the Services</li>
                                <li>Use the Services to build or support a competing product</li>
                                <li>Misrepresent AI-generated content as verified endorsements where prohibited by law</li>
                                <li>Use the Services for unlawful, deceptive, or misleading purposes</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>8. Intellectual Property</h2>
                            <ul>
                                <li>All Word of Mouth technology, software, widgets, logic, and designs are our exclusive intellectual property.</li>
                                <li>You are granted a limited, non-exclusive, non-transferable right to use the Services during the term.</li>
                                <li>You retain ownership of your brand assets and grant us a limited license solely to deliver the Services.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>9. Performance, Availability & Rollback</h2>
                            <ul>
                                <li>No service levels, uptime guarantees, or SLAs are provided unless expressly agreed in writing.</li>
                                <li>If our widgets materially impact site performance or user experience, you may request investigation or temporary pause.</li>
                                <li>Upon service discontinuation, we will ensure:
                                    <ul>
                                        <li>Removal of injected scripts and widgets</li>
                                        <li>Rollback of UI changes</li>
                                        <li>No residual code or material performance impact</li>
                                    </ul>
                                </li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>10. Fees & Payments (If Applicable)</h2>
                            <ul>
                                <li>Fees, billing cycles, and payment terms are governed by applicable proposals or agreements.</li>
                                <li>Non-payment may result in suspension or termination of Services.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>11. Limitation of Liability</h2>
                            <p>To the maximum extent permitted by law:</p>
                            <ul>
                                <li>We are not liable for indirect, incidental, special, or consequential damages.</li>
                                <li>Our total aggregate liability shall not exceed the fees paid by you in the three (3) months preceding the claim.</li>
                                <li>Use of the Services is at your own risk.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>12. Indemnity</h2>
                            <p>You agree to indemnify and hold Word of Mouth harmless from claims arising out of:</p>
                            <ul>
                                <li>Your misuse of the Services</li>
                                <li>Your violation of applicable laws or regulations</li>
                                <li>Content, data, or materials provided by you</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>13. Termination</h2>
                            <ul>
                                <li>Either party may terminate access in accordance with applicable agreements.</li>
                                <li>Upon termination, your right to use the Services ceases immediately.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>14. Assignment</h2>
                            <p>We may assign or transfer these Terms as part of a merger, acquisition, restructuring, or asset transfer without restriction.</p>
                        </section>

                        <section className="terms-section">
                            <h2>15. Governing Law & Jurisdiction</h2>
                            <ul>
                                <li>These Terms are governed by the laws of India.</li>
                                <li>Courts at Delhi, including the Delhi High Court (as applicable), shall have exclusive jurisdiction.</li>
                            </ul>
                        </section>

                        <section className="terms-section">
                            <h2>16. Severability</h2>
                            <p>If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.</p>
                        </section>

                        <section className="terms-section">
                            <h2>17. Changes to Terms</h2>
                            <p>We may update these Terms from time to time. Continued use of the Services constitutes acceptance of the revised Terms.</p>
                        </section>

                        <section className="terms-section">
                            <h2>18. Contact</h2>
                            <p>For questions regarding these Terms:</p>
                            <div className="contact-info">
                                <p><strong>Word of Mouth</strong></p>
                                <p>Email: <a href="mailto:support@hyperint.tech">support@hyperint.tech</a></p>
                                <p>India</p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsConditions;
