import React, { useState, useEffect, useRef } from 'react';
import logo1 from '../assets/logo1.jpeg';

interface SidebarProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    user_id?: string;
    company_ids?: string[];
    tab_access?: string[];
  } | null;
  activePage: 'dashboard' | 'reviews' | 'analytics' | 'assets' | 'profile' | 'integrations' | 'billing' | 'admin' | 'payment' | 'help' | 'whatsapp';
  onNavigateToDashboard: () => void;
  onNavigateToReviews: () => void;
  onNavigateToAssets: () => void;
  onNavigateToAnalytics?: () => void;
  // onNavigateToBilling: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToWhatsApp?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToHelp?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  userData,
  activePage,
  onNavigateToDashboard,
  onNavigateToReviews,
  onNavigateToAssets,
  onNavigateToAnalytics,
  onNavigateToProfile,
  onNavigateToAdmin,
  onNavigateToWhatsApp,
  onNavigateToPayment,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sub-route groups for sidebar access check
  const tabGroups: Record<string, string[]> = {
    dashboard: ['dashboard'],
    reviews: ['reviews', 'reviews_stats', 'real_reviews'],
    analytics: ['analytics', 'analytics_product_reviews'],
    assets: ['assets', 'assets_product_mapping', 'assets_instagram_reel', 'assets_content'],
    payment: ['payment'],
  };

  // Check if user has access to at least one sub-route in the group
  const hasAccess = (tab: string): boolean => {
    if (!userData) return false;
    if (userData.role === 'admin') return true;
    if (!userData.tab_access) return true;
    const group = tabGroups[tab] || [tab];
    return group.some(key => userData.tab_access!.includes(key));
  };

  const getLockedNavItemClass = () => {
    return "flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 cursor-not-allowed opacity-50 group";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    window.location.reload();
  };

  const getNavItemClass = (page: string) => {
    if (activePage === page) {
      return "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#FF6B35]/15 text-[#FF6B35] font-semibold border-l-4 border-[#FF6B35] rounded-l-none pl-3 transition-all group shadow-sm";
    }
    return "flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 border-l-4 border-transparent pl-3 transition-all group cursor-pointer";
  };

  const getIconClass = (page: string) => {
    if (activePage === page) {
      return "material-symbols-outlined icon-filled text-[#FF6B35] scale-105 transition-transform";
    }
    return "material-symbols-outlined text-slate-500 group-hover:text-slate-300 group-hover:scale-105 transition-all";
  };

  const getTextClass = (page: string) => {
    if (activePage === page) {
      return "text-sm font-bold text-[#FF6B35]";
    }
    return "text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors";
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300 relative z-50 lg:z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
        isMobileOpen ? 'fixed inset-y-0 left-0 lg:relative' : 'hidden lg:flex'
      }`}>
      {/* Brand Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 border border-slate-700 shadow-sm p-1">
            <img src={logo1} alt="MyBizPartner" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white text-base font-bold font-heading leading-tight tracking-tight">MyBizPartner</h1>
            <p className="text-[#FF6B35] text-[10px] font-semibold tracking-widest uppercase">ADMIN PORTAL</p>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
          onClick={onMobileClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-hidden py-4 px-4 flex flex-col gap-4">
        {/* Main Links */}
        <nav className="flex flex-col gap-1">
          {hasAccess('dashboard') ? (
            <button className={getNavItemClass('dashboard')} onClick={onNavigateToDashboard}>
              <span className={getIconClass('dashboard')}>dashboard</span>
              <span className={getTextClass('dashboard')}>Dashboard</span>
            </button>
          ) : (
            <button className={getLockedNavItemClass()} title="Access restricted">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
          )}
          {hasAccess('reviews') ? (
            <button className={getNavItemClass('reviews')} onClick={onNavigateToReviews}>
              <span className={getIconClass('reviews')}>reviews</span>
              <span className={getTextClass('reviews')}>Reviews</span>
            </button>
          ) : (
            <button className={getLockedNavItemClass()} title="Access restricted">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm font-medium">Reviews</span>
            </button>
          )}
          {hasAccess('analytics') ? (
            <button className={getNavItemClass('analytics')} onClick={onNavigateToAnalytics}>
              <span className={getIconClass('analytics')}>pie_chart</span>
              <span className={getTextClass('analytics')}>Analytics</span>
            </button>
          ) : (
            <button className={getLockedNavItemClass()} title="Access restricted">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm font-medium">Analytics</span>
            </button>
          )}
          {hasAccess('assets') ? (
            <button className={getNavItemClass('assets')} onClick={onNavigateToAssets}>
              <span className={getIconClass('assets')}>inventory_2</span>
              <span className={getTextClass('assets')}>Assets</span>
            </button>
          ) : (
            <button className={getLockedNavItemClass()} title="Access restricted">
              <span className="material-symbols-outlined">lock</span>
              <span className="text-sm font-medium">Assets</span>
            </button>
          )}
          {userData?.role === 'admin' && onNavigateToAdmin && (
            <button className={getNavItemClass('admin')} onClick={onNavigateToAdmin}>
              <span className={getIconClass('admin')}>admin_panel_settings</span>
              <span className={getTextClass('admin')}>Admin</span>
            </button>
          )}
          {userData?.role === 'admin' && onNavigateToWhatsApp && (
            <button className={getNavItemClass('whatsapp')} onClick={onNavigateToWhatsApp}>
              <span className={getIconClass('whatsapp')}>chat</span>
              <span className={getTextClass('whatsapp')}>WhatsApp</span>
            </button>
          )}
          {onNavigateToPayment && (
            hasAccess('payment') ? (
              <button className={getNavItemClass('payment')} onClick={onNavigateToPayment}>
                <span className={getIconClass('payment')}>payments</span>
                <span className={getTextClass('payment')}>Payment</span>
              </button>
            ) : (
              <button className={getLockedNavItemClass()} title="Access restricted">
                <span className="material-symbols-outlined">lock</span>
                <span className="text-sm font-medium">Payment</span>
              </button>
            )
          )}
        </nav>

        <div className="h-px bg-slate-800 mx-4"></div>

        {/* Secondary Links */}
        <nav className="flex flex-col gap-1">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">System</p>
          <button className={getNavItemClass('profile')} onClick={onNavigateToProfile}>
            <span className={getIconClass('profile')}>person</span>
            <span className={getTextClass('profile')}>Profile</span>
          </button>
          {/* <button className={getNavItemClass('integrations')}>
            <span className={getIconClass('integrations')}>integration_instructions</span>
            <span className={getTextClass('integrations')}>Integrations</span>
          </button>
          <button className={getNavItemClass('billing')} onClick={onNavigateToBilling}>
            <span className={getIconClass('billing')}>credit_card</span>
            <span className={getTextClass('billing')}>Billing</span>
          </button> */}
        </nav>
      </div>

      {/* User Profile (Bottom) */}
      <div className="p-3 border-t border-slate-800">
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800 transition-colors text-left group"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="size-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#E5521C] flex items-center justify-center text-white font-bold text-lg">
              {userData?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <p className="text-slate-200 text-sm font-bold truncate group-hover:text-white transition-colors">{userData?.name || 'User'}</p>
              <p className="text-slate-500 text-xs truncate group-hover:text-slate-400 transition-colors">{userData?.email || 'user@example.com'}</p>
            </div>
            <span className={`material-symbols-outlined text-slate-500 group-hover:text-slate-300 transition-transform ${profileOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              >
                <span className="material-symbols-outlined text-red-500">logout</span>
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
