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
    const [isBillingDayDropdownOpen, setIsBillingDayDropdownOpen] = useState(false);

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
                return 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'first_payment_done':
            case 'paid':
            case 'captured':
                return 'bg-green-50 text-green-700 border border-green-200/60 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
            case 'mandate_active':
            case 'active':
            case 'authenticated':
                return 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            case 'paused':
            case 'halted':
                return 'bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
            case 'cancelled':
            case 'failed':
            case 'expired':
                return 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
            default:
                return 'bg-slate-50 text-slate-700 border border-slate-200/60 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
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
                <header className="h-14 px-4 flex items-center justify-between shrink-0 bg-background-light dark:bg-background-dark z-10 lg:hidden">
                    {/* Breadcrumbs/Title */}
                    <div className="flex items-center gap-2 text-primary dark:text-white">
                        <button
                            className="size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Payment Content */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4 pt-2 lg:pt-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Tab Headers - Show both for admin */}
                        {userData?.role === 'admin' && (
                            <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 mb-4 max-w-fit shadow-xs flex">
                                <button
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                        activeTab === 'admin'
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                                            : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                    }`}
                                    onClick={() => setActiveTab('admin')}
                                >
                                    <span className="material-symbols-outlined !text-[15px]">admin_panel_settings</span>
                                    Admin View
                                </button>
                                <button
                                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                        activeTab === 'user'
                                            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                                            : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                    }`}
                                    onClick={() => setActiveTab('user')}
                                >
                                    <span className="material-symbols-outlined !text-[15px]">person</span>
                                    User View
                                </button>
                            </div>
                        )}

                        {/* Success/Error Messages */}
                        {success && <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2"><span className="material-symbols-outlined">check_circle</span>{success}</div>}
                        {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2"><span className="material-symbols-outlined">error</span>{error}</div>}

                        {/* ADMIN VIEW */}
                        {activeTab === 'admin' && userData?.role === 'admin' && (
                            <div className="flex flex-col gap-4">
                                {/* Summary Cards */}
                                {summary && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md">
                                                    <span className="material-symbols-outlined !text-[16px]">list_alt</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Total Plans</div>
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{summary.total_plans}</div>
                                        </div>
                                        <div className="bg-green-50/50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800/50 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-md">
                                                    <span className="material-symbols-outlined !text-[16px]">verified</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-green-800 dark:text-green-300 uppercase tracking-wider">Active Mandates</div>
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{summary.active_mandates}</div>
                                        </div>
                                        <div className="bg-amber-50/50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800/50 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md">
                                                    <span className="material-symbols-outlined !text-[16px]">pending_actions</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Pending Payments</div>
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{summary.pending_payments}</div>
                                        </div>
                                        <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800/50 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-md">
                                                    <span className="material-symbols-outlined !text-[16px]">account_balance_wallet</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Total Revenue</div>
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(summary.total_revenue)}</div>
                                        </div>
                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/50 shadow-sm flex flex-col justify-center transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="p-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md">
                                                    <span className="material-symbols-outlined !text-[16px]">trending_up</span>
                                                </div>
                                                <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">This Month</div>
                                            </div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(summary.this_month_revenue)}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Sub Tabs */}
                                <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 max-w-fit shadow-xs flex flex-wrap gap-1">
                                    <button
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                            adminSubTab === 'plans'
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                        }`}
                                        onClick={() => setAdminSubTab('plans')}
                                    >
                                        <span className="material-symbols-outlined !text-[15px]">view_list</span>
                                        Payment Plans
                                    </button>
                                    <button
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                            adminSubTab === 'create'
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                        }`}
                                        onClick={() => setAdminSubTab('create')}
                                    >
                                        <span className="material-symbols-outlined !text-[15px]">add_circle</span>
                                        Create Plan
                                    </button>
                                    <button
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                            adminSubTab === 'payments'
                                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                        }`}
                                        onClick={() => setAdminSubTab('payments')}
                                    >
                                        <span className="material-symbols-outlined !text-[15px]">receipt_long</span>
                                        All Payments
                                    </button>
                                </div>

                                {/* Plans List */}
                                {adminSubTab === 'plans' && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-6">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">list</span> Payment Plans</h3>
                                        {loading ? (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                        ) : plans.length === 0 ? (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No payment plans found</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 first:rounded-tl-lg">Company</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">First Payment</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Recurring</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Billing Day</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Status</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-right last:rounded-tr-lg">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {plans.map(plan => (
                                                        <tr key={plan.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{plan.company_name}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(plan.first_payment_amount)}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(plan.recurring_amount)}<span className="text-[10px] text-slate-400">/mo</span></td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{plan.billing_cycle_day}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClass(plan.status)}`}>
                                                                    {getStatusText(plan.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    {plan.status === 'pending_first_payment' && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => handleCreateFirstPaymentRequest(plan.company_id)}
                                                                            disabled={loading}
                                                                        >
                                                                            Send Request
                                                                        </button>
                                                                    )}
                                                                    {plan.status === 'first_payment_done' && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => handleSetupMandate(plan.company_id)}
                                                                            disabled={loading}
                                                                        >
                                                                            Setup Mandate
                                                                        </button>
                                                                    )}
                                                                    {plan.status === 'mandate_active' && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => handleToggleMandate(plan.company_id, 'pause')}
                                                                            disabled={loading}
                                                                        >
                                                                            Pause
                                                                        </button>
                                                                    )}
                                                                    {plan.status === 'paused' && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => handleToggleMandate(plan.company_id, 'resume')}
                                                                            disabled={loading}
                                                                        >
                                                                            Resume
                                                                        </button>
                                                                    )}
                                                                    {plan.status === 'mandate_pending' && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => handleRegenerateMandate(plan.company_id)}
                                                                            disabled={loading}
                                                                            title="Regenerate if authentication page expired"
                                                                        >
                                                                            Regenerate
                                                                        </button>
                                                                    )}
                                                                    {['mandate_active', 'paused', 'mandate_pending'].includes(plan.status) && (
                                                                        <button
                                                                            className="px-2.5 py-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50"
                                                                            onClick={() => {
                                                                                setCancelMandateCompanyId(plan.company_id);
                                                                                setCancelMandateDialogOpen(true);
                                                                            }}
                                                                            disabled={loading}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Create Plan Form */}
                                {adminSubTab === 'create' && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4 w-full">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">add_circle</span> Create Payment Plan</h3>
                                        <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex flex-col gap-1.5" style={{ position: 'relative', zIndex: 30 }}>
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Company <span className="text-red-500">*</span></label>
                                                <div className="relative z-30">
                                                    <div className="relative group">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined !text-[17px]">domain</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={isAdminCompanyDropdownOpen ? adminCompanySearch : (selectedCompanyId || '')}
                                                            onChange={(e) => {
                                                                setAdminCompanySearch(e.target.value);
                                                                setIsAdminCompanyDropdownOpen(true);
                                                                if (selectedCompanyId && e.target.value !== selectedCompanyId) {
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
                                                            placeholder="-- Select a company --"
                                                            disabled={loading}
                                                            className={`w-full bg-white dark:bg-slate-900 border ${isAdminCompanyDropdownOpen ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800/50 ${selectedCompanyId ? 'font-medium' : ''}`}
                                                        />
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                            {selectedCompanyId && !loading ? (
                                                                <button
                                                                    type="button"
                                                                    onMouseDown={(e) => { e.preventDefault(); setSelectedCompanyId(''); setAdminCompanySearch(''); }}
                                                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                                                    tabIndex={-1}
                                                                >
                                                                    <span className="material-symbols-outlined !text-[16px]">close</span>
                                                                </button>
                                                            ) : (
                                                                <span className="material-symbols-outlined !text-[18px] text-slate-400 pointer-events-none">
                                                                    {isAdminCompanyDropdownOpen ? 'expand_less' : 'expand_more'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isAdminCompanyDropdownOpen && !loading && (
                                                        <div className="absolute z-[100] w-full mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
                                                            <div className="max-h-56 overflow-y-auto py-1">
                                                                {companies.filter(c => c.company_id.toLowerCase().includes(adminCompanySearch.toLowerCase())).length > 0 ? (
                                                                    companies.filter(c => c.company_id.toLowerCase().includes(adminCompanySearch.toLowerCase())).map(company => (
                                                                        <div
                                                                            key={company.company_id}
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                setSelectedCompanyId(company.company_id);
                                                                                setAdminCompanySearch(company.company_id);
                                                                                setIsAdminCompanyDropdownOpen(false);
                                                                            }}
                                                                            className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                                                                                selectedCompanyId === company.company_id
                                                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                            }`}
                                                                        >
                                                                            <span className="flex items-center gap-2">
                                                                                <span className="material-symbols-outlined !text-[14px] opacity-50">domain</span>
                                                                                {company.company_id}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                                                        <span className="material-symbols-outlined !text-[24px] mb-1">search_off</span>
                                                                        <span className="text-xs">No companies found</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">First Payment Amount (INR) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="number"
                                                    value={firstPaymentAmount}
                                                    onChange={(e) => setFirstPaymentAmount(e.target.value)}
                                                    placeholder="e.g., 5000"
                                                    required
                                                    min="1"
                                                    disabled={loading}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recurring Amount (INR/month) <span className="text-red-500">*</span></label>
                                                <input
                                                    type="number"
                                                    value={recurringAmount}
                                                    onChange={(e) => setRecurringAmount(e.target.value)}
                                                    placeholder="e.g., 3000"
                                                    required
                                                    min="1"
                                                    disabled={loading}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Billing Day of Month</label>
                                                <div className="relative">
                                                    <div
                                                        className={`w-full bg-white dark:bg-slate-900 border ${isBillingDayDropdownOpen ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm cursor-pointer flex items-center justify-between ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        onClick={() => !loading && setIsBillingDayDropdownOpen(!isBillingDayDropdownOpen)}
                                                    >
                                                        <span>{billingCycleDay}</span>
                                                        <span className="material-symbols-outlined !text-[18px] text-slate-500">
                                                            {isBillingDayDropdownOpen ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                    </div>
                                                    {isBillingDayDropdownOpen && !loading && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-[90]" 
                                                                onClick={() => setIsBillingDayDropdownOpen(false)}
                                                            />
                                                            <div className="absolute z-[100] w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-y-auto max-h-56 py-1">
                                                                {Array.from({ length: 28 }, (_, i) => String(i + 1)).map(day => (
                                                                    <div
                                                                        key={day}
                                                                        onClick={() => {
                                                                            setBillingCycleDay(day);
                                                                            setIsBillingDayDropdownOpen(false);
                                                                        }}
                                                                        className={`flex flex-col justify-center mx-1 px-4 py-2 rounded-lg cursor-pointer text-sm transition-all ${billingCycleDay === day ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                                    >
                                                                        {day}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={planDescription}
                                                    onChange={(e) => setPlanDescription(e.target.value)}
                                                    placeholder="Plan description"
                                                    disabled={loading}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl px-4 py-2.5 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </div>

                                            <div className="pt-2 md:col-span-3">
                                                <button type="submit" disabled={loading} className="w-fit bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined !text-[18px]">save</span>
                                                    {loading ? 'Creating...' : 'Create Payment Plan'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* All Payments */}
                                {adminSubTab === 'payments' && (
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">receipt_long</span> All Payments</h3>
                                        {loading ? (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                        ) : allPayments.length === 0 ? (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No payments found</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 first:rounded-tl-lg">Company</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Amount</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Type</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Method</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Status</th>
                                                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 last:rounded-tr-lg">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allPayments.map(payment => (
                                                        <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{(payment as any).company_name || payment.razorpay_payment_id}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(payment.amount)}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{getStatusText(payment.type)}</td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{payment.method || '-'}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClass(payment.status)}`}>
                                                                    {getStatusText(payment.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(payment.paid_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* USER VIEW */}
                        {activeTab === 'user' && (
                            <div className="payment-user-section">
                                {/* Company Selector */}
                                <div className="flex flex-col gap-1.5 mb-4" style={{ position: 'relative', zIndex: 30 }}>
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Company:</label>
                                    <div className="relative w-full max-w-lg z-30">
                                        <div className="relative group">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                <span className="material-symbols-outlined !text-[17px]">domain</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={isUserCompanyDropdownOpen ? userCompanySearch : (userCompanyId || '')}
                                                onChange={(e) => {
                                                    setUserCompanySearch(e.target.value);
                                                    setIsUserCompanyDropdownOpen(true);
                                                    if (userCompanyId && e.target.value !== userCompanyId) {
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
                                                placeholder="-- Select a company --"
                                                disabled={loading}
                                                className={`w-full bg-white dark:bg-slate-900 border ${isUserCompanyDropdownOpen ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800'} text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none transition-all shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800/50 ${userCompanyId ? 'font-medium' : ''}`}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                {userCompanyId && !loading ? (
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) => { e.preventDefault(); setUserCompanyId(''); setUserCompanySearch(''); }}
                                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                                        tabIndex={-1}
                                                    >
                                                        <span className="material-symbols-outlined !text-[16px]">close</span>
                                                    </button>
                                                ) : (
                                                    <span className="material-symbols-outlined !text-[18px] text-slate-400 pointer-events-none">
                                                        {isUserCompanyDropdownOpen ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isUserCompanyDropdownOpen && !loading && (
                                            <div className="absolute z-[100] w-full mt-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl shadow-slate-900/10 overflow-hidden">
                                                <div className="max-h-56 overflow-y-auto py-1">
                                                    {userCompanies.filter(c => c.company_id.toLowerCase().includes(userCompanySearch.toLowerCase())).length > 0 ? (
                                                        userCompanies.filter(c => c.company_id.toLowerCase().includes(userCompanySearch.toLowerCase())).map(company => (
                                                            <div
                                                                key={company.company_id}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setUserCompanyId(company.company_id);
                                                                    setUserCompanySearch(company.company_id);
                                                                    setIsUserCompanyDropdownOpen(false);
                                                                }}
                                                                className={`flex items-center justify-between mx-1 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                                                                    userCompanyId === company.company_id
                                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined !text-[14px] opacity-50">domain</span>
                                                                    {company.company_id}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                                                            <span className="material-symbols-outlined !text-[24px] mb-1">search_off</span>
                                                            <span className="text-xs">No companies found</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* User Sub Tabs */}
                                        <div className="bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 max-w-fit shadow-xs flex flex-wrap gap-1 mb-4">
                                            <button
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                                    userSubTab === 'pending'
                                                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                                }`}
                                                onClick={() => setUserSubTab('pending')}
                                            >
                                                <span className="material-symbols-outlined !text-[15px]">pending_actions</span>
                                                Pending Payments
                                                {pendingPayments.length > 0 && (
                                                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-full text-[9px] font-black">{pendingPayments.length}</span>
                                                )}
                                            </button>
                                            <button
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                                    userSubTab === 'history'
                                                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                                }`}
                                                onClick={() => setUserSubTab('history')}
                                            >
                                                <span className="material-symbols-outlined !text-[15px]">history</span>
                                                Payment History
                                            </button>
                                            <button
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                                    userSubTab === 'invoices'
                                                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                                }`}
                                                onClick={() => setUserSubTab('invoices')}
                                            >
                                                <span className="material-symbols-outlined !text-[15px]">receipt</span>
                                                Invoices
                                            </button>
                                            <button
                                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
                                                    userSubTab === 'mandate'
                                                        ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700/50'
                                                        : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30'
                                                }`}
                                                onClick={() => setUserSubTab('mandate')}
                                            >
                                                <span className="material-symbols-outlined !text-[15px]">verified_user</span>
                                                Mandate Status
                                            </button>
                                        </div>

                                        {/* Pending Payments */}
                                        {userSubTab === 'pending' && (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">pending_actions</span> Pending Payments</h3>
                                                    <button
                                                        className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => fetchPendingPayments()}
                                                        disabled={loading}
                                                        title="Refresh after completing payment"
                                                    >
                                                        <span className={`material-symbols-outlined !text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                                        {loading ? 'Refreshing...' : 'Refresh'}
                                                    </button>
                                                </div>
                                                {loading ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                                ) : pendingPayments.length === 0 && !pendingMandate ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No pending payments</div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {pendingPayments.map(payment => (
                                                            <div key={payment.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{payment.description}</h4>
                                                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 my-1">{formatCurrency(payment.amount)}</p>
                                                                    {payment.due_date && (
                                                                        <p className="text-[11px] text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined !text-[12px]">calendar_today</span> Due: {formatDate(payment.due_date)}</p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2">
                                                                    <button
                                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        onClick={() => handlePayNow(payment)}
                                                                        disabled={loading}
                                                                    >
                                                                        Pay Now
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {pendingMandate && (
                                                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5"><span className="material-symbols-outlined !text-[16px]">warning</span> Mandate Authentication Required</h4>
                                                                    <p className="text-[12px] text-amber-700 dark:text-amber-300/80 my-1 leading-snug">{pendingMandate.message}</p>
                                                                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-2">{formatCurrency(pendingMandate.recurring_amount)}<span className="text-[10px] opacity-70 font-normal">/month</span></p>
                                                                </div>
                                                                <button
                                                                    onClick={handleAuthenticateMandate}
                                                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">history</span> Payment History</h3>
                                                {loading ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                                ) : paymentHistory.length === 0 ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No payment history</div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 first:rounded-tl-lg">Date</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Amount</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Type</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Method</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Status</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 last:rounded-tr-lg">Invoice</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {paymentHistory.map(payment => (
                                                                <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(payment.paid_at)}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-mono font-medium">{formatCurrency(payment.amount)}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{getStatusText(payment.type)}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{payment.method || '-'}</td>
                                                                    <td className="px-4 py-3 text-sm">
                                                                        <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClass(payment.status)}`}>
                                                                            {getStatusText(payment.status)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm">
                                                                        {payment.invoice ? (
                                                                            <button
                                                                                onClick={() => handleDownloadInvoice(payment.invoice!.id, payment.invoice!.invoice_number)}
                                                                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline flex items-center gap-1 text-xs"
                                                                            >
                                                                                <span className="material-symbols-outlined !text-[14px]">download</span>
                                                                                {payment.invoice.invoice_number}
                                                                            </button>
                                                                        ) : <span className="text-slate-400">-</span>}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Invoices */}
                                        {userSubTab === 'invoices' && (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">receipt</span> Invoices</h3>
                                                {loading ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                                ) : invoices.length === 0 ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No invoices found</div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 first:rounded-tl-lg">Invoice #</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Date</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Amount</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Tax</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Total</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Status</th>
                                                                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-right last:rounded-tr-lg">Download</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {invoices.map(invoice => (
                                                                <tr key={invoice.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{invoice.invoice_number}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(invoice.issued_at)}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(invoice.amount)}</td>
                                                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(invoice.tax_amount)}</td>
                                                                    <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{formatCurrency(invoice.total_amount)}</td>
                                                                    <td className="px-4 py-3 text-sm">
                                                                        <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClass(invoice.status)}`}>
                                                                            {getStatusText(invoice.status)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <button
                                                                            onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-md transition-colors"
                                                                        >
                                                                            <span className="material-symbols-outlined !text-[14px]">download</span>
                                                                            View
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Mandate Status */}
                                        {userSubTab === 'mandate' && (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 mt-4 w-full">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[18px] text-indigo-500">verified_user</span> Mandate Status</h3>
                                                {loading ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-4 flex items-center gap-2"><span className="material-symbols-outlined animate-spin">refresh</span> Loading...</div>
                                                ) : !mandateStatus ? (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">No mandate set up</div>
                                                ) : (
                                                    <div className="flex flex-col gap-4">
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5">
                                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/50">
                                                                <h4 className="font-bold text-slate-800 dark:text-slate-100">Auto-Pay Mandate</h4>
                                                                <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-md ${getStatusBadgeClass(mandateStatus.status)}`}>
                                                                    {getStatusText(mandateStatus.status)}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Amount</span>
                                                                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(mandateStatus.recurring_amount)}</span>
                                                                </div>
                                                                {mandateStatus.start_date && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                                            {mandateStatus.status === 'active' ? 'Started On' : 'Starts On'}
                                                                        </span>
                                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(mandateStatus.start_date)}</span>
                                                                    </div>
                                                                )}
                                                                {mandateStatus.status === 'active' && mandateStatus.next_charge_date && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Charge Date</span>
                                                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(mandateStatus.next_charge_date)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {mandateStatus.status === 'created' && (
                                                                <button
                                                                    onClick={handleAuthenticateMandate}
                                                                    className="mt-6 w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
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
