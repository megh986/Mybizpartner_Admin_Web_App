import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import './css/Settings.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface ProfileProps {
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
    onNavigateToAdmin?: () => void;
    onNavigateToPayment?: () => void;
    onNavigateToPrivacy?: () => void;
    onNavigateToTerms?: () => void;
    onNavigateToWhatsApp?: () => void;
}

const Profile: React.FC<ProfileProps> = ({
    userData,
    onBack,
    onNavigateToAssets,
    onNavigateToBilling,
    onNavigateToReviews,
    onNavigateToAnalytics,
    onNavigateToAdmin,
    onNavigateToPayment,
    onNavigateToPrivacy,
    onNavigateToTerms,
    onNavigateToWhatsApp,
}) => {
    // Profile form state
    const [name, setName] = useState(userData?.name || '');
    const [phone, setPhone] = useState(userData?.phone || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password form state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Toggle state for password section
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // Mobile sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);

        // Validation
        if (!name.trim()) {
            setProfileMessage({ type: 'error', text: 'Name cannot be empty' });
            return;
        }

        setProfileLoading(true);

        try {
            const sessionToken = localStorage.getItem('session_token');
            const response = await fetch(`${API_BASE_URL}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({ name, phone }),
            });

            const data = await response.json();

            if (response.ok) {
                setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });

                // Update userData in parent component if needed
                // You might want to refresh the page or update global state here
            } else {
                setProfileMessage({ type: 'error', text: data.detail || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setProfileMessage({ type: 'error', text: 'An error occurred while updating profile' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All password fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPasswordLoading(true);

        try {
            const sessionToken = localStorage.getItem('session_token');
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordMessage({ type: 'success', text: data.message || 'Password changed successfully!' });
                // Clear password fields
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');

                // Optionally logout user after 2 seconds
                setTimeout(() => {
                    localStorage.removeItem('session_token');
                    window.location.reload();
                }, 2000);
            } else {
                setPasswordMessage({ type: 'error', text: data.detail || 'Failed to change password' });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordMessage({ type: 'error', text: 'An error occurred while changing password' });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <Sidebar
                userData={userData}
                activePage="profile"
                onNavigateToDashboard={onBack}
                onNavigateToReviews={onNavigateToReviews}
                onNavigateToAnalytics={onNavigateToAnalytics}
                onNavigateToAssets={onNavigateToAssets}
                // onNavigateToBilling={onNavigateToBilling}
                onNavigateToAdmin={onNavigateToAdmin}
                onNavigateToPayment={onNavigateToPayment}
                onNavigateToWhatsApp={onNavigateToWhatsApp}
                isMobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="settings-container">
                    {/* Mobile Menu Button (Header text removed as requested) */}
                    <div className="lg:hidden p-4 md:p-8 pb-0">
                        <button
                            className="size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="settings-content">
                        <div className="max-w-3xl mx-auto">
                            {/* Profile Information Section */}
                            <div className="settings-card !mb-0">
                                <div className="settings-card-header flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="size-14 rounded-full bg-indigo-50 border-2 border-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
                                            {name ? name.charAt(0).toUpperCase() : (userData?.email ? userData.email.charAt(0).toUpperCase() : 'U')}
                                        </div>
                                        <div>
                                            <h2 className="settings-card-title !mb-0">Profile Information</h2>
                                            <p className="settings-card-description mt-0.5">Update your personal information</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${showPasswordSection ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'} shrink-0`}
                                    >
                                        {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
                                    </button>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 gap-4 mt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">mail</span>
                                                <input
                                                    type="email"
                                                    value={userData?.email || ''}
                                                    disabled
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 cursor-not-allowed opacity-70"
                                                    placeholder="Email"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500">Email cannot be changed</p>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Full Name <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">person</span>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="Enter your full name"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Phone Number</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">phone</span>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                    </div>

                                    {profileMessage && (
                                        <div className={`text-xs p-2 rounded-lg ${profileMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {profileMessage.text}
                                        </div>
                                    )}

                                    <div className="mt-2 flex items-center gap-3">
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                            disabled={profileLoading}
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">save</span>
                                            {profileLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>

                                {/* Inline Change Password Section */}
                                {showPasswordSection && (
                                    <>
                                        <hr className="my-8 border-slate-200 dark:border-slate-800" />
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><span className="material-symbols-outlined !text-[20px] text-red-500">lock_reset</span> Change Password</h3>
                                        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Current Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">key</span>
                                                    <input
                                                        type="password"
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="Enter current password"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Password <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">lock</span>
                                                        <input
                                                            type="password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                                            placeholder="Min 6 chars"
                                                            required
                                                            minLength={6}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confirm Password <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">lock</span>
                                                        <input
                                                            type="password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                                            placeholder="Confirm password"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {passwordMessage && (
                                                <div className={`text-xs p-2 rounded-lg ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                    {passwordMessage.text}
                                                </div>
                                            )}

                                            <div className="mt-2 flex items-center gap-3">
                                                <button
                                                    type="submit"
                                                    className="px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                                    disabled={passwordLoading}
                                                >
                                                    <span className="material-symbols-outlined !text-[18px]">password</span>
                                                    {passwordLoading ? 'Changing...' : 'Change Password'}
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Legal Links Section */}
                        <div className="flex justify-center gap-4 mt-6 mb-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={onNavigateToPrivacy}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-xs font-bold shadow-sm"
                            >
                                <span className="material-symbols-outlined !text-[16px]">policy</span>
                                <span>Privacy Policy</span>
                            </button>
                            <button
                                onClick={onNavigateToTerms}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-50 border border-green-200 text-green-600 rounded-xl hover:bg-green-100 transition-colors text-xs font-bold shadow-sm"
                            >
                                <span className="material-symbols-outlined !text-[16px]">description</span>
                                <span>Terms & Conditions</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default Profile;
