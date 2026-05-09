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
                    {/* Header */}
                    <div className="settings-header">
                        <div className="flex items-center gap-3">
                            <button
                                className="lg:hidden size-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div>
                                <h1 className="settings-title">Profile</h1>
                                <p className="settings-subtitle">Manage your account profile and preferences</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="settings-content">
                        {/* Profile Information Section */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <h2 className="settings-card-title">Profile Information</h2>
                                <p className="settings-card-description">Update your personal information</p>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="settings-form">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        value={userData?.email || ''}
                                        disabled
                                        className="form-input form-input-disabled"
                                        placeholder="Email"
                                    />
                                    <p className="form-helper-text">Email cannot be changed</p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                {profileMessage && (
                                    <div className={`message message-${profileMessage.type}`}>
                                        {profileMessage.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password Section */}
                        <div className="settings-card">
                            <div
                                className="settings-card-header cursor-pointer hover:bg-gray-50 transition-colors rounded-lg p-4 -m-4 mb-0"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="settings-card-title">Change Password</h2>
                                        <p className="settings-card-description">Update your password to keep your account secure</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 transition-transform" style={{ transform: showPasswordSection ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            {showPasswordSection && (
                                <form onSubmit={handlePasswordChange} className="settings-form">
                                    <div className="form-group">
                                        <label className="form-label">Current Password</label>
                                        <input
                                            type="password"
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className="form-input"
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="form-input"
                                            placeholder="Enter new password (min 6 characters)"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="form-input"
                                            placeholder="Confirm new password"
                                            required
                                        />
                                    </div>

                                    {passwordMessage && (
                                        <div className={`message message-${passwordMessage.type}`}>
                                            {passwordMessage.text}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Legal Links Section */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <h2 className="settings-card-title">Legal</h2>
                                <p className="settings-card-description">View our policies and terms</p>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={onNavigateToPrivacy}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    <span className="material-symbols-outlined">policy</span>
                                    <span>Privacy Policy</span>
                                </button>
                                <button
                                    onClick={onNavigateToTerms}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
                                >
                                    <span className="material-symbols-outlined">description</span>
                                    <span>Terms & Conditions</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default Profile;
