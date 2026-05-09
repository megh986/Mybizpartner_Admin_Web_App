import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

const TAB_GROUPS = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    tabs: [{ key: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Reviews',
    icon: 'reviews',
    tabs: [
      { key: 'reviews', label: 'Reviews' },
      { key: 'reviews_stats', label: 'Review Stats' },
    ],
  },
  {
    label: 'Analytics',
    icon: 'pie_chart',
    tabs: [
      { key: 'analytics', label: 'Analytics' },
      { key: 'analytics_product_reviews', label: 'Product Reviews' },
    ],
  },
  {
    label: 'Assets',
    icon: 'inventory_2',
    tabs: [
      { key: 'assets', label: 'Assets' },
      { key: 'assets_product_mapping', label: 'Product Mapping' },
      { key: 'assets_instagram_reel', label: 'Instagram Reel' },
      { key: 'assets_content', label: 'Content' },
      { key: 'assets_extra_detail', label: 'Extra Detail' },
    ],
  },
  {
    label: 'Payment',
    icon: 'payments',
    tabs: [{ key: 'payment', label: 'Payment' }],
  },
];

const ALL_TAB_KEYS = TAB_GROUPS.flatMap(g => g.tabs.map(t => t.key));

const RegisterUserTab: React.FC = () => {
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [billingAddress, setBillingAddress] = useState({ line1: '', line2: '', city: '', state: '', zipcode: '', country: 'IN' });
  const [showBilling, setShowBilling] = useState(false);
  const [tabAccess, setTabAccess] = useState<string[]>([...ALL_TAB_KEYS]);
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const toggleTab = (tabKey: string) => {
    setTabAccess(prev =>
      prev.includes(tabKey)
        ? prev.filter(t => t !== tabKey)
        : [...prev, tabKey]
    );
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setRegisterLoading(true);

    try {
      const hasBilling = Object.values(billingAddress).some(v => v && v !== 'IN');
      const body: Record<string, unknown> = {
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword,
        tab_access: tabAccess,
      };
      if (companyName.trim()) body.company_name = companyName.trim();
      if (gstNo.trim()) body.gst_no = gstNo.trim();
      if (hasBilling) body.billing_address = billingAddress;

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess(`User "${registerName}" registered successfully!`);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPhone('');
        setRegisterPassword('');
        setCompanyName('');
        setGstNo('');
        setBillingAddress({ line1: '', line2: '', city: '', state: '', zipcode: '', country: 'IN' });
        setShowBilling(false);
        setTabAccess([...ALL_TAB_KEYS]);
      } else {
        setRegisterError(data.detail || 'Failed to register user');
      }
    } catch (err) {
      setRegisterError('Error connecting to server. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setRegisterLoading(false);
    }
  };

  const inputClass = "w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <span className="material-symbols-outlined">person_add</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary-text">Register New User</h2>
          <p className="text-xs text-secondary-text mt-1">
            Create a new user account in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleRegisterUser} className="flex flex-col gap-4">
        {registerError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {registerError}
          </div>
        )}
        {registerSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {registerSuccess}
          </div>
        )}

        {/* Account Info — 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Full Name *</p>
            <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="Enter full name" required disabled={registerLoading} className={inputClass} />
          </label>

          <label className="flex flex-col">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Email Address *</p>
            <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="Enter email address" required disabled={registerLoading} className={inputClass} />
          </label>

          <label className="flex flex-col">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Phone Number *</p>
            <input type="tel" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} placeholder="Enter phone number" required disabled={registerLoading} className={inputClass} />
          </label>

          <label className="flex flex-col">
            <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Password *</p>
            <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="Enter password" required disabled={registerLoading} className={inputClass} />
          </label>
        </div>

        {/* Business Details */}
        <div className="border border-gray-100 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-primary-text text-sm font-semibold">Business Details <span className="text-secondary-text font-normal">(optional)</span></p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col">
              <p className="text-primary-text text-sm font-medium pb-1">Company Name</p>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company / business name" disabled={registerLoading} className={inputClass} />
            </label>

            <label className="flex flex-col">
              <p className="text-primary-text text-sm font-medium pb-1">GST Number</p>
              <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" disabled={registerLoading} className={inputClass} />
            </label>
          </div>

          {/* Billing Address toggle */}
          <button
            type="button"
            onClick={() => setShowBilling(prev => !prev)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium self-start"
          >
            <span className="material-symbols-outlined !text-[18px]">{showBilling ? 'expand_less' : 'expand_more'}</span>
            {showBilling ? 'Hide' : 'Add'} Billing Address
          </button>

          {showBilling && (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">Address Line 1</p>
                  <input type="text" value={billingAddress.line1} onChange={(e) => setBillingAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Street address" disabled={registerLoading} className={inputClass} />
                </label>
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">Address Line 2</p>
                  <input type="text" value={billingAddress.line2} onChange={(e) => setBillingAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Apt, suite, etc." disabled={registerLoading} className={inputClass} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">City</p>
                  <input type="text" value={billingAddress.city} onChange={(e) => setBillingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" disabled={registerLoading} className={inputClass} />
                </label>
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">State</p>
                  <input type="text" value={billingAddress.state} onChange={(e) => setBillingAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" disabled={registerLoading} className={inputClass} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">PIN Code</p>
                  <input type="text" value={billingAddress.zipcode} onChange={(e) => setBillingAddress(p => ({ ...p, zipcode: e.target.value }))} placeholder="PIN code" disabled={registerLoading} className={inputClass} />
                </label>
                <label className="flex flex-col">
                  <p className="text-primary-text text-sm font-medium pb-1">Country</p>
                  <input type="text" value={billingAddress.country} onChange={(e) => setBillingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country code (e.g. IN)" disabled={registerLoading} className={inputClass} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Tab Access Control */}
        <div className="flex flex-col">
          <p className="text-primary-text text-sm font-semibold leading-normal pb-2">Tab Access</p>
          <p className="text-xs text-secondary-text mb-3">Select which tabs and sub-routes this user can access</p>
          <div className="flex flex-col gap-3">
            {TAB_GROUPS.map(group => {
              const allEnabled = group.tabs.every(t => tabAccess.includes(t.key));
              const someEnabled = group.tabs.some(t => tabAccess.includes(t.key));
              return (
                <div key={group.label} className="border border-gray-100 rounded-lg p-3">
                  <button
                    type="button"
                    disabled={registerLoading}
                    onClick={() => {
                      if (allEnabled) {
                        setTabAccess(prev => prev.filter(k => !group.tabs.map(t => t.key).includes(k)));
                      } else {
                        setTabAccess(prev => Array.from(new Set([...prev, ...group.tabs.map(t => t.key)])));
                      }
                    }}
                    className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                      someEnabled ? 'text-indigo-700' : 'text-gray-400'
                    } ${registerLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="material-symbols-outlined !text-[18px]">
                      {someEnabled ? group.icon : 'lock'}
                    </span>
                    {group.label}
                    {group.tabs.length > 1 && (
                      <span className="text-xs font-normal text-secondary-text ml-1">
                        ({group.tabs.filter(t => tabAccess.includes(t.key)).length}/{group.tabs.length})
                      </span>
                    )}
                  </button>
                  {group.tabs.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 ml-6">
                      {group.tabs.map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          disabled={registerLoading}
                          onClick={() => toggleTab(tab.key)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            tabAccess.includes(tab.key)
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                          } ${registerLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={registerLoading || !registerName || !registerEmail || !registerPhone || !registerPassword}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2"
        >
          <span className="material-symbols-outlined !text-[20px]">person_add</span>
          {registerLoading ? 'Registering...' : 'Register User'}
        </button>
      </form>
    </div>
  );
};

export default RegisterUserTab;
