import React, { useState } from 'react';
import './css/Login.css';
import logo1 from './assets/logo1.jpeg';
import logo2 from './assets/logo2.jpeg';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface LoginProps {
  onLogin: (userData: UserData) => void;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
  user_id?: string;
  company_ids?: string[];  // Array of company IDs for regular users
  tab_access?: string[];   // Array of tabs the user can access
}

type ViewMode = 'login' | 'signup' | 'forgot-password' | 'verify-code' | 'reset-password';



const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store session token in localStorage
        localStorage.setItem('session_token', data.session_token);

        // Pass user data to parent component
        onLogin(data.user);
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess(data.message);
        setViewMode('verify-code');
      } else {
        setError(data.detail || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail, code: resetCode }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess('Code verified! Enter your new password.');
        setViewMode('reset-password');
      } else {
        setError(data.detail || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Verify code error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess('Password reset successful! You can now login with your new password.');
        // Reset all states and go back to login
        setTimeout(() => {
          setViewMode('login');
          setResetEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccess('');
        }, 2000);
      } else {
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    setViewMode('login');
    setError('');
    setSuccess('');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSuccess('Account created successfully! You can now sign in.');
        setTimeout(() => {
          goBackToLogin();
        }, 2000);
      } else {
        setError(data.detail || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper renderers for notifications
  const renderError = () => error && (
    <div className="flex items-start gap-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2.5 rounded-lg text-xs font-semibold border border-red-100 dark:border-red-950/30">
      <span className="material-symbols-outlined !text-[15px] shrink-0 mt-0.5">error</span>
      <span>{error}</span>
    </div>
  );

  const renderSuccess = () => success && (
    <div className="flex items-start gap-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg text-xs font-semibold border border-emerald-100 dark:border-emerald-950/30">
      <span className="material-symbols-outlined !text-[15px] shrink-0 mt-0.5">check_circle</span>
      <span>{success}</span>
    </div>
  );

  // Forms
  const renderLoginForm = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <img src={logo2} className="h-16 object-contain" alt="MyBizPartner Logo" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Admin Workspace
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
          Welcome back! Please sign in to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <label className="text-slate-650 dark:text-slate-350 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="email">
            Email address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">mail</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-3 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none animate-none"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="text-slate-650 dark:text-slate-350 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              className="text-[10px] font-extrabold text-[#FF6B35] hover:text-[#E5521C] transition-colors"
              onClick={() => {
                setViewMode('forgot-password');
                setError('');
              }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">lock</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-10 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              className="absolute right-3 text-slate-400 hover:text-[#FF6B35] flex items-center justify-center transition-colors focus:outline-none"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {renderError()}

        <button
          className="mbp-btn-primary mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg h-10 px-5 text-white text-xs font-bold leading-normal tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
        </button>

        {/* Divider with verified badge */}
        <div className="flex items-center gap-2.5 my-0.5">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          <span className="material-symbols-outlined text-slate-300 !text-[13px]">verified_user</span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
        </div>

        {/* Verified Badge text */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/40 py-2 rounded-lg border border-slate-100/50 dark:border-slate-800/20">
          <span className="material-symbols-outlined text-emerald-500 !text-[11px]">check_circle</span>
          Secure access for authorized administrators only
        </div>
      </form>

      <div className="flex justify-center mt-0.5">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          Don't have an account?{' '}
          <button
            type="button"
            className="font-bold text-[#FF6B35] hover:text-[#E5521C] hover:underline transition-colors"
            onClick={() => { setViewMode('signup'); setError(''); setSuccess(''); }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );

  const renderSignupForm = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <img src={logo2} className="h-16 object-contain" alt="MyBizPartner Logo" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
          Join MyBizPartner admin panel today
        </p>
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-2.5">
        {/* Full Name */}
        <div className="flex flex-col gap-0.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="signupName">
            Full Name
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">person</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-3 h-9 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="signupName"
              name="name"
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-0.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="signupEmail">
            Email address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">mail</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-3 h-9 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="signupEmail"
              name="email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-0.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="signupPhone">
            Phone Number
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">phone</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-3 h-9 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="signupPhone"
              name="phone"
              type="tel"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-0.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="signupPassword">
            Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">lock</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-10 h-9 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="signupPassword"
              name="password"
              type={showSignupPassword ? 'text' : 'password'}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
            <button
              className="absolute right-3 text-slate-400 hover:text-[#FF6B35] flex items-center justify-center transition-colors focus:outline-none"
              type="button"
              onClick={() => setShowSignupPassword(!showSignupPassword)}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showSignupPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-0.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="signupConfirmPassword">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">lock</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-10 h-9 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="signupConfirmPassword"
              name="confirmPassword"
              type={showSignupConfirmPassword ? 'text' : 'password'}
              value={signupConfirmPassword}
              onChange={(e) => setSignupConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              minLength={6}
              required
            />
            <button
              className="absolute right-3 text-slate-400 hover:text-[#FF6B35] flex items-center justify-center transition-colors focus:outline-none"
              type="button"
              onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showSignupConfirmPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {renderError()}
        {renderSuccess()}

        <button
          className="mbp-btn-primary mt-1 flex w-full cursor-pointer items-center justify-center rounded-lg h-9 px-5 text-white text-xs font-bold leading-normal tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="flex justify-center mt-0.5">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
          Already have an account?{' '}
          <button
            type="button"
            className="font-bold text-[#FF6B35] hover:text-[#E5521C] hover:underline transition-colors"
            onClick={goBackToLogin}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );

  const renderForgotPasswordForm = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <img src={logo2} className="h-16 object-contain" alt="MyBizPartner Logo" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Forgot Password
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
          Enter your email to receive a reset code
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="resetEmail">
            Email address
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">mail</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-3 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="resetEmail"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        {renderError()}
        {renderSuccess()}

        <button
          className="mbp-btn-primary mt-1.5 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-5 text-white text-xs font-bold leading-normal tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <div className="flex justify-center mt-1.5">
        <button
          type="button"
          className="text-xs font-bold text-[#FF6B35] hover:text-[#E5521C] transition-colors"
          onClick={goBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  const renderVerifyCodeForm = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <img src={logo2} className="h-16 object-contain" alt="MyBizPartner Logo" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Enter Reset Code
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold leading-relaxed">
          We sent a 6-digit code to <span className="font-bold text-slate-800 dark:text-slate-200">{resetEmail}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyCode} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="resetCode">
            Reset Code
          </label>
          <input
            className="code-input w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none text-center text-xl font-bold tracking-[0.5em]"
            id="resetCode"
            type="text"
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
          />
        </div>

        {renderError()}
        {renderSuccess()}

        <button
          className="mbp-btn-primary mt-1.5 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-5 text-white text-xs font-bold leading-normal tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading || resetCode.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
      </form>

      <div className="flex flex-col items-center gap-1.5 mt-1">
        <button
          type="button"
          className="text-xs font-bold text-[#FF6B35] hover:text-[#E5521C] transition-colors"
          onClick={() => {
            setViewMode('forgot-password');
            setResetCode('');
            setError('');
            setSuccess('');
          }}
        >
          Resend Code
        </button>
        <button
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-slate-850 dark:hover:text-white transition-colors"
          onClick={goBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  const renderResetPasswordForm = () => (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <img src={logo2} className="h-16 object-contain" alt="MyBizPartner Logo" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-extrabold leading-tight tracking-tight">
          Reset Password
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
          Enter your new password
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="newPassword">
            New Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">lock</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-10 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
            <button
              className="absolute right-3 text-slate-400 hover:text-[#FF6B35] flex items-center justify-center transition-colors focus:outline-none"
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showNewPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-700 dark:text-slate-300 text-[9px] font-extrabold uppercase tracking-wider" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 !text-[16px] pointer-events-none">lock</span>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 pl-9 pr-10 h-10 text-slate-900 dark:text-white text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all outline-none"
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              minLength={6}
              required
            />
            <button
              className="absolute right-3 text-slate-400 hover:text-[#FF6B35] flex items-center justify-center transition-colors focus:outline-none"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showConfirmPassword ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {renderError()}
        {renderSuccess()}

        <button
          className="mbp-btn-primary mt-1.5 flex w-full cursor-pointer items-center justify-center rounded-lg h-10 px-5 text-white text-xs font-bold leading-normal tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="flex justify-center mt-1.5">
        <button
          type="button"
          className="text-xs font-bold text-[#FF6B35] hover:text-[#E5521C] transition-colors"
          onClick={goBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC] dark:bg-slate-950 font-sans md:h-screen md:overflow-hidden relative">
      
      {/* Left Column: Premium Branding Panel (hidden on mobile, shown on md and up) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[48%] xl:w-[42%] flex-col justify-between p-5 lg:p-6 py-4 lg:py-5 text-white relative overflow-hidden mbp-brand-panel shadow-2xl shrink-0 h-full">
        
        {/* Glow auroras */}
        <div className="absolute top-[-25%] left-[-25%] w-[80%] h-[80%] rounded-full bg-[#FF6B35]/12 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#8B5CF6]/10 blur-[110px] pointer-events-none" />
        <div className="absolute top-[35%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#3B82F6]/6 blur-[90px] pointer-events-none" />

        {/* Top Logo - Premium Horizontal layout with logo1 inside a capsule badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 pl-1 pr-3 py-1 rounded-full select-none w-fit z-10">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-sm shrink-0">
            <img src={logo1} className="w-full h-full object-contain" alt="Shield Logo" />
          </div>
          <span className="text-xs font-black tracking-tight text-white font-display">
            MyBiz<span className="text-[#FF6B35]">Partner</span>
          </span>
        </div>

        {/* Middle content: Value proposition + Floating Graphics */}
        <div className="my-auto flex flex-col gap-3 lg:gap-4.5 z-10 max-w-lg">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider bg-[#FF6B35]/12 text-[#FF6B35] border border-[#FF6B35]/25 uppercase font-display w-fit">
              <span className="material-symbols-outlined !text-[11px] fill-current">shield</span>
              Admin Portal
            </span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-[1.15] text-white font-heading">
              Insights that drive partnerships <span className="text-[#FF6B35]">forward.</span>
            </h1>
            <p className="text-slate-350 text-[10px] lg:text-[11px] leading-relaxed font-normal">
              Access powerful analytics, AI-driven insights, review intelligence and admin tools — all in one secure workspace.
            </p>
          </div>

          {/* Value Propositions Badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Advanced Analytics', icon: 'bar_chart', border: 'border-orange-500/15', bg: 'bg-orange-500/8', color: 'text-[#FF6B35]' },
              { label: 'Review Intelligence', icon: 'rate_review', border: 'border-violet-500/15', bg: 'bg-violet-500/8', color: 'text-violet-400' },
              { label: 'AI-Powered Insights', icon: 'psychology', border: 'border-emerald-500/15', bg: 'bg-emerald-500/8', color: 'text-emerald-400' },
              { label: 'Secure Administration', icon: 'security', border: 'border-blue-500/15', bg: 'bg-blue-500/8', color: 'text-blue-400' },
            ].map((prop) => (
              <div key={prop.label} className={`flex items-center gap-1.5 p-2 rounded-xl backdrop-blur-md bg-white/[0.01] border ${prop.border} transition-all duration-300 hover:bg-white/[0.06] hover:border-white/15`}>
                <div className={`p-1 rounded-lg ${prop.bg} ${prop.color} shrink-0 flex items-center justify-center`}>
                  <span className="material-symbols-outlined !text-[13px]">{prop.icon}</span>
                </div>
                <span className="text-[9.5px] font-bold text-slate-200 font-display truncate">{prop.label}</span>
              </div>
            ))}
          </div>

          {/* 3D Perspective Floating Workspace Illustration (Compact Height & Scale) */}
          <div className="relative w-full h-[270px] perspective-container mt-2 mb-1 select-none">
            <div className="w-full h-full relative" style={{ transform: 'rotateX(12deg) rotateY(-18deg) rotateZ(5deg) scale(0.82)', transformStyle: 'preserve-3d', transformOrigin: 'center center' }}>
              
              {/* Card 1: Review Overview Chart Card (Center Top) */}
              <div className="absolute top-[15px] left-[100px] right-[10px] h-[105px] z-10 glass-widget glow-widget-orange rounded-xl p-3 flex flex-col justify-between floating-card-bob-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-display">Review Overview</span>
                  <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/12 px-1.5 py-0.5 rounded border border-emerald-500/15 flex items-center gap-0.5">
                    <span className="material-symbols-outlined !text-[9px]">trending_up</span>
                    +14%
                  </span>
                </div>
                <div className="h-9 w-full flex items-end mt-1">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 180 40">
                    <defs>
                      <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="chartOrangeGrad" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="8" x2="180" y2="8" stroke="rgba(255,255,255,0.03)" strokeDasharray="2,2" />
                    <line x1="0" y1="20" x2="180" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="2,2" />
                    <line x1="0" y1="32" x2="180" y2="32" stroke="rgba(255,255,255,0.03)" strokeDasharray="2,2" />
                    <path d="M 0,36 Q 35,20 70,28 T 135,12 T 180,4 L 180,40 L 0,40 Z" fill="url(#chartOrangeGrad)" />
                    <path d="M 0,36 Q 35,20 70,28 T 135,12 T 180,4" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" filter="url(#glow-orange)" />
                    <path d="M 0,38 Q 35,30 70,22 T 135,17 T 180,11" fill="none" stroke="#8B5CF6" strokeWidth="1.2" strokeDasharray="2,2" strokeLinecap="round" opacity="0.75" />
                    <circle cx="135" cy="12" r="2.5" fill="#FF6B35" className="pulse-neon-orange" />
                    <circle cx="135" cy="12" r="1" fill="#FFFFFF" />
                    <circle cx="70" cy="22" r="2" fill="#8B5CF6" className="pulse-neon-purple" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Sentiment Analysis (Right Center) */}
              <div className="absolute top-[35px] right-[-5px] w-[115px] h-[115px] z-20 glass-widget glow-widget-violet rounded-xl p-2.5 flex flex-col justify-between floating-card-bob-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-display">Sentiment</span>
                <div className="flex items-center justify-center h-[55px] relative mt-1">
                  <svg className="w-[50px] h-[50px] transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10B981" strokeWidth="3.2" strokeDasharray="65 100" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.2" strokeDasharray="20 100" strokeDashoffset="-65" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FF6B35" strokeWidth="3.2" strokeDasharray="15 100" strokeDashoffset="-85" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col select-none">
                    <span className="text-[8px] font-black text-white leading-none">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[6px] font-black text-slate-400 border-t border-white/5 pt-1.5">
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" /> Pos</span>
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block" /> Neu</span>
                  <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] inline-block" /> Neg</span>
                </div>
              </div>

              {/* Card 3: Testimonial 1 (Middle-Left, overlapping Chart) */}
              <div className="absolute top-[60px] left-[-10px] w-[180px] z-30 glass-widget rounded-xl p-2.5 flex gap-2 items-start floating-card-bob-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 rounded-full shadow-sm">
                  <circle cx="12" cy="12" r="12" fill="url(#femAvatarGrad)" />
                  <path d="M12 5C9 5 7.5 7 7.5 9.5C7.5 12 8.5 13.5 9.5 14C9.5 15.5 8 16.5 6 17C9 19 15 19 18 17C16 16.5 14.5 15.5 14.5 14C15.5 13.5 16.5 12 16.5 9.5C16.5 7 15 5 12 5Z" fill="#FFF0F5" opacity="0.9" />
                  <path d="M12 5C10 5 9.5 6.5 9.5 8C10.5 8 11.5 7.5 12 7C12.5 7.5 13.5 8 14.5 8C14.5 6.5 14 5 12 5Z" fill="#DB7093" />
                  <defs>
                    <linearGradient id="femAvatarGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5 select-none">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined !text-[7px] text-amber-400 fill-current">star</span>
                      ))}
                    </div>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <p className="text-[7.5px] text-slate-355 leading-relaxed mt-0.5">"Great product and support!"</p>
                </div>
              </div>

              {/* Card 4: AI Suggestion (Bottom Center) */}
              <div className="absolute bottom-[40px] left-[110px] w-[165px] z-45 glass-widget rounded-xl p-2.5 flex items-start gap-2 floating-card-bob-5">
                <span className="material-symbols-outlined text-[#FF6B35] !text-[12px] shrink-0 mt-0.5 animate-pulse">auto_awesome</span>
                <div className="min-w-0">
                  <p className="text-[7.5px] font-black text-[#FF6B35] uppercase tracking-wider font-display">AI Suggestion</p>
                  <p className="text-[8px] text-slate-200 leading-snug mt-0.5">Improve onboarding experience based on recent reviews.</p>
                </div>
              </div>

              {/* Card 5: AI Summary (Right Bottom) */}
              <div className="absolute bottom-[15px] right-[-5px] w-[115px] z-25 glass-widget rounded-xl p-2.5 flex flex-col gap-1 floating-card-bob-6">
                <div className="flex items-center gap-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-cyan-400">
                    <rect x="3" y="8" width="18" height="12" rx="4" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 13h2M14 13h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M11 16h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M2 12h1M21 12h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 8V5M10 5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[7.5px] font-black text-cyan-400 uppercase tracking-wider font-display">AI Summary</span>
                </div>
                <p className="text-[7.5px] text-slate-350 leading-relaxed">Reviews sentiment is positive this month.</p>
              </div>

              {/* Card 6: Testimonial 2 (Bottom Left) */}
              <div className="absolute bottom-[5px] left-[-15px] w-[180px] z-50 glass-widget rounded-xl p-2.5 flex gap-2 items-start floating-card-bob-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 rounded-full shadow-sm">
                  <circle cx="12" cy="12" r="12" fill="url(#mascAvatarGrad)" />
                  <path d="M12 5C9.5 5 8 6.5 8 9C8 11.5 9 13 10 13.5C10 15 8.5 16 6.5 16.5C9.5 18.5 14.5 18.5 17.5 16.5C15.5 16 14 15 14 13.5C15 13 16 11.5 16 9C16 6.5 14.5 5 12 5Z" fill="#E6FFFA" opacity="0.9" />
                  <path d="M12 5C10.5 5 9 5.8 8.5 7C9.5 7.2 11 6.8 12 6C13 6.8 14.5 7.2 15.5 7C15 5.8 13.5 5 12 5Z" fill="#14B8A6" />
                  <defs>
                    <linearGradient id="mascAvatarGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5 select-none">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="material-symbols-outlined !text-[7px] text-amber-400 fill-current">star</span>
                      ))}
                    </div>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 select-none">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="#00B67A" />
                      <path d="M10 12.5l1.5 1.5 3-3" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[7.5px] text-slate-350 leading-relaxed mt-0.5">"Very helpful team and smooth process."</p>
                </div>
              </div>

            </div>
          </div>
        </div>


      </div>

      {/* Right Column: Form Container (with dot grid background and SVG curves) */}
      <div className="flex-1 flex flex-col justify-between p-5 sm:p-8 lg:p-10 relative h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 mesh-dot-grid">
        
        {/* Background Glows (Visuals with slow moving animations) */}
        <div className="absolute top-[5%] right-[-10%] w-[320px] h-[320px] rounded-full bg-gradient-to-tr from-[#FF6B35]/9 to-transparent blur-[80px] pointer-events-none z-0 bg-orb-float-1" />
        <div className="absolute bottom-[5%] left-[-10%] w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-[#3B82F6]/7 to-transparent blur-[90px] pointer-events-none z-0 bg-orb-float-2" />

        {/* Top-Right Dot Grid Visual Icon */}
        <div className="absolute top-10 right-10 pointer-events-none opacity-45 select-none z-0">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="5" r="1.2" fill="#94A3B8" />
            <circle cx="20" cy="5" r="1.2" fill="#94A3B8" />
            <circle cx="35" cy="5" r="1.2" fill="#94A3B8" />
            <circle cx="50" cy="5" r="1.2" fill="#94A3B8" />
            
            <circle cx="5" cy="20" r="1.2" fill="#94A3B8" />
            <circle cx="20" cy="20" r="1.2" fill="#94A3B8" />
            <circle cx="35" cy="20" r="1.2" fill="#94A3B8" />
            <circle cx="50" cy="20" r="1.2" fill="#94A3B8" />
            
            <circle cx="5" cy="35" r="1.2" fill="#94A3B8" />
            <circle cx="20" cy="35" r="1.2" fill="#94A3B8" />
            <circle cx="35" cy="35" r="1.2" fill="#94A3B8" />
            <circle cx="50" cy="35" r="1.2" fill="#94A3B8" />
            
            <circle cx="5" cy="50" r="1.2" fill="#94A3B8" />
            <circle cx="20" cy="50" r="1.2" fill="#94A3B8" />
            <circle cx="35" cy="50" r="1.2" fill="#94A3B8" />
            <circle cx="50" cy="50" r="1.2" fill="#94A3B8" />
          </svg>
        </div>

        {/* Faint Floating Background Growth Icons to make the right side feel alive and branded */}
        <div className="absolute top-[20%] left-[8%] pointer-events-none z-0 bg-float-icon-1 opacity-25 select-none" title="Analytics Visual">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>

        <div className="absolute top-[55%] right-[10%] pointer-events-none z-0 bg-float-icon-2 opacity-25 select-none" title="Trend Visual">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>

        <div className="absolute bottom-[35%] left-[6%] pointer-events-none z-0 bg-float-icon-3 opacity-20 select-none" title="Feedback Visual">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        <div className="absolute bottom-[15%] right-[12%] pointer-events-none z-0 bg-float-icon-4 opacity-25 select-none" title="Security Visual">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Decorative curves in bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-[280px] h-[280px] pointer-events-none z-0 overflow-hidden select-none">
          <svg className="w-full h-full" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M300 120 C 240 180, 200 240, 200 300 L 300 300 Z" fill="url(#waveOrangeGrad)" opacity="0.12" />
            <path d="M300 180 C 260 220, 240 260, 240 300 L 300 300 Z" fill="#FFFFFF" opacity="0.75" />
            <path d="M300 220 C 280 240, 270 270, 270 300 L 300 300 Z" fill="url(#waveOrangeGrad)" opacity="0.35" />
            <defs>
              <linearGradient id="waveOrangeGrad" x1="200" y1="120" x2="300" y2="300" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#E5521C" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Mobile Header (hidden on desktop) */}
        <header className="md:hidden flex justify-between items-center w-full mb-4 z-10">
          <img src={logo2} className="h-10 object-contain" alt="MyBizPartner Logo" />
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md">Admin</span>
        </header>

        {/* Elevated Form Card - rounded-3xl and custom shadow-2xl */}
        <div className="my-auto mx-auto w-full max-w-[375px] bg-white dark:bg-slate-800/95 border border-slate-150/80 dark:border-slate-700/80 rounded-[24px] shadow-2xl shadow-slate-250/50 hover:shadow-2xl transition-all duration-300 p-6 z-10 backdrop-blur-md">
          {viewMode === 'login' && renderLoginForm()}
          {viewMode === 'signup' && renderSignupForm()}
          {viewMode === 'forgot-password' && renderForgotPasswordForm()}
          {viewMode === 'verify-code' && renderVerifyCodeForm()}
          {viewMode === 'reset-password' && renderResetPasswordForm()}
        </div>

        {/* Footer copyright */}
        <footer className="text-center mt-5 pt-2 z-10">
          <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold tracking-wide">© 2026 MyBizPartner. All rights reserved.</p>
        </footer>
      </div>

    </div>
  );
};

export default Login;
