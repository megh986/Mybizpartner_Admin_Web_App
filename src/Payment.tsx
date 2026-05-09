import React, { useState, useEffect, useCallback } from 'react';
import './css/Payment.css';
import Sidebar from './components/Sidebar';

// Declare Razorpay type
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Company {
    _id: string;
    name: string;
    company_id: string;
}

interface PaymentPlan {
    id: string;
    company_id: string;
    company_name: string;
    first_payment_amount: number;
    recurring_amount: number;
    billing_cycle_day: number;
    status: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface PendingPayment {
    id: string;
    type: string;
    amount: number;
    due_date: string | null;
    razorpay_order_id: string;
    razorpay_invoice_id?: string;
    payment_link?: string;
    description: string;
    created_at: string;
}

interface PaymentHistory {
    id: string;
    amount: number;
    type: string;
    razorpay_payment_id: string;
    method: string | null;
    status: string;
    paid_at: string | null;
    invoice: {
        id: string;
        invoice_number: string;
        invoice_url: string | null;
        invoice_pdf_url: string | null;
    } | null;
}

interface Invoice {
    id: string;
    invoice_number: string;
    amount: number;
    tax_amount: number;
    total_amount: number;
    invoice_url: string | null;
    invoice_pdf_url: string | null;
    status: string;
    issued_at: string | null;
}

interface MandateInfo {
    id: string;
    status: string;
    recurring_amount: number;
    next_charge_date: string | null;
    start_date: string | null;
    short_url?: string;
    razorpay_subscription_id?: string;
}

interface PaymentProps {
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
    onNavigateToAnalytics?: () => void;
    onNavigateToAdmin: () => void;
    onNavigateToBilling?: () => void;
    onNavigateToProfile?: () => void;
    onNavigateToHelp?: () => void;
    onNavigateToWhatsApp?: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const PAYMENT_API_BASE_URL = `${API_BASE_URL}/payment`;
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;

const Payment: React.FC<PaymentProps> = ({ userData, onBack, onNavigateToReviews, onNavigateToAssets, onNavigateToAnalytics, onNavigateToAdmin, onNavigateToBilling, onNavigateToProfile, onNavigateToHelp, onNavigateToWhatsApp }) => {
    // Mobile sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // View state
    const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
    const [adminSubTab, setAdminSubTab] = useState<'plans' | 'create' | 'payments'>('plans');
    const [userSubTab, setUserSubTab] = useState<'pending' | 'history' | 'invoices' | 'mandate'>('pending');

    // Loading and error states
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // Companies state (will be fetched from API)
    const [companies, setCompanies] = useState<Company[]>([]);

    // Admin states
    const [plans, setPlans] = useState<PaymentPlan[]>([]);
    const [allPayments, setAllPayments] = useState<PaymentHistory[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [firstPaymentAmount, setFirstPaymentAmount] = useState<string>('');
    const [recurringAmount, setRecurringAmount] = useState<string>('');
    const [billingCycleDay, setBillingCycleDay] = useState<string>('1');
    const [planDescription, setPlanDescription] = useState<string>('');

    // User states
    const [userCompanyId, setUserCompanyId] = useState<string>('');
    const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
    const [pendingMandate, setPendingMandate] = useState<any>(null);
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [mandateStatus, setMandateStatus] = useState<MandateInfo | null>(null);

    // Summary stats (admin)
    const [summary, setSummary] = useState<{
        total_plans: number;
        active_mandates: number;
        pending_payments: number;
        total_revenue: number;
        this_month_revenue: number;
    } | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const itemsPerPage = 10;

    // Cancel mandate confirmation dialog
    const [cancelMandateDialogOpen, setCancelMandateDialogOpen] = useState<boolean>(false);
    const [cancelMandateCompanyId, setCancelMandateCompanyId] = useState<string | null>(null);

    // Admin company search state
    const [adminCompanySearch, setAdminCompanySearch] = useState('');
    const [isAdminCompanyDropdownOpen, setIsAdminCompanyDropdownOpen] = useState(false);

    // User company search state
    const [userCompanySearch, setUserCompanySearch] = useState('');
    const [isUserCompanyDropdownOpen, setIsUserCompanyDropdownOpen] = useState(false);

    // Fetch companies
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const sessionToken = localStorage.getItem('session_token');
                const response = await fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setCompanies(data.companies);
                }
            } catch (err) {
                console.error('Error fetching companies:', err);
            }
        };
        fetchCompanies();
    }, []);

    // Set default tab based on role
    useEffect(() => {
        if (userData?.role === 'admin') {
            setActiveTab('admin');
        } else {
            setActiveTab('user');
        }
    }, [userData]);

    // Set default company for user
    useEffect(() => {
        if (userData?.role === 'user' && userData.company_ids && userData.company_ids.length > 0) {
            const userCompany = companies.find(c => userData.company_ids?.includes(c.company_id));
            if (userCompany) {
                setUserCompanyId(userCompany.company_id);
            }
        }
    }, [userData, companies]);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Fetch admin summary
    const fetchSummary = useCallback(async () => {
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/summary`);
            const data = await response.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
        }
    }, []);

    // Fetch all plans (admin)
    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/plans?page=${currentPage}&limit=${itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                setPlans(data.plans);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            }
        } catch (err) {
            setError('Error fetching payment plans');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Fetch all payments (admin)
    const fetchAllPayments = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/all-payments?page=${currentPage}&limit=${itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                setAllPayments(data.payments);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            }
        } catch (err) {
            setError('Error fetching payments');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Fetch user's pending payments
    const fetchPendingPayments = useCallback(async () => {
        if (!userCompanyId) return;
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/my-pending-payments/${userCompanyId}`);
            const data = await response.json();
            if (data.success) {
                setPendingPayments(data.pending_payments || []);
                setPendingMandate(data.pending_mandate);
            }
        } catch (err) {
            setError('Error fetching pending payments');
        } finally {
            setLoading(false);
        }
    }, [userCompanyId]);

    // Fetch user's payment history
    const fetchPaymentHistory = useCallback(async () => {
        if (!userCompanyId) return;
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/my-payments/${userCompanyId}?page=${currentPage}&limit=${itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                setPaymentHistory(data.payments);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            }
        } catch (err) {
            setError('Error fetching payment history');
        } finally {
            setLoading(false);
        }
    }, [userCompanyId, currentPage]);

    // Fetch user's invoices
    const fetchInvoices = useCallback(async () => {
        if (!userCompanyId) return;
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/my-invoices/${userCompanyId}?page=${currentPage}&limit=${itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                setInvoices(data.invoices);
                setTotalPages(Math.ceil(data.total / itemsPerPage));
            }
        } catch (err) {
            setError('Error fetching invoices');
        } finally {
            setLoading(false);
        }
    }, [userCompanyId, currentPage]);

    // Fetch mandate status
    const fetchMandateStatus = useCallback(async () => {
        if (!userCompanyId) return;
        setLoading(true);
        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/mandate-status/${userCompanyId}`);
            const data = await response.json();
            if (data.success && data.has_mandate) {
                setMandateStatus(data.mandate);
            } else {
                setMandateStatus(null);
            }
        } catch (err) {
            setError('Error fetching mandate status');
        } finally {
            setLoading(false);
        }
    }, [userCompanyId]);

    // Load data based on active tab
    useEffect(() => {
        setError('');
        setSuccess('');
        setCurrentPage(1);

        if (activeTab === 'admin' && userData?.role === 'admin') {
            fetchSummary();
            if (adminSubTab === 'plans') {
                fetchPlans();
            } else if (adminSubTab === 'payments') {
                fetchAllPayments();
            }
        } else if (activeTab === 'user' && userCompanyId) {
            if (userSubTab === 'pending') {
                fetchPendingPayments();
            } else if (userSubTab === 'history') {
                fetchPaymentHistory();
            } else if (userSubTab === 'invoices') {
                fetchInvoices();
            } else if (userSubTab === 'mandate') {
                fetchMandateStatus();
            }
        }
    }, [activeTab, adminSubTab, userSubTab, userCompanyId, userData, fetchSummary, fetchPlans, fetchAllPayments, fetchPendingPayments, fetchPaymentHistory, fetchInvoices, fetchMandateStatus]);

    // Create payment plan (admin)
    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompanyId || !firstPaymentAmount || !recurringAmount) {
            setError('Please fill all required fields');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/create-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_id: selectedCompanyId,
                    first_payment_amount: parseFloat(firstPaymentAmount),
                    recurring_amount: parseFloat(recurringAmount),
                    billing_cycle_day: parseInt(billingCycleDay),
                    description: planDescription || null
                })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                setSelectedCompanyId('');
                setFirstPaymentAmount('');
                setRecurringAmount('');
                setBillingCycleDay('1');
                setPlanDescription('');
                fetchPlans();
                fetchSummary();
            } else {
                setError(data.message || 'Failed to create plan');
            }
        } catch (err) {
            setError('Error creating payment plan');
        } finally {
            setLoading(false);
        }
    };

    // Create first payment request (admin)
    const handleCreateFirstPaymentRequest = async (companyId: string) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/create-first-payment-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_id: companyId })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                fetchPlans();
            } else {
                setError(data.message || 'Failed to create payment request');
            }
        } catch (err) {
            setError('Error creating payment request');
        } finally {
            setLoading(false);
        }
    };

    // Setup mandate (admin)
    const handleSetupMandate = async (companyId: string) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/setup-mandate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_id: companyId })
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                fetchPlans();
            } else {
                setError(data.message || 'Failed to setup mandate');
            }
        } catch (err) {
            setError('Error setting up mandate');
        } finally {
            setLoading(false);
        }
    };

    // Regenerate mandate (admin) - for expired hosted pages
    const handleRegenerateMandate = async (companyId: string) => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/regenerate-mandate/${companyId}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                fetchPlans();
            } else {
                setError(data.message || 'Failed to regenerate mandate');
            }
        } catch (err) {
            setError('Error regenerating mandate');
        } finally {
            setLoading(false);
        }
    };

    // Pause/Resume mandate (admin)
    const handleToggleMandate = async (companyId: string, action: 'pause' | 'resume' | 'cancel') => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${PAYMENT_API_BASE_URL}/admin/${action}-mandate/${companyId}`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                setSuccess(data.message);
                fetchPlans();
            } else {
                setError(data.message || `Failed to ${action} mandate`);
            }
        } catch (err) {
            setError(`Error ${action}ing mandate`);
        } finally {
            setLoading(false);
        }
    };

    // Handle invoice view/download — fetches PDF and opens in new tab
    const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/download-invoice/${invoiceId}`);
            if (!response.ok) {
                setError('Failed to generate invoice PDF');
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            setError('Error opening invoice');
            console.error('Download error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle mandate authentication using Razorpay Checkout SDK
    const handleAuthenticateMandate = async () => {
        if (!userCompanyId) return;

        setLoading(true);
        setError('');

        try {
            // Get subscription checkout details from backend
            const response = await fetch(`${PAYMENT_API_BASE_URL}/user/subscription-checkout/${userCompanyId}`);
            const data = await response.json();

            if (!data.success) {
                if (data.already_authenticated) {
                    setSuccess('Mandate already authenticated! Refreshing status...');
                    fetchMandateStatus();
                    fetchPendingPayments();
                } else {
                    setError(data.message || 'Failed to get checkout details');
                }
                return;
            }

            const checkout = data.checkout;

            // Use Razorpay Checkout SDK for subscription authentication
            const options = {
                key: checkout.key_id,
                subscription_id: checkout.subscription_id,
                name: checkout.name,
                description: checkout.description,
                prefill: checkout.prefill,
                notes: checkout.notes,
                theme: checkout.theme,
                handler: async function (response: any) {
                    // Verify subscription after authentication
                    try {
                        const verifyResponse = await fetch(`${PAYMENT_API_BASE_URL}/user/verify-subscription`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            setSuccess('Mandate authenticated successfully! Auto-payments will start from next billing cycle.');
                            fetchMandateStatus();
                            fetchPendingPayments();
                        } else {
                            setError(verifyData.message || 'Mandate verification failed');
                        }
                    } catch (err) {
                        setError('Error verifying mandate');
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log('Mandate authentication cancelled');
                        setLoading(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                setError(`Payment failed: ${response.error.description}`);
            });
            razorpay.open();

        } catch (err) {
            setError('Error initiating mandate authentication');
        } finally {
            setLoading(false);
        }
    };

    // Handle payment - redirect to Razorpay invoice payment link
    const handlePayNow = async (payment: PendingPayment) => {
        try {
            // For invoice-based payments, redirect to the payment link
            if (payment.payment_link) {
                // Open payment link in new tab
                window.open(payment.payment_link, '_blank');
                setSuccess('Payment page opened in new tab. Complete the payment there.');
                return;
            }

            // Fallback for legacy order-based payments (if any exist)
            if (payment.razorpay_order_id) {
                // Get checkout details
                const response = await fetch(`${PAYMENT_API_BASE_URL}/user/checkout-details/${payment.razorpay_order_id}`);
                const data = await response.json();

                if (!data.success) {
                    setError(data.message || 'Failed to get checkout details');
                    return;
                }

                const checkout = data.checkout;

                const options = {
                    key: checkout.key_id,
                    amount: checkout.amount,
                    currency: checkout.currency,
                    name: checkout.name,
                    description: checkout.description,
                    order_id: checkout.order_id,
                    prefill: checkout.prefill,
                    notes: checkout.notes,
                    theme: checkout.theme,
                    handler: async function (response: any) {
                        // Verify payment
                        try {
                            const verifyResponse = await fetch(`${PAYMENT_API_BASE_URL}/user/verify-payment`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });

                            const verifyData = await verifyResponse.json();
                            if (verifyData.success) {
                                setSuccess('Payment successful!');
                                fetchPendingPayments();
                                fetchPaymentHistory();
                            } else {
                                setError(verifyData.message || 'Payment verification failed');
                            }
                        } catch (err) {
                            setError('Error verifying payment');
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            console.log('Payment cancelled');
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } else {
                setError('No payment link available. Please contact support.');
            }
        } catch (err) {
            setError('Error initiating payment');
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending_first_payment':
            case 'pending':
                return 'status-badge pending';
            case 'first_payment_done':
            case 'paid':
            case 'captured':
                return 'status-badge success';
            case 'mandate_active':
            case 'active':
            case 'authenticated':
                return 'status-badge active';
            case 'paused':
            case 'halted':
                return 'status-badge warning';
            case 'cancelled':
            case 'failed':
            case 'expired':
                return 'status-badge danger';
            default:
                return 'status-badge';
        }
    };

    // Get status display text
    const getStatusText = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Filter companies for user (only their companies)
    const userCompanies = userData?.role === 'admin'
        ? companies // Admin sees all companies
        : userData?.company_ids && userData.company_ids.length > 0
            ? companies.filter(c => userData.company_ids?.includes(c.company_id))
            : []; // Regular users with no companies see empty list

    return (
        <div className="flex h-screen w-full">
            <Sidebar
                userData={userData}
                activePage="payment"
                onNavigateToDashboard={onBack}
                onNavigateToReviews={onNavigateToReviews}
                onNavigateToAnalytics={onNavigateToAnalytics}
                onNavigateToAssets={onNavigateToAssets}
                // onNavigateToBilling={onNavigateToBilling || (() => { })}
                onNavigateToAdmin={onNavigateToAdmin}
                onNavigateToProfile={onNavigateToProfile}
                onNavigateToPayment={() => { }}
                onNavigateToWhatsApp={onNavigateToWhatsApp}
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light dark:bg-background-dark">
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
                        <h2 className="text-lg font-bold font-heading tracking-tight">Payment Management</h2>
                    </div>

                    {/* Right Actions */}
                    {/* <div className="flex items-center gap-3">
                        <button className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-500 hover:text-primary transition-colors border border-gray-100 dark:border-gray-700">
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                        </button>
                        <button className="h-10 px-4 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark shadow-sm text-gray-700 dark:text-gray-200 font-bold text-sm gap-2 hover:bg-gray-50 transition-colors border border-gray-100 dark:border-gray-700">
                            <span className="material-symbols-outlined text-[20px]">help</span>
                            <span>Help &amp; Support</span>
                        </button>
                    </div> */}
                </header>

                {/* Scrollable Payment Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Tab Headers - Show both for admin */}
                        {userData?.role === 'admin' && (
                            <div className="payment-main-tabs">
                                <button
                                    className={activeTab === 'admin' ? 'main-tab active' : 'main-tab'}
                                    onClick={() => setActiveTab('admin')}
                                >
                                    Admin View
                                </button>
                                <button
                                    className={activeTab === 'user' ? 'main-tab active' : 'main-tab'}
                                    onClick={() => setActiveTab('user')}
                                >
                                    User View
                                </button>
                            </div>
                        )}

                        {/* Success/Error Messages */}
                        {success && <div className="payment-success-message">{success}</div>}
                        {error && <div className="payment-error-message">{error}</div>}

                        {/* ADMIN VIEW */}
                        {activeTab === 'admin' && userData?.role === 'admin' && (
                            <div className="payment-admin-section">
                                {/* Summary Cards */}
                                {summary && (
                                    <div className="payment-summary-cards">
                                        <div className="summary-card">
                                            <div className="summary-value">{summary.total_plans}</div>
                                            <div className="summary-label">Total Plans</div>
                                        </div>
                                        <div className="summary-card">
                                            <div className="summary-value">{summary.active_mandates}</div>
                                            <div className="summary-label">Active Mandates</div>
                                        </div>
                                        <div className="summary-card">
                                            <div className="summary-value">{summary.pending_payments}</div>
                                            <div className="summary-label">Pending Payments</div>
                                        </div>
                                        <div className="summary-card">
                                            <div className="summary-value">{formatCurrency(summary.total_revenue)}</div>
                                            <div className="summary-label">Total Revenue</div>
                                        </div>
                                        <div className="summary-card highlight">
                                            <div className="summary-value">{formatCurrency(summary.this_month_revenue)}</div>
                                            <div className="summary-label">This Month</div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Sub Tabs */}
                                <div className="payment-sub-tabs">
                                    <button
                                        className={adminSubTab === 'plans' ? 'sub-tab active' : 'sub-tab'}
                                        onClick={() => setAdminSubTab('plans')}
                                    >
                                        Payment Plans
                                    </button>
                                    <button
                                        className={adminSubTab === 'create' ? 'sub-tab active' : 'sub-tab'}
                                        onClick={() => setAdminSubTab('create')}
                                    >
                                        Create Plan
                                    </button>
                                    <button
                                        className={adminSubTab === 'payments' ? 'sub-tab active' : 'sub-tab'}
                                        onClick={() => setAdminSubTab('payments')}
                                    >
                                        All Payments
                                    </button>
                                </div>

                                {/* Plans List */}
                                {adminSubTab === 'plans' && (
                                    <div className="payment-plans-list">
                                        <h3>Payment Plans</h3>
                                        {loading ? (
                                            <div className="payment-loading">Loading...</div>
                                        ) : plans.length === 0 ? (
                                            <div className="payment-empty">No payment plans found</div>
                                        ) : (
                                            <table className="payment-table">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>First Payment</th>
                                                        <th>Recurring</th>
                                                        <th>Billing Day</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {plans.map(plan => (
                                                        <tr key={plan.id}>
                                                            <td>{plan.company_name}</td>
                                                            <td>{formatCurrency(plan.first_payment_amount)}</td>
                                                            <td>{formatCurrency(plan.recurring_amount)}/mo</td>
                                                            <td>{plan.billing_cycle_day}</td>
                                                            <td>
                                                                <span className={getStatusBadgeClass(plan.status)}>
                                                                    {getStatusText(plan.status)}
                                                                </span>
                                                            </td>
                                                            <td className="action-buttons">
                                                                {plan.status === 'pending_first_payment' && (
                                                                    <button
                                                                        className="action-btn primary"
                                                                        onClick={() => handleCreateFirstPaymentRequest(plan.company_id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Send Request
                                                                    </button>
                                                                )}
                                                                {plan.status === 'first_payment_done' && (
                                                                    <button
                                                                        className="action-btn success"
                                                                        onClick={() => handleSetupMandate(plan.company_id)}
                                                                        disabled={loading}
                                                                    >
                                                                        Setup Mandate
                                                                    </button>
                                                                )}
                                                                {plan.status === 'mandate_active' && (
                                                                    <button
                                                                        className="action-btn warning"
                                                                        onClick={() => handleToggleMandate(plan.company_id, 'pause')}
                                                                        disabled={loading}
                                                                    >
                                                                        Pause
                                                                    </button>
                                                                )}
                                                                {plan.status === 'paused' && (
                                                                    <button
                                                                        className="action-btn success"
                                                                        onClick={() => handleToggleMandate(plan.company_id, 'resume')}
                                                                        disabled={loading}
                                                                    >
                                                                        Resume
                                                                    </button>
                                                                )}
                                                                {plan.status === 'mandate_pending' && (
                                                                    <button
                                                                        className="action-btn warning"
                                                                        onClick={() => handleRegenerateMandate(plan.company_id)}
                                                                        disabled={loading}
                                                                        title="Regenerate if authentication page expired"
                                                                    >
                                                                        Regenerate
                                                                    </button>
                                                                )}
                                                                {['mandate_active', 'paused', 'mandate_pending'].includes(plan.status) && (
                                                                    <button
                                                                        className="action-btn danger"
                                                                        onClick={() => {
                                                                            setCancelMandateCompanyId(plan.company_id);
                                                                            setCancelMandateDialogOpen(true);
                                                                        }}
                                                                        disabled={loading}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}

                                {/* Create Plan Form */}
                                {adminSubTab === 'create' && (
                                    <div className="payment-create-plan">
                                        <h3>Create Payment Plan</h3>
                                        <form onSubmit={handleCreatePlan} className="create-plan-form">
                                            <div className="form-group" style={{ position: 'relative', zIndex: 30 }}>
                                                <label>Select Company *</label>
                                                <div className="relative">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={isAdminCompanyDropdownOpen ? adminCompanySearch : (selectedCompanyId || adminCompanySearch)}
                                                            onChange={(e) => {
                                                                setAdminCompanySearch(e.target.value);
                                                                setIsAdminCompanyDropdownOpen(true);
                                                                if (selectedCompanyId) {
                                                                    setSelectedCompanyId('');
                                                                }
                                                            }}
                                                            onFocus={() => {
                                                                setIsAdminCompanyDropdownOpen(true);
                                                                if (selectedCompanyId && !adminCompanySearch) {
                                                                    setAdminCompanySearch(selectedCompanyId);
                                                                }
                                                            }}
                                                            onBlur={() => {
                                                                setTimeout(() => {
                                                                    setIsAdminCompanyDropdownOpen(false);
                                                                    if (!selectedCompanyId) {
                                                                        setAdminCompanySearch('');
                                                                    } else {
                                                                        setAdminCompanySearch(selectedCompanyId);
                                                                    }
                                                                }, 200);
                                                            }}
                                                            placeholder="Search by company ID..."
                                                            disabled={loading}
                                                            className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-3 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
                                                            <span className="material-symbols-outlined !text-[20px]">search</span>
                                                        </div>
                                                    </div>
                                                    {isAdminCompanyDropdownOpen && !loading && (() => {
                                                        const filtered = companies.filter(c =>
                                                            c.company_id.toLowerCase().includes(adminCompanySearch.toLowerCase())
                                                        );
                                                        return filtered.length > 0 ? (
                                                            <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                {filtered.map(company => (
                                                                    <div
                                                                        key={company.company_id}
                                                                        onMouseDown={(e) => {
                                                                            e.preventDefault();
                                                                            setSelectedCompanyId(company.company_id);
                                                                            setAdminCompanySearch(company.company_id);
                                                                            setIsAdminCompanyDropdownOpen(false);
                                                                        }}
                                                                        className={`px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors ${selectedCompanyId === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'}`}
                                                                    >
                                                                        <p className="font-medium text-sm">{company.name || company.company_id}</p>
                                                                        {company.name && <p className="text-xs text-secondary-text">{company.company_id}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : adminCompanySearch ? (
                                                            <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
                                                                No companies found matching "{adminCompanySearch}"
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>First Payment Amount (INR) *</label>
                                                    <input
                                                        type="number"
                                                        value={firstPaymentAmount}
                                                        onChange={(e) => setFirstPaymentAmount(e.target.value)}
                                                        placeholder="e.g., 5000"
                                                        required
                                                        min="1"
                                                        disabled={loading}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Recurring Amount (INR/month) *</label>
                                                    <input
                                                        type="number"
                                                        value={recurringAmount}
                                                        onChange={(e) => setRecurringAmount(e.target.value)}
                                                        placeholder="e.g., 3000"
                                                        required
                                                        min="1"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Billing Day of Month</label>
                                                    <select
                                                        value={billingCycleDay}
                                                        onChange={(e) => setBillingCycleDay(e.target.value)}
                                                        disabled={loading}
                                                        title="Billing Day of Month"
                                                    >
                                                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                                            <option key={day} value={day}>{day}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Description (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={planDescription}
                                                        onChange={(e) => setPlanDescription(e.target.value)}
                                                        placeholder="Plan description"
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="submit-btn" disabled={loading}>
                                                {loading ? 'Creating...' : 'Create Payment Plan'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* All Payments */}
                                {adminSubTab === 'payments' && (
                                    <div className="payment-all-payments">
                                        <h3>All Payments</h3>
                                        {loading ? (
                                            <div className="payment-loading">Loading...</div>
                                        ) : allPayments.length === 0 ? (
                                            <div className="payment-empty">No payments found</div>
                                        ) : (
                                            <table className="payment-table">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>Amount</th>
                                                        <th>Type</th>
                                                        <th>Method</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPayments.map(payment => (
                                                        <tr key={payment.id}>
                                                            <td>{(payment as any).company_name || payment.razorpay_payment_id}</td>
                                                            <td>{formatCurrency(payment.amount)}</td>
                                                            <td>{getStatusText(payment.type)}</td>
                                                            <td>{payment.method || '-'}</td>
                                                            <td>
                                                                <span className={getStatusBadgeClass(payment.status)}>
                                                                    {getStatusText(payment.status)}
                                                                </span>
                                                            </td>
                                                            <td>{formatDate(payment.paid_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* USER VIEW */}
                        {activeTab === 'user' && (
                            <div className="payment-user-section">
                                {/* Company Selector */}
                                <div className="company-selector" style={{ position: 'relative', zIndex: 30 }}>
                                    <label>Select Company:</label>
                                    <div className="relative" style={{ flex: 1, maxWidth: '500px' }}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={isUserCompanyDropdownOpen ? userCompanySearch : (userCompanyId || userCompanySearch)}
                                                onChange={(e) => {
                                                    setUserCompanySearch(e.target.value);
                                                    setIsUserCompanyDropdownOpen(true);
                                                    if (userCompanyId) {
                                                        setUserCompanyId('');
                                                    }
                                                }}
                                                onFocus={() => {
                                                    setIsUserCompanyDropdownOpen(true);
                                                    if (userCompanyId && !userCompanySearch) {
                                                        setUserCompanySearch(userCompanyId);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    setTimeout(() => {
                                                        setIsUserCompanyDropdownOpen(false);
                                                        if (!userCompanyId) {
                                                            setUserCompanySearch('');
                                                        } else {
                                                            setUserCompanySearch(userCompanyId);
                                                        }
                                                    }, 200);
                                                }}
                                                placeholder="Search by company ID..."
                                                disabled={loading}
                                                className="w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary block p-3 pr-10 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
                                                <span className="material-symbols-outlined !text-[20px]">search</span>
                                            </div>
                                        </div>
                                        {isUserCompanyDropdownOpen && !loading && (() => {
                                            const filtered = userCompanies.filter(c =>
                                                c.company_id.toLowerCase().includes(userCompanySearch.toLowerCase())
                                            );
                                            return filtered.length > 0 ? (
                                                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {filtered.map(company => (
                                                        <div
                                                            key={company.company_id}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setUserCompanyId(company.company_id);
                                                                setUserCompanySearch(company.company_id);
                                                                setIsUserCompanyDropdownOpen(false);
                                                            }}
                                                            className={`px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors ${userCompanyId === company.company_id ? 'bg-blue-50 text-blue-700' : 'text-primary-text'}`}
                                                        >
                                                            <p className="font-medium text-sm">{company.name || company.company_id}</p>
                                                            {company.name && <p className="text-xs text-secondary-text">{company.company_id}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : userCompanySearch ? (
                                                <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm text-secondary-text">
                                                    No companies found matching "{userCompanySearch}"
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>

                                {userCompanyId && (
                                    <>
                                        {/* User Sub Tabs */}
                                        <div className="payment-sub-tabs">
                                            <button
                                                className={userSubTab === 'pending' ? 'sub-tab active' : 'sub-tab'}
                                                onClick={() => setUserSubTab('pending')}
                                            >
                                                Pending Payments
                                                {pendingPayments.length > 0 && (
                                                    <span className="badge">{pendingPayments.length}</span>
                                                )}
                                            </button>
                                            <button
                                                className={userSubTab === 'history' ? 'sub-tab active' : 'sub-tab'}
                                                onClick={() => setUserSubTab('history')}
                                            >
                                                Payment History
                                            </button>
                                            <button
                                                className={userSubTab === 'invoices' ? 'sub-tab active' : 'sub-tab'}
                                                onClick={() => setUserSubTab('invoices')}
                                            >
                                                Invoices
                                            </button>
                                            <button
                                                className={userSubTab === 'mandate' ? 'sub-tab active' : 'sub-tab'}
                                                onClick={() => setUserSubTab('mandate')}
                                            >
                                                Mandate Status
                                            </button>
                                        </div>

                                        {/* Pending Payments */}
                                        {userSubTab === 'pending' && (
                                            <div className="payment-pending">
                                                <div className="section-header">
                                                    <h3>Pending Payments</h3>
                                                    <button
                                                        className="refresh-btn"
                                                        onClick={() => fetchPendingPayments()}
                                                        disabled={loading}
                                                        title="Refresh after completing payment"
                                                    >
                                                        {loading ? 'Refreshing...' : 'Refresh'}
                                                    </button>
                                                </div>
                                                {loading ? (
                                                    <div className="payment-loading">Loading...</div>
                                                ) : pendingPayments.length === 0 && !pendingMandate ? (
                                                    <div className="payment-empty">No pending payments</div>
                                                ) : (
                                                    <div className="pending-list">
                                                        {pendingPayments.map(payment => (
                                                            <div key={payment.id} className="pending-card">
                                                                <div className="pending-info">
                                                                    <h4>{payment.description}</h4>
                                                                    <p className="pending-amount">{formatCurrency(payment.amount)}</p>
                                                                    {payment.due_date && (
                                                                        <p className="pending-due">Due: {formatDate(payment.due_date)}</p>
                                                                    )}
                                                                </div>
                                                                <div className="pending-actions">
                                                                    <button
                                                                        className="pay-now-btn"
                                                                        onClick={() => handlePayNow(payment)}
                                                                        disabled={loading}
                                                                    >
                                                                        Pay Now
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {pendingMandate && (
                                                            <div className="pending-card mandate-card">
                                                                <div className="pending-info">
                                                                    <h4>Mandate Authentication Required</h4>
                                                                    <p>{pendingMandate.message}</p>
                                                                    <p className="pending-amount">{formatCurrency(pendingMandate.recurring_amount)}/month</p>
                                                                </div>
                                                                <button
                                                                    onClick={handleAuthenticateMandate}
                                                                    className="pay-now-btn"
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? 'Loading...' : 'Authenticate Mandate'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Payment History */}
                                        {userSubTab === 'history' && (
                                            <div className="payment-history">
                                                <h3>Payment History</h3>
                                                {loading ? (
                                                    <div className="payment-loading">Loading...</div>
                                                ) : paymentHistory.length === 0 ? (
                                                    <div className="payment-empty">No payment history</div>
                                                ) : (
                                                    <table className="payment-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Date</th>
                                                                <th>Amount</th>
                                                                <th>Type</th>
                                                                <th>Method</th>
                                                                <th>Status</th>
                                                                <th>Invoice</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paymentHistory.map(payment => (
                                                                <tr key={payment.id}>
                                                                    <td>{formatDate(payment.paid_at)}</td>
                                                                    <td>{formatCurrency(payment.amount)}</td>
                                                                    <td>{getStatusText(payment.type)}</td>
                                                                    <td>{payment.method || '-'}</td>
                                                                    <td>
                                                                        <span className={getStatusBadgeClass(payment.status)}>
                                                                            {getStatusText(payment.status)}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {payment.invoice ? (
                                                                            <button
                                                                                onClick={() => handleDownloadInvoice(payment.invoice!.id, payment.invoice!.invoice_number)}
                                                                                className="download-btn"
                                                                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                                                            >
                                                                                {payment.invoice.invoice_number}
                                                                            </button>
                                                                        ) : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}

                                        {/* Invoices */}
                                        {userSubTab === 'invoices' && (
                                            <div className="payment-invoices">
                                                <h3>Invoices</h3>
                                                {loading ? (
                                                    <div className="payment-loading">Loading...</div>
                                                ) : invoices.length === 0 ? (
                                                    <div className="payment-empty">No invoices found</div>
                                                ) : (
                                                    <table className="payment-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Invoice #</th>
                                                                <th>Date</th>
                                                                <th>Amount</th>
                                                                <th>Tax</th>
                                                                <th>Total</th>
                                                                <th>Status</th>
                                                                <th>Download</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {invoices.map(invoice => (
                                                                <tr key={invoice.id}>
                                                                    <td>{invoice.invoice_number}</td>
                                                                    <td>{formatDate(invoice.issued_at)}</td>
                                                                    <td>{formatCurrency(invoice.amount)}</td>
                                                                    <td>{formatCurrency(invoice.tax_amount)}</td>
                                                                    <td>{formatCurrency(invoice.total_amount)}</td>
                                                                    <td>
                                                                        <span className={getStatusBadgeClass(invoice.status)}>
                                                                            {getStatusText(invoice.status)}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                                                                            className="download-btn"
                                                                        >
                                                                            View Invoice
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}

                                        {/* Mandate Status */}
                                        {userSubTab === 'mandate' && (
                                            <div className="payment-mandate">
                                                <h3>Mandate Status</h3>
                                                {loading ? (
                                                    <div className="payment-loading">Loading...</div>
                                                ) : !mandateStatus ? (
                                                    <div className="payment-empty">No mandate set up</div>
                                                ) : (
                                                    <div className="mandate-details">
                                                        <div className="mandate-card">
                                                            <div className="mandate-status-header">
                                                                <h4>Auto-Pay Mandate</h4>
                                                                <span className={getStatusBadgeClass(mandateStatus.status)}>
                                                                    {getStatusText(mandateStatus.status)}
                                                                </span>
                                                            </div>
                                                            <div className="mandate-info-grid">
                                                                <div className="mandate-info-item">
                                                                    <span className="label">Monthly Amount</span>
                                                                    <span className="value">{formatCurrency(mandateStatus.recurring_amount)}</span>
                                                                </div>
                                                                {mandateStatus.start_date && (
                                                                    <div className="mandate-info-item">
                                                                        <span className="label">
                                                                            {mandateStatus.status === 'active' ? 'Started On' : 'Starts On'}
                                                                        </span>
                                                                        <span className="value">{formatDate(mandateStatus.start_date)}</span>
                                                                    </div>
                                                                )}
                                                                {mandateStatus.status === 'active' && mandateStatus.next_charge_date && (
                                                                    <div className="mandate-info-item">
                                                                        <span className="label">Next Charge Date</span>
                                                                        <span className="value">{formatDate(mandateStatus.next_charge_date)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {mandateStatus.status === 'created' && (
                                                                <button
                                                                    onClick={handleAuthenticateMandate}
                                                                    className="authenticate-btn"
                                                                    disabled={loading}
                                                                >
                                                                    {loading ? 'Loading...' : 'Authenticate Mandate'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="payment-pagination">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    Last
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Cancel Mandate Confirmation Dialog */}
            {cancelMandateDialogOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full"><span className="material-symbols-outlined">warning</span></div>
                                <h3 className="text-lg font-bold text-gray-900">Cancel Mandate</h3>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">Are you sure you want to cancel this mandate? This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <button
                                onClick={() => { setCancelMandateDialogOpen(false); setCancelMandateCompanyId(null); }}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                No, keep mandate
                            </button>
                            <button
                                onClick={() => {
                                    if (cancelMandateCompanyId) {
                                        handleToggleMandate(cancelMandateCompanyId, 'cancel');
                                        setCancelMandateDialogOpen(false);
                                        setCancelMandateCompanyId(null);
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Yes, cancel mandate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
