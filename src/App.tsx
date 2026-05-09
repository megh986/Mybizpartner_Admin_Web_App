import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './css/App.css';
import Login from './Login';
import Home from './Home';
import Assets from './Assets';
import Billing from './Billing';
import Reviews from './Reviews';
import Analytics from './Analytics';
import Admin from './Admin';
import WhatsApp from './WhatsApp';
import Payment from './Payment';
import Profile from './Profile';
import HelpSupport from './HelpSupport';
import TermsConditions from './TermsConditions';
import PrivacyPolicy from './PrivacyPolicy';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
  user_id?: string;
  company_ids?: string[];  // Array of company IDs for regular users
  tab_access?: string[];   // Array of tabs the user can access
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check for existing session on page load
  useEffect(() => {
    const validateSession = async () => {
      const sessionToken = localStorage.getItem('session_token');

      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/user`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.user) {
            setUserData(data.user);
            setIsLoggedIn(true);
          } else {
            // Invalid session, clear token
            localStorage.removeItem('session_token');
          }
        } else {
          // Session expired or invalid, clear token
          localStorage.removeItem('session_token');
        }
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('session_token');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const handleLogin = (user: UserData) => {
    setUserData(user);
    setIsLoggedIn(true);
  };

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="App" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Check if user has access to a specific tab
  const hasTabAccess = (tab: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (!userData.tab_access) return true; // Legacy users without tab_access get full access
    return userData.tab_access.includes(tab);
  };

  // Get the first accessible route for the user (smart landing page)
  const getFirstAccessibleRoute = (): string => {
    const routePriority = [
      { key: 'dashboard', path: '/dashboard' },
      { key: 'reviews', path: '/reviews' },
      { key: 'reviews_stats', path: '/reviews/stats' },
      { key: 'analytics', path: '/analytics' },
      { key: 'analytics_product_reviews', path: '/analytics/product-reviews' },
      { key: 'assets', path: '/assets/product-mapping' },
      { key: 'assets_product_mapping', path: '/assets/product-mapping' },
      { key: 'assets_instagram_reel', path: '/assets/instagram-reel' },
      { key: 'assets_content', path: '/assets/content' },
      { key: 'assets_extra_detail', path: '/assets/extra-detail' },
      { key: 'payment', path: '/payment' },
    ];
    for (const route of routePriority) {
      if (hasTabAccess(route.key)) return route.path;
    }
    return '/profile';
  };

  // Get first accessible sub-route within a group
  const getFirstAccessibleSubRoute = (group: string): string | null => {
    const subRoutes: Record<string, { key: string; path: string }[]> = {
      assets: [
        { key: 'assets', path: '/assets/product-mapping' },
        { key: 'assets_product_mapping', path: '/assets/product-mapping' },
        { key: 'assets_instagram_reel', path: '/assets/instagram-reel' },
        { key: 'assets_content', path: '/assets/content' },
        { key: 'assets_extra_detail', path: '/assets/extra-detail' },
      ],
      reviews: [
        { key: 'reviews', path: '/reviews' },
        { key: 'reviews_stats', path: '/reviews/stats' },
      ],
      analytics: [
        { key: 'analytics', path: '/analytics' },
        { key: 'analytics_product_reviews', path: '/analytics/product-reviews' },
      ],
    };
    const routes = subRoutes[group] || [];
    for (const route of routes) {
      if (hasTabAccess(route.key)) return route.path;
    }
    return null;
  };

  const navToDashboard = () => navigate('/dashboard');
  const navToAssets = () => navigate(getFirstAccessibleSubRoute('assets') || '/assets/product-mapping');
  const navToAssetsContent = () => navigate('/assets/content');
  const navToAssetsInstagram = () => navigate('/assets/instagram-reel');
  const navToBilling = () => navigate('/billing');
  const navToReviews = () => navigate(getFirstAccessibleSubRoute('reviews') || '/reviews');
  const navToAnalytics = () => navigate(getFirstAccessibleSubRoute('analytics') || '/analytics');
  const navToAdmin = () => navigate('/admin');
  const navToWhatsApp = () => navigate('/whatsapp/create-config');
  const navToPayment = () => navigate('/payment');
  const navToProfile = () => navigate('/profile');
  const navToHelp = () => navigate('/help');
  const navToTerms = () => navigate('/terms');
  const navToPrivacy = () => navigate('/privacy');

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to={getFirstAccessibleRoute()} replace />} />
          <Route
            path="/dashboard"
            element={!hasTabAccess('dashboard') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Home
                userData={userData}
                onNavigateToDashboard={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToAssetsContent={navToAssetsContent}
                onNavigateToAssetsInstagram={navToAssetsInstagram}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToWhatsApp={navToWhatsApp}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToTerms={navToTerms}
                onNavigateToPrivacy={navToPrivacy}
              />
            }
          />
          <Route
            path="/assets/product-mapping"
            element={!(hasTabAccess('assets_product_mapping') || hasTabAccess('assets')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Assets
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/assets/instagram-reel"
            element={!(hasTabAccess('assets_instagram_reel') || hasTabAccess('assets')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Assets
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/assets/content"
            element={!(hasTabAccess('assets_content') || hasTabAccess('assets')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Assets
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/assets/extra-detail"
            element={!(hasTabAccess('assets_extra_detail') || hasTabAccess('assets')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Assets
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/assets"
            element={
              <Navigate to={getFirstAccessibleSubRoute('assets') || getFirstAccessibleRoute()} replace />
            }
          />
          <Route
            path="/billing"
            element={
              <Billing
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/reviews/stats"
            element={!(hasTabAccess('reviews_stats') || hasTabAccess('reviews')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Reviews
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToAssets={navToAssets}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/reviews/real-reviews"
            element={!hasTabAccess('real_reviews') ? <Navigate to={getFirstAccessibleSubRoute('reviews') || getFirstAccessibleRoute()} replace /> :
              <Reviews
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToAssets={navToAssets}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/reviews"
            element={!hasTabAccess('reviews') ? <Navigate to={getFirstAccessibleSubRoute('reviews') || getFirstAccessibleRoute()} replace /> :
              <Reviews
                userData={userData}
                onBack={navToDashboard}
                onNavigateToBilling={navToBilling}
                onNavigateToAssets={navToAssets}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/analytics/product-reviews"
            element={!(hasTabAccess('analytics_product_reviews') || hasTabAccess('analytics')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/analytics/wom-effectiveness"
            element={!hasTabAccess('analytics') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/analytics/user-patterns"
            element={!hasTabAccess('analytics') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/analytics/product-comparison"
            element={!hasTabAccess('analytics') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/analytics/homepage"
            element={!hasTabAccess('analytics') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/analytics/product-review-metrics"
            element={!(hasTabAccess('analytics_product_reviews') || hasTabAccess('analytics')) ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/analytics"
            element={!hasTabAccess('analytics') ? <Navigate to={getFirstAccessibleSubRoute('analytics') || getFirstAccessibleRoute()} replace /> :
              <Analytics
                userData={userData}
                onBack={navToDashboard}
                onNavigateToReviews={navToReviews}
                onNavigateToAssets={navToAssets}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/admin/register-user"
            element={
              <Admin
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/admin/create-company"
            element={
              <Admin
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/admin/manage-access"
            element={
              <Admin
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
              />
            }
          />
          <Route
            path="/admin/analytics-config"
            element={
              <Admin
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <Admin
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          {['/whatsapp/create-config', '/whatsapp/company-config', '/whatsapp/view-config', '/whatsapp/bulk-upload'].map(path => (
            <Route
              key={path}
              path={path}
              element={userData?.role !== 'admin' ? <Navigate to={getFirstAccessibleRoute()} replace /> :
                <WhatsApp
                  userData={userData}
                  onBack={navToDashboard}
                  onNavigateToAssets={navToAssets}
                  onNavigateToReviews={navToReviews}
                  onNavigateToAnalytics={navToAnalytics}
                  onNavigateToPayment={navToPayment}
                  onNavigateToProfile={navToProfile}
                  onNavigateToAdmin={navToAdmin}
                />
              }
            />
          ))}
          <Route
            path="/whatsapp"
            element={<Navigate to="/whatsapp/create-config" replace />}
          />
          <Route
            path="/payment"
            element={!hasTabAccess('payment') ? <Navigate to={getFirstAccessibleRoute()} replace /> :
              <Payment
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToProfile={navToProfile}
                onNavigateToHelp={navToHelp}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAnalytics={navToAnalytics}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToPrivacy={navToPrivacy}
                onNavigateToTerms={navToTerms}
                onNavigateToWhatsApp={navToWhatsApp}
              />
            }
          />
          <Route
            path="/help"
            element={
              <HelpSupport
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/terms"
            element={
              <TermsConditions
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToReviews={navToReviews}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
          <Route
            path="/privacy"
            element={
              <PrivacyPolicy
                userData={userData}
                onBack={navToDashboard}
                onNavigateToAssets={navToAssets}
                onNavigateToBilling={navToBilling}
                onNavigateToReviews={navToReviews}
                onNavigateToAdmin={navToAdmin}
                onNavigateToPayment={navToPayment}
                onNavigateToProfile={navToProfile}
              />
            }
          />
        </Routes>
      )}
    </div>
  );
}

export default App;





























































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































