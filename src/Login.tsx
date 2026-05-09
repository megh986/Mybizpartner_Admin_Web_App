import React, { useState } from 'react';
import './css/Login.css';
import { useGoogleLogin } from '@react-oauth/google';

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

type ViewMode = 'login' | 'forgot-password' | 'verify-code' | 'reset-password';

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

  // Google OAuth Handler
  const handleGoogleSuccess = async (codeResponse: any) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeResponse.code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Store session token in localStorage
        localStorage.setItem('session_token', data.session_token);

        // Pass user data to parent component
        onLogin(data.user);
      } else {
        setError(data.detail || 'Google sign-in failed. Please ensure your email is registered.');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setError('Google sign-in was cancelled or failed');
      setLoading(false);
    },
    flow: 'auth-code',
  });

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
  };

  // Login View
  if (viewMode === 'login') {
    return (
      <div className="wom-login-container">
        <header className="w-full flex justify-center md:justify-start px-8 py-8 md:px-12 max-w-[1200px] mx-auto z-10">
          <div className="flex items-center gap-3 select-none">
            <div className="size-8">
              <img src="/WOM_Logo.png" alt="Word of Mouth Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-primary dark:text-white text-xl font-bold tracking-tight">Word of Mouth</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full -mt-20">
          <div className="w-full max-w-[420px] flex flex-col gap-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-primary dark:text-white text-3xl md:text-[32px] font-heading font-bold leading-tight tracking-tight">
                Sign in to your workspace
              </h2>
              <p className="text-text-secondary dark:text-slate-400 text-base font-normal">
                Welcome back to the trust infrastructure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-primary dark:text-white text-sm font-semibold leading-normal ml-1" htmlFor="email">
                  Email address
                </label>
                <input
                  className="form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 px-4 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none"
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-primary dark:text-white text-sm font-semibold leading-normal" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-sm font-medium text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                    onClick={() => {
                      setViewMode('forgot-password');
                      setError('');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    className="form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 pl-4 pr-12 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    className="absolute right-4 text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-subtle text-sm">
                  {error}
                </div>
              )}

              <button
                className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-subtle h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-primary text-base font-bold leading-normal tracking-wide transition-all shadow-soft active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border-subtle dark:bg-slate-700"></div>
                <span className="text-xs text-text-secondary dark:text-slate-500 font-medium uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-border-subtle dark:bg-slate-700"></div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-subtle h-12 px-6 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-2 border-border-subtle dark:border-slate-600 text-primary dark:text-white text-base font-semibold leading-normal tracking-wide transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853" />
                  <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="flex flex-col items-center gap-6 mt-2">
              <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[16px] text-text-secondary dark:text-slate-500">lock</span>
                <span className="text-xs font-medium text-text-secondary dark:text-slate-500 uppercase tracking-wider">Secured by WOM AI</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 text-center">
          <p className="text-xs text-slate-300 dark:text-slate-700">© 2024 Word of Mouth Inc.</p>
        </footer>
      </div>
    );
  }

  // Forgot Password View - Enter Email
  if (viewMode === 'forgot-password') {
    return (
      <div className="wom-login-container">
        <header className="w-full flex justify-center md:justify-start px-8 py-8 md:px-12 max-w-[1200px] mx-auto z-10">
          <div className="flex items-center gap-3 select-none">
            <div className="size-8">
              <img src="/WOM_Logo.png" alt="Word of Mouth Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-primary dark:text-white text-xl font-bold tracking-tight">Word of Mouth</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full -mt-20">
          <div className="w-full max-w-[420px] flex flex-col gap-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-primary dark:text-white text-3xl md:text-[32px] font-heading font-bold leading-tight tracking-tight">
                Forgot Password
              </h2>
              <p className="text-text-secondary dark:text-slate-400 text-base font-normal">
                Enter your email to receive a reset code
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-primary dark:text-white text-sm font-semibold leading-normal ml-1" htmlFor="resetEmail">
                  Email address
                </label>
                <input
                  className="form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 px-4 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none"
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-subtle text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-subtle text-sm">
                  {success}
                </div>
              )}

              <button
                className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-subtle h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-primary text-base font-bold leading-normal tracking-wide transition-all shadow-soft active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-2">
              <button
                type="button"
                className="text-sm font-medium text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                onClick={goBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 text-center">
          <p className="text-xs text-slate-300 dark:text-slate-700">© 2024 Word of Mouth Inc.</p>
        </footer>
      </div>
    );
  }

  // Verify Code View
  if (viewMode === 'verify-code') {
    return (
      <div className="wom-login-container">
        <header className="w-full flex justify-center md:justify-start px-8 py-8 md:px-12 max-w-[1200px] mx-auto z-10">
          <div className="flex items-center gap-3 select-none">
            <div className="size-8">
              <img src="/WOM_Logo.png" alt="Word of Mouth Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-primary dark:text-white text-xl font-bold tracking-tight">Word of Mouth</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full -mt-20">
          <div className="w-full max-w-[420px] flex flex-col gap-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-primary dark:text-white text-3xl md:text-[32px] font-heading font-bold leading-tight tracking-tight">
                Enter Reset Code
              </h2>
              <p className="text-text-secondary dark:text-slate-400 text-base font-normal">
                We sent a 6-digit code to {resetEmail}
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-primary dark:text-white text-sm font-semibold leading-normal ml-1" htmlFor="resetCode">
                  Reset Code
                </label>
                <input
                  className="code-input form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 px-4 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none text-center text-2xl font-bold tracking-[0.5em]"
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-subtle text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-subtle text-sm">
                  {success}
                </div>
              )}

              <button
                className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-subtle h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-primary text-base font-bold leading-normal tracking-wide transition-all shadow-soft active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                disabled={loading || resetCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-2">
              <button
                type="button"
                className="text-sm font-medium text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
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
                className="text-sm font-medium text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                onClick={goBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 text-center">
          <p className="text-xs text-slate-300 dark:text-slate-700">© 2024 Word of Mouth Inc.</p>
        </footer>
      </div>
    );
  }

  // Reset Password View
  if (viewMode === 'reset-password') {
    return (
      <div className="wom-login-container">
        <header className="w-full flex justify-center md:justify-start px-8 py-8 md:px-12 max-w-[1200px] mx-auto z-10">
          <div className="flex items-center gap-3 select-none">
            <div className="size-8">
              <img src="/WOM_Logo.png" alt="Word of Mouth Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-primary dark:text-white text-xl font-bold tracking-tight">Word of Mouth</h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 w-full -mt-20">
          <div className="w-full max-w-[420px] flex flex-col gap-8">
            <div className="text-center md:text-left space-y-2">
              <h2 className="text-primary dark:text-white text-3xl md:text-[32px] font-heading font-bold leading-tight tracking-tight">
                Reset Password
              </h2>
              <p className="text-text-secondary dark:text-slate-400 text-base font-normal">
                Enter your new password
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-primary dark:text-white text-sm font-semibold leading-normal ml-1" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    className="form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 pl-4 pr-12 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none"
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                  <button
                    className="absolute right-4 text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-primary dark:text-white text-sm font-semibold leading-normal ml-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <input
                    className="form-input flex w-full rounded-subtle border border-border-subtle dark:border-slate-700 bg-background-light dark:bg-slate-800/50 pl-4 pr-12 h-12 text-primary dark:text-white text-base placeholder:text-text-secondary/60 focus:border-primary focus:ring-1 focus:ring-primary dark:focus:border-white dark:focus:ring-white transition-all shadow-sm outline-none"
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                  <button
                    className="absolute right-4 text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors focus:outline-none"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-subtle text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-subtle text-sm">
                  {success}
                </div>
              )}

              <button
                className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-subtle h-12 px-6 bg-primary hover:bg-primary/90 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-primary text-base font-bold leading-normal tracking-wide transition-all shadow-soft active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="flex flex-col items-center gap-4 mt-2">
              <button
                type="button"
                className="text-sm font-medium text-text-secondary hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors"
                onClick={goBackToLogin}
              >
                Back to Login
              </button>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 text-center">
          <p className="text-xs text-slate-300 dark:text-slate-700">© 2024 Word of Mouth Inc.</p>
        </footer>
      </div>
    );
  }

  return null;
};

export default Login;
