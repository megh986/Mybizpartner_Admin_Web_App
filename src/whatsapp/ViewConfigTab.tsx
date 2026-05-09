import React, { useState, useEffect } from 'react';
import { ConfigForm, EMPTY_FORM, FormFields, validateForm } from './CompanyConfigTab';

const WA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://staging.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${WA_API_BASE_URL}/image`;

interface SetupStatus {
  two_side_conversation_enabled: boolean;
  shopify_webhook_configured: boolean;
  meta_webhook_configured: boolean;
  template_created: boolean;
  whatsapp_active: boolean;
}

const DEFAULT_STATUS: SetupStatus = {
  two_side_conversation_enabled: false,
  shopify_webhook_configured: false,
  meta_webhook_configured: false,
  template_created: false,
  whatsapp_active: false,
};

const ViewConfigTab: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [lookupId, setLookupId] = useState('');
  const [form, setForm] = useState<ConfigForm | null>(null);
  const [status, setStatus] = useState<SetupStatus>(DEFAULT_STATUS);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ConfigForm | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [, setTwoSideResult] = useState<{ enabled: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [metaCopied, setMetaCopied] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryResult, setRetryResult] = useState<{ enabled: boolean; message: string } | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateResult, setActivateResult] = useState<{ success: boolean; message: string; step?: string } | null>(null);

  useEffect(() => {
    const sessionToken = localStorage.getItem('session_token');
    fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setCompanies(d.companies.map((c: { company_id: string }) => c.company_id)); })
      .catch(() => {});
  }, []);

  const handleFetch = async (id: string) => {
    if (!id.trim()) return;
    setFetchLoading(true);
    setFetchError('');
    setForm(null);
    setEditForm(null);
    setIsEditing(false);
    setSaveSuccess('');
    setSaveError('');
    setTwoSideResult(null);
    setRetryResult(null);
    setStatus(DEFAULT_STATUS);
    try {
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config?company_id=${id.trim()}`);
      const data = await res.json();
      if (data.success) {
        const loaded = { ...EMPTY_FORM, ...data.config };
        setForm(loaded);
        setEditForm(loaded);
        setStatus({
          two_side_conversation_enabled: data.config.two_side_conversation_enabled ?? false,
          shopify_webhook_configured: data.config.shopify_webhook_configured ?? false,
          meta_webhook_configured: data.config.meta_webhook_configured ?? false,
          template_created: data.config.template_created ?? false,
          whatsapp_active: data.config.whatsapp_active ?? false,
        });
      } else {
        setFetchError(data.message || 'Company not found.');
      }
    } catch {
      setFetchError('Failed to connect to server.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleEditChange = (key: keyof ConfigForm, value: string) => {
    setEditForm(prev => prev ? { ...prev, [key]: value } : prev);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    const validationError = validateForm(editForm);
    if (validationError) { setSaveError(validationError); return; }

    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess('');
    setTwoSideResult(null);
    try {
      const shopify_webhook_url = `${WA_API_BASE_URL}/shopify/webhook?company_id=${editForm.company_id.trim()}`;
      const meta_webhook_url = `${WA_API_BASE_URL}/meta/webhook`;
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, shopify_webhook_url, meta_webhook_url }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(data.message || 'Config updated successfully!');
        setForm(editForm);
        setIsEditing(false);
        if (data.two_side_conversation) {
          setTwoSideResult(data.two_side_conversation);
          setStatus(prev => ({ ...prev, two_side_conversation_enabled: data.two_side_conversation.enabled }));
        }
      } else {
        setSaveError(data.message || 'Failed to save config.');
      }
    } catch {
      setSaveError('Failed to connect to server.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm(form);
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleRetryTwoSide = async () => {
    if (!form) return;
    setRetryLoading(true);
    setRetryResult(null);
    try {
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config/retry-two-side`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: form.company_id }),
      });
      const data = await res.json();
      if (data.success && data.two_side_conversation) {
        setRetryResult(data.two_side_conversation);
        setStatus(prev => ({ ...prev, two_side_conversation_enabled: data.two_side_conversation.enabled }));
      } else {
        setRetryResult({ enabled: false, message: data.message || 'Retry failed.' });
      }
    } catch {
      setRetryResult({ enabled: false, message: 'Failed to connect to server.' });
    } finally {
      setRetryLoading(false);
    }
  };

  const handleToggleStatus = async (field: keyof Omit<SetupStatus, 'two_side_conversation_enabled'>, value: boolean) => {
    if (!form) return;
    setToggleLoading(field);
    try {
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: form.company_id, field, value }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(prev => ({ ...prev, [field]: value }));
      }
    } catch {
      // silently ignore
    } finally {
      setToggleLoading(null);
    }
  };

  const handleActivateWhatsApp = async () => {
    if (!form || !testPhone.trim()) return;
    setActivateLoading(true);
    setActivateResult(null);
    try {
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: form.company_id, test_phone: `91${testPhone.trim()}` }),
      });
      const data = await res.json();
      setActivateResult({ success: data.success, message: data.message, step: data.step });
      if (data.success) {
        setStatus(prev => ({ ...prev, whatsapp_active: true }));
        setTimeout(() => setShowActivateModal(false), 3000);
      }
    } catch {
      setActivateResult({ success: false, message: 'Failed to connect to server.' });
    } finally {
      setActivateLoading(false);
    }
  };

  const allSetupDone =
    status.two_side_conversation_enabled &&
    status.shopify_webhook_configured &&
    status.meta_webhook_configured &&
    status.template_created;

  return (
    <div className="flex flex-col gap-6">
      {/* Setup Documentation */}
      <a
        href="https://www.notion.so/Meta-app-for-whatapp-get-steps-316902d09c9480b6bcd0c458edd3d375"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4 hover:bg-indigo-100 transition-colors group"
      >
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
          <span className="material-symbols-outlined">menu_book</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-800">Setup Guide: Meta App for WhatsApp</p>
          <p className="text-xs text-indigo-600 mt-0.5 truncate">Step-by-step instructions to get your WhatsApp Business API credentials</p>
        </div>
        <span className="material-symbols-outlined text-indigo-400 group-hover:text-indigo-600 transition-colors shrink-0 !text-[20px]">open_in_new</span>
      </a>

      {/* Company selector */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <span className="material-symbols-outlined">business</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">View Company Config</h2>
            <p className="text-xs text-secondary-text mt-1">Select a company to view its configuration</p>
          </div>
        </div>
        <div className="max-w-xl">
          <select
            value={lookupId}
            onChange={e => {
              const id = e.target.value;
              setLookupId(id);
              if (id) handleFetch(id);
              else { setForm(null); setEditForm(null); setFetchError(''); setIsEditing(false); setSaveSuccess(''); setSaveError(''); setTwoSideResult(null); setRetryResult(null); setStatus(DEFAULT_STATUS); }
            }}
            disabled={fetchLoading}
            className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
          >
            <option value="">-- Select a company --</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {fetchLoading && (
            <p className="text-sm text-indigo-600 flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>
              Loading config...
            </p>
          )}
          {fetchError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined !text-[16px]">error</span>
              {fetchError}
            </p>
          )}
        </div>
      </div>

      {/* Config Display */}
      {form && editForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEditing ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <span className="material-symbols-outlined">{isEditing ? 'edit' : 'visibility'}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-text">
                  {isEditing ? 'Editing' : 'Viewing'}: <span className="text-indigo-600">{form.company_id}</span>
                </h2>
                <p className="text-xs text-secondary-text mt-0.5">
                  {isEditing ? 'Make changes and click Save to update' : 'All fields are read-only. Click Edit to make changes.'}
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(true); setSaveSuccess(''); setSaveError(''); setTwoSideResult(null); }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined !text-[18px]">edit</span>
                Edit
              </button>
            )}
          </div>

          {/* Webhook URLs (shown in read-only view) */}
          {!isEditing && (
            <div className="flex flex-col gap-3 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Shopify Webhook URL</p>
                <p className="text-xs text-amber-600 mb-2">Paste in Shopify → <strong>Settings → Notifications → Webhooks</strong> (Order fulfillment)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-amber-200 text-amber-900 text-xs font-mono px-3 py-2.5 rounded-lg break-all">
                    {`${WA_API_BASE_URL}/shopify/webhook?company_id=${form.company_id}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(`${WA_API_BASE_URL}/shopify/webhook?company_id=${form.company_id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-700 p-2.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[18px]">{copied ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Meta Webhook Callback URL</p>
                <p className="text-xs text-blue-600 mb-2">Paste in Meta Developer Console → <strong>WhatsApp → Configuration → Callback URL</strong></p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-blue-200 text-blue-900 text-xs font-mono px-3 py-2.5 rounded-lg break-all">
                    {`${WA_API_BASE_URL}/meta/webhook`}
                  </code>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(`${WA_API_BASE_URL}/meta/webhook`); setMetaCopied(true); setTimeout(() => setMetaCopied(false), 2000); }}
                    className="shrink-0 bg-blue-100 hover:bg-blue-200 text-blue-700 p-2.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined !text-[18px]">{metaCopied ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save result messages */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px]">error</span>{saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px]">check_circle</span>{saveSuccess}
            </div>
          )}

          {/* Setup Checklist (read-only view only) */}
          {!isEditing && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-indigo-600">checklist</span>
                <h3 className="text-sm font-bold text-primary-text uppercase tracking-wider">WhatsApp Setup Checklist</h3>
              </div>
              <div className="flex flex-col gap-2">

                {/* Step 1: Two-sided conversation */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${status.two_side_conversation_enabled ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined !text-[22px] ${status.two_side_conversation_enabled ? 'text-green-600' : 'text-red-500'}`}>
                      {status.two_side_conversation_enabled ? 'check_circle' : 'cancel'}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${status.two_side_conversation_enabled ? 'text-green-700' : 'text-red-700'}`}>
                        Two-sided Conversation
                      </p>
                      <p className={`text-xs ${status.two_side_conversation_enabled ? 'text-green-600' : 'text-red-600'}`}>
                        {status.two_side_conversation_enabled ? 'Auto-enabled via Meta Graph API' : 'Not enabled — click Retry to attempt again'}
                      </p>
                      {retryResult && !status.two_side_conversation_enabled && (
                        <p className="text-xs mt-1 font-medium text-red-600">
                          {retryResult.message}
                        </p>
                      )}
                    </div>
                  </div>
                  {!status.two_side_conversation_enabled && (
                    <button
                      type="button"
                      onClick={handleRetryTwoSide}
                      disabled={retryLoading}
                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0"
                    >
                      <span className={`material-symbols-outlined !text-[16px] ${retryLoading ? 'animate-spin' : ''}`}>
                        {retryLoading ? 'progress_activity' : 'refresh'}
                      </span>
                      {retryLoading ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                </div>

                {/* Step 2: Shopify webhook */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${status.shopify_webhook_configured ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined !text-[22px] ${status.shopify_webhook_configured ? 'text-green-600' : 'text-gray-400'}`}>
                      {status.shopify_webhook_configured ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${status.shopify_webhook_configured ? 'text-green-700' : 'text-gray-700'}`}>
                        Shopify Webhook Configured
                      </p>
                      <p className={`text-xs ${status.shopify_webhook_configured ? 'text-green-600' : 'text-gray-500'}`}>
                        {status.shopify_webhook_configured ? 'Webhook URL pasted in Shopify' : 'Paste the Shopify Webhook URL in Shopify → Settings → Notifications'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus('shopify_webhook_configured', !status.shopify_webhook_configured)}
                    disabled={toggleLoading === 'shopify_webhook_configured'}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${status.shopify_webhook_configured ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                  >
                    <span className={`material-symbols-outlined !text-[16px] ${toggleLoading === 'shopify_webhook_configured' ? 'animate-spin' : ''}`}>
                      {toggleLoading === 'shopify_webhook_configured' ? 'progress_activity' : status.shopify_webhook_configured ? 'undo' : 'check'}
                    </span>
                    {toggleLoading === 'shopify_webhook_configured' ? 'Updating...' : status.shopify_webhook_configured ? 'Mark Undone' : 'Mark Done'}
                  </button>
                </div>

                {/* Step 3: Meta webhook */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${status.meta_webhook_configured ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined !text-[22px] ${status.meta_webhook_configured ? 'text-green-600' : 'text-gray-400'}`}>
                      {status.meta_webhook_configured ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${status.meta_webhook_configured ? 'text-green-700' : 'text-gray-700'}`}>
                        Meta Webhook Configured
                      </p>
                      <p className={`text-xs ${status.meta_webhook_configured ? 'text-green-600' : 'text-gray-500'}`}>
                        {status.meta_webhook_configured ? 'Callback URL pasted in Meta Developer Console' : 'Paste the Meta Callback URL in Meta → WhatsApp → Configuration'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus('meta_webhook_configured', !status.meta_webhook_configured)}
                    disabled={toggleLoading === 'meta_webhook_configured'}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${status.meta_webhook_configured ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                  >
                    <span className={`material-symbols-outlined !text-[16px] ${toggleLoading === 'meta_webhook_configured' ? 'animate-spin' : ''}`}>
                      {toggleLoading === 'meta_webhook_configured' ? 'progress_activity' : status.meta_webhook_configured ? 'undo' : 'check'}
                    </span>
                    {toggleLoading === 'meta_webhook_configured' ? 'Updating...' : status.meta_webhook_configured ? 'Mark Undone' : 'Mark Done'}
                  </button>
                </div>

                {/* Step 4: Template created */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${status.template_created ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined !text-[22px] ${status.template_created ? 'text-green-600' : 'text-gray-400'}`}>
                      {status.template_created ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${status.template_created ? 'text-green-700' : 'text-gray-700'}`}>
                        WhatsApp Template Created
                      </p>
                      <p className={`text-xs ${status.template_created ? 'text-green-600' : 'text-gray-500'}`}>
                        {status.template_created ? 'Message template created and approved' : 'Create and get approval for the WhatsApp message template'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus('template_created', !status.template_created)}
                    disabled={toggleLoading === 'template_created'}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${status.template_created ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                  >
                    <span className={`material-symbols-outlined !text-[16px] ${toggleLoading === 'template_created' ? 'animate-spin' : ''}`}>
                      {toggleLoading === 'template_created' ? 'progress_activity' : status.template_created ? 'undo' : 'check'}
                    </span>
                    {toggleLoading === 'template_created' ? 'Updating...' : status.template_created ? 'Mark Undone' : 'Mark Done'}
                  </button>
                </div>

                {/* Activate WhatsApp */}
                {allSetupDone && (
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${status.whatsapp_active ? 'bg-green-50 border-green-300' : 'bg-indigo-50 border-indigo-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined !text-[22px] ${status.whatsapp_active ? 'text-green-600' : 'text-indigo-600'}`}>
                        {status.whatsapp_active ? 'verified' : 'rocket_launch'}
                      </span>
                      <div>
                        <p className={`text-sm font-bold ${status.whatsapp_active ? 'text-green-700' : 'text-indigo-700'}`}>
                          {status.whatsapp_active ? 'WhatsApp is Active' : 'Ready to Activate WhatsApp'}
                        </p>
                        <p className={`text-xs ${status.whatsapp_active ? 'text-green-600' : 'text-indigo-600'}`}>
                          {status.whatsapp_active ? 'All steps complete — WhatsApp flow is live' : 'All setup steps are complete. Click to activate.'}
                        </p>
                      </div>
                    </div>
                    {!status.whatsapp_active && (
                      <button
                        type="button"
                        onClick={() => { setShowActivateModal(true); setActivateResult(null); setTestPhone(''); }}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0 shadow-lg shadow-indigo-600/20"
                      >
                        <span className="material-symbols-outlined !text-[18px]">rocket_launch</span>
                        Activate WhatsApp
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="max-w-4xl">
            <FormFields
              form={editForm}
              loading={saveLoading}
              onChange={handleEditChange}
              readOnly={!isEditing}
              companyIdReadOnly
            />

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <span className="material-symbols-outlined !text-[20px]">save</span>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium py-3.5 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Activate WhatsApp Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <span className="material-symbols-outlined">rocket_launch</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-text">Activate WhatsApp</h3>
                <p className="text-xs text-secondary-text mt-0.5">We'll verify the template and send a test message</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-5 text-xs text-indigo-700">
              <p><strong>What happens:</strong></p>
              <ol className="list-decimal list-inside mt-1 space-y-0.5">
                <li>Check that template <strong>{form?.wa_template_name}</strong> exists and is approved</li>
                <li>Send the template to the phone number you enter below</li>
                <li>If both succeed → WhatsApp is marked Active</li>
              </ol>
            </div>

            <label className="block text-sm font-medium text-primary-text mb-1.5">
              Test Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all mb-4">
              <span className="bg-gray-50 border-r border-gray-200 px-3 py-3 text-sm text-secondary-text font-medium select-none">+91</span>
              <input
                type="tel"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                disabled={activateLoading}
                maxLength={10}
                className="flex-1 bg-background-light text-primary-text text-sm p-3 outline-none"
              />
            </div>

            {activateResult && (
              <div className={`rounded-lg p-3 mb-4 text-sm flex items-start gap-2 ${activateResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <span className="material-symbols-outlined !text-[18px] mt-0.5 shrink-0">
                  {activateResult.success ? 'check_circle' : 'error'}
                </span>
                <div>
                  <p className="font-medium">{activateResult.message}</p>
                  {activateResult.step && (
                    <p className="text-xs mt-0.5 opacity-80">
                      Failed at: {activateResult.step === 'template_check' ? 'Template verification' : 'Sending message'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleActivateWhatsApp}
                disabled={activateLoading || testPhone.trim().length !== 10}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <span className={`material-symbols-outlined !text-[18px] ${activateLoading ? 'animate-spin' : ''}`}>
                  {activateLoading ? 'progress_activity' : 'send'}
                </span>
                {activateLoading ? 'Verifying & Sending...' : 'Send Test & Activate'}
              </button>
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                disabled={activateLoading}
                className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium py-3 px-5 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewConfigTab;
