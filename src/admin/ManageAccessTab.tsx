import React, { useState, useEffect, useCallback } from 'react';

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
      { key: 'real_reviews', label: 'Real Reviews' },
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

interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  tab_access: string[];
  phone?: string;
  company_name?: string;
  gst_no?: string;
  billing_address?: BillingAddress;
}

interface EditDetailsState {
  email: string;
  name: string;
  phone: string;
  company_name: string;
  gst_no: string;
  billing_address: Required<BillingAddress>;
}

const ITEMS_PER_PAGE = 5;

const emptyBilling = (): Required<BillingAddress> => ({ line1: '', line2: '', city: '', state: '', zipcode: '', country: 'IN' });

const ManageAccessTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [editedAccess, setEditedAccess] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit details state — keyed by user email
  const [editingDetails, setEditingDetails] = useState<string | null>(null); // which user's details panel is open
  const [detailsForm, setDetailsForm] = useState<EditDetailsState>({
    email: '', name: '', phone: '', company_name: '', gst_no: '', billing_address: emptyBilling(),
  });
  const [savingDetails, setSavingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const nonAdminUsers = data.users.filter((u: User) => u.role !== 'admin');
        setUsers(nonAdminUsers);
        const accessMap: Record<string, string[]> = {};
        nonAdminUsers.forEach((u: User) => {
          accessMap[u.email] = [...(u.tab_access || ALL_TAB_KEYS)];
        });
        setEditedAccess(accessMap);
      } else {
        setError(data.detail || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Error connecting to server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleTab = (email: string, tabKey: string) => {
    setEditedAccess(prev => {
      const current = prev[email] || [];
      const updated = current.includes(tabKey)
        ? current.filter(t => t !== tabKey)
        : [...current, tabKey];
      return { ...prev, [email]: updated };
    });
  };

  const hasChanges = (user: User): boolean => {
    const original = user.tab_access || ALL_TAB_KEYS;
    const edited = editedAccess[user.email] || [];
    if (original.length !== edited.length) return true;
    return !original.every(t => edited.includes(t));
  };

  const saveAccess = async (user: User) => {
    setSavingUser(user.email);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('session_token');
      const response = await fetch(`${API_BASE_URL}/admin/update-user-access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_email: user.email,
          tab_access: editedAccess[user.email],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Access updated for ${user.name}`);
        setUsers(prev => prev.map(u =>
          u.email === user.email ? { ...u, tab_access: editedAccess[user.email] } : u
        ));
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.detail || 'Failed to update access');
      }
    } catch (err) {
      setError('Error connecting to server.');
      console.error(err);
    } finally {
      setSavingUser(null);
    }
  };

  const openEditDetails = (user: User) => {
    setEditingDetails(user.email);
    setDetailsForm({
      email: user.email,
      name: user.name || '',
      phone: user.phone || '',
      company_name: user.company_name || '',
      gst_no: user.gst_no || '',
      billing_address: {
        line1: user.billing_address?.line1 || '',
        line2: user.billing_address?.line2 || '',
        city: user.billing_address?.city || '',
        state: user.billing_address?.state || '',
        zipcode: user.billing_address?.zipcode || '',
        country: user.billing_address?.country || 'IN',
      },
    });
  };

  const saveDetails = async (user: User) => {
    setSavingDetails(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('session_token');
      const hasBilling = Object.values(detailsForm.billing_address).some(v => v && v !== 'IN');
      const body: Record<string, unknown> = {
        user_email: user.email,
        new_email: detailsForm.email && detailsForm.email !== user.email ? detailsForm.email : undefined,
        name: detailsForm.name || undefined,
        phone: detailsForm.phone || undefined,
        company_name: detailsForm.company_name || undefined,
        gst_no: detailsForm.gst_no || undefined,
        billing_address: hasBilling ? detailsForm.billing_address : undefined,
      };
      // Remove undefined keys
      Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

      const response = await fetch(`${API_BASE_URL}/admin/update-user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Details updated for ${user.name}`);
        const updatedEmail = detailsForm.email && detailsForm.email !== user.email ? detailsForm.email : user.email;
        setUsers(prev => prev.map(u =>
          u.email === user.email
            ? {
                ...u,
                email: updatedEmail,
                name: detailsForm.name || u.name,
                phone: detailsForm.phone || u.phone,
                company_name: detailsForm.company_name,
                gst_no: detailsForm.gst_no,
                billing_address: hasBilling ? detailsForm.billing_address : u.billing_address,
              }
            : u
        ));
        // Keep editedAccess in sync if email changed
        if (updatedEmail !== user.email) {
          setEditedAccess(prev => {
            const { [user.email]: access, ...rest } = prev;
            return { ...rest, [updatedEmail]: access || [] };
          });
        }
        setEditingDetails(null);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(data.detail || 'Failed to update user details');
      }
    } catch (err) {
      setError('Error connecting to server.');
      console.error(err);
    } finally {
      setSavingDetails(false);
    }
  };

  const inputClass = "w-full bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-2.5 outline-none transition-all";

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-secondary-text">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <span className="material-symbols-outlined">shield_person</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary-text">Manage Users</h2>
          <p className="text-xs text-secondary-text mt-1">
            Edit user details and control tab access
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 !text-[20px]">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-background-light border border-gray-200 text-primary-text text-sm rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined !text-[18px]">close</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {successMsg}
        </div>
      )}

      {(() => {
        const query = searchQuery.toLowerCase().trim();
        const filteredUsers = query
          ? users.filter(u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query))
          : users;

        const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
        const safePage = Math.min(currentPage, totalPages || 1);
        const paginatedUsers = filteredUsers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

        return filteredUsers.length === 0 ? (
          <p className="text-secondary-text text-sm">
            {users.length === 0 ? 'No users found.' : `No users matching "${searchQuery}".`}
          </p>
        ) : (
        <>
        <div className="flex flex-col gap-4">
          {paginatedUsers.map(user => (
            <div key={user._id} className="border border-gray-100 rounded-lg p-4">
              {/* User header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-primary-text">{user.name}</p>
                  <p className="text-xs text-secondary-text">{user.email}</p>
                  {user.phone && <p className="text-xs text-secondary-text">{user.phone}</p>}
                  {user.company_name && (
                    <p className="text-xs text-secondary-text mt-0.5">
                      <span className="font-medium">Company:</span> {user.company_name}
                      {user.gst_no && <span className="ml-2 text-gray-400">GST: {user.gst_no}</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => editingDetails === user.email ? setEditingDetails(null) : openEditDetails(user)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      editingDetails === user.email
                        ? 'bg-gray-100 border-gray-300 text-gray-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    <span className="material-symbols-outlined !text-[15px]">{editingDetails === user.email ? 'close' : 'edit'}</span>
                    {editingDetails === user.email ? 'Cancel' : 'Edit Details'}
                  </button>
                  {hasChanges(user) && (
                    <button
                      type="button"
                      onClick={() => saveAccess(user)}
                      disabled={savingUser === user.email}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined !text-[16px]">save</span>
                      {savingUser === user.email ? 'Saving...' : 'Save Access'}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Details Panel */}
              {editingDetails === user.email && (
                <div className="border border-indigo-100 bg-indigo-50/40 rounded-lg p-4 mb-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-primary-text">Edit User Details</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col">
                      <p className="text-xs font-medium text-primary-text pb-1">Full Name</p>
                      <input type="text" value={detailsForm.name} onChange={(e) => setDetailsForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" disabled={savingDetails} className={inputClass} />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-xs font-medium text-primary-text pb-1">Email Address</p>
                      <input type="email" value={detailsForm.email} onChange={(e) => setDetailsForm(p => ({ ...p, email: e.target.value }))} placeholder="Email address" disabled={savingDetails} className={inputClass} />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-xs font-medium text-primary-text pb-1">Phone</p>
                      <input type="tel" value={detailsForm.phone} onChange={(e) => setDetailsForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" disabled={savingDetails} className={inputClass} />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-xs font-medium text-primary-text pb-1">Company Name</p>
                      <input type="text" value={detailsForm.company_name} onChange={(e) => setDetailsForm(p => ({ ...p, company_name: e.target.value }))} placeholder="Company / business name" disabled={savingDetails} className={inputClass} />
                    </label>
                    <label className="flex flex-col">
                      <p className="text-xs font-medium text-primary-text pb-1">GST Number</p>
                      <input type="text" value={detailsForm.gst_no} onChange={(e) => setDetailsForm(p => ({ ...p, gst_no: e.target.value }))} placeholder="e.g. 29ABCDE1234F1Z5" disabled={savingDetails} className={inputClass} />
                    </label>
                  </div>

                  {/* Billing Address */}
                  <div className="flex flex-col gap-2 border-t border-indigo-100 pt-3">
                    <p className="text-xs font-semibold text-primary-text">Billing Address</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">Address Line 1</p>
                        <input type="text" value={detailsForm.billing_address.line1} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, line1: e.target.value } }))} placeholder="Street address" disabled={savingDetails} className={inputClass} />
                      </label>
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">Address Line 2</p>
                        <input type="text" value={detailsForm.billing_address.line2} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, line2: e.target.value } }))} placeholder="Apt, suite, etc." disabled={savingDetails} className={inputClass} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">City</p>
                        <input type="text" value={detailsForm.billing_address.city} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, city: e.target.value } }))} placeholder="City" disabled={savingDetails} className={inputClass} />
                      </label>
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">State</p>
                        <input type="text" value={detailsForm.billing_address.state} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, state: e.target.value } }))} placeholder="State" disabled={savingDetails} className={inputClass} />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">PIN Code</p>
                        <input type="text" value={detailsForm.billing_address.zipcode} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, zipcode: e.target.value } }))} placeholder="PIN code" disabled={savingDetails} className={inputClass} />
                      </label>
                      <label className="flex flex-col">
                        <p className="text-xs font-medium text-primary-text pb-1">Country</p>
                        <input type="text" value={detailsForm.billing_address.country} onChange={(e) => setDetailsForm(p => ({ ...p, billing_address: { ...p.billing_address, country: e.target.value } }))} placeholder="e.g. IN" disabled={savingDetails} className={inputClass} />
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => saveDetails(user)}
                    disabled={savingDetails}
                    className="self-start flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[16px]">save</span>
                    {savingDetails ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              )}

              {/* Tab Access */}
              <div className="flex flex-col gap-2">
                {TAB_GROUPS.map(group => {
                  const userAccess = editedAccess[user.email] || [];
                  const allEnabled = group.tabs.every(t => userAccess.includes(t.key));
                  const someEnabled = group.tabs.some(t => userAccess.includes(t.key));
                  return (
                    <div key={group.label} className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const keys = group.tabs.map(t => t.key);
                          if (allEnabled) {
                            setEditedAccess(prev => ({
                              ...prev,
                              [user.email]: (prev[user.email] || []).filter(k => !keys.includes(k)),
                            }));
                          } else {
                            setEditedAccess(prev => ({
                              ...prev,
                              [user.email]: [...new Set([...(prev[user.email] || []), ...keys])],
                            }));
                          }
                        }}
                        disabled={savingUser === user.email}
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          someEnabled ? 'text-indigo-700' : 'text-gray-400'
                        } ${savingUser === user.email ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="material-symbols-outlined !text-[16px]">
                          {someEnabled ? group.icon : 'lock'}
                        </span>
                        {group.label}
                      </button>
                      {group.tabs.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 ml-6">
                          {group.tabs.map(tab => {
                            const isEnabled = userAccess.includes(tab.key);
                            return (
                              <button
                                key={tab.key}
                                type="button"
                                onClick={() => toggleTab(user.email, tab.key)}
                                disabled={savingUser === user.email}
                                className={`px-2 py-1 rounded border text-[11px] font-medium transition-all ${
                                  isEnabled
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-400'
                                } ${savingUser === user.email ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-secondary-text">
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First page">
                <span className="material-symbols-outlined !text-[18px]">first_page</span>
              </button>
              <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous page">
                <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === safePage ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next page">
                <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last page">
                <span className="material-symbols-outlined !text-[18px]">last_page</span>
              </button>
            </div>
          </div>
        )}
        </>
        );
      })()}
    </div>
  );
};

export default ManageAccessTab;
