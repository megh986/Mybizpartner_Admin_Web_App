import React, { useState, useEffect } from 'react';

const WA_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://staging.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${WA_API_BASE_URL}/image`;

export interface ConfigForm {
  company_id: string;
  wa_token: string;
  wa_phone_number_id: string;
  wa_verify_token: string;
  wa_app_secret: string;
  wa_waba_id: string;
  wa_api_version: string;
  wa_template_name: string;
  wa_template_language_code: string;
  shopify_store_domain: string;
  shopify_access_token: string;
}

export const EMPTY_FORM: ConfigForm = {
  company_id: '',
  wa_token: '',
  wa_phone_number_id: '',
  wa_verify_token: '',
  wa_app_secret: '',
  wa_waba_id: '',
  wa_api_version: 'v20.0',
  wa_template_name: 'wom_review_simple_v1',
  wa_template_language_code: 'en',
  shopify_store_domain: '',
  shopify_access_token: '',
};

const REQUIRED_FIELDS: { key: keyof ConfigForm; label: string }[] = [
  { key: 'company_id', label: 'Company ID' },
  { key: 'wa_token', label: 'WA Token' },
  { key: 'wa_phone_number_id', label: 'Phone Number ID' },
  { key: 'wa_waba_id', label: 'WABA ID' },
  { key: 'wa_app_secret', label: 'App Secret' },
  { key: 'wa_verify_token', label: 'Verify Token' },
  { key: 'wa_api_version', label: 'API Version' },
  { key: 'wa_template_name', label: 'Template Name' },
  { key: 'wa_template_language_code', label: 'Template Language Code' },
  { key: 'shopify_store_domain', label: 'Store Domain' },
  { key: 'shopify_access_token', label: 'Access Token' },
];

export function validateForm(form: ConfigForm): string | null {
  for (const { key, label } of REQUIRED_FIELDS) {
    if (!form[key].trim()) return `${label} is required.`;
  }
  return null;
}

interface FieldProps {
  label: string;
  fieldKey: keyof ConfigForm;
  placeholder?: string;
  hint?: string;
  secret?: boolean;
  readOnly?: boolean;
  form: ConfigForm;
  loading: boolean;
  onChange: (key: keyof ConfigForm, value: string) => void;
}

export const Field: React.FC<FieldProps> = ({ label, fieldKey, placeholder, hint, secret, readOnly, form, loading, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col">
      <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
        {label} <span className="text-red-500">*</span>
      </p>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={form[fieldKey]}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder={placeholder || ''}
          disabled={loading || readOnly}
          className={`w-full border text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all font-mono text-sm pr-10 ${readOnly ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-background-light border-gray-200'}`}
        />
        {secret && !readOnly && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined !text-[20px]">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-secondary-text mt-1">{hint}</p>}
    </label>
  );
};

export const FormFields: React.FC<{ form: ConfigForm; loading: boolean; onChange: (k: keyof ConfigForm, v: string) => void; readOnly?: boolean; companyIdReadOnly?: boolean; companies?: string[] }> = ({
  form, loading, onChange, readOnly, companyIdReadOnly, companies
}) => {
  const f = { form, loading, onChange };
  const companyIsReadOnly = readOnly || companyIdReadOnly;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Company</p>
        <div className="grid grid-cols-2 gap-4">
          {companies && !companyIsReadOnly ? (
            <label className="flex flex-col">
              <p className="text-primary-text text-sm font-semibold leading-normal pb-2">
                Company ID <span className="text-red-500">*</span>
              </p>
              <select
                value={form.company_id}
                onChange={e => onChange('company_id', e.target.value)}
                disabled={loading}
                className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 p-3.5 outline-none transition-all"
              >
                <option value="">-- Select a company --</option>
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs text-secondary-text mt-1">Unique slug for this company</p>
            </label>
          ) : (
            <Field {...f} label="Company ID" fieldKey="company_id" placeholder="e.g. arezou1" hint="Unique slug for this company" readOnly={companyIsReadOnly} />
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">WhatsApp Business API</p>
        <div className="grid grid-cols-2 gap-4">
          <Field {...f} label="WA Token" fieldKey="wa_token" placeholder="EAAThvX..." secret readOnly={readOnly} />
          <Field {...f} label="Phone Number ID" fieldKey="wa_phone_number_id" placeholder="396503210206909" readOnly={readOnly} />
          <Field {...f} label="WABA ID" fieldKey="wa_waba_id" placeholder="358707160666406" readOnly={readOnly} />
          <Field {...f} label="App Secret" fieldKey="wa_app_secret" placeholder="2f9716a6..." secret readOnly={readOnly} />
          <Field {...f} label="Verify Token" fieldKey="wa_verify_token" placeholder="wom_whatsapp_verify_2025" readOnly={readOnly} />
          <Field {...f} label="API Version" fieldKey="wa_api_version" placeholder="v20.0" readOnly={readOnly} />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Message Template</p>
        <div className="grid grid-cols-2 gap-4">
          <Field {...f} label="Template Name" fieldKey="wa_template_name" placeholder="wom_review_simple_v1" readOnly={readOnly} />
          <Field {...f} label="Template Language Code" fieldKey="wa_template_language_code" placeholder="en" readOnly={readOnly} />
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Shopify</p>
        <div className="grid grid-cols-2 gap-4">
          <Field {...f} label="Store Domain" fieldKey="shopify_store_domain" placeholder="wordofmoutth.myshopify.com" readOnly={readOnly} />
          <Field {...f} label="Access Token" fieldKey="shopify_access_token" placeholder="b875a53..." secret readOnly={readOnly} />
        </div>
      </div>
    </div>
  );
};

// ── Create Config Tab ────────────────────────────────────────────────────────
const CompanyConfigTab: React.FC = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [form, setForm] = useState<ConfigForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [savedCompanyId, setSavedCompanyId] = useState('');
  const [copied, setCopied] = useState(false);
  const [metaCopied, setMetaCopied] = useState(false);
  const [twoSideResult, setTwoSideResult] = useState<{ enabled: boolean; message: string } | null>(null);

  useEffect(() => {
    const sessionToken = localStorage.getItem('session_token');
    fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setCompanies(d.companies.map((c: { company_id: string }) => c.company_id)); })
      .catch(() => {});
  }, []);

  const handleChange = (key: keyof ConfigForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    setTwoSideResult(null);
    try {
      const shopify_webhook_url = `${WA_API_BASE_URL}/shopify/webhook?company_id=${form.company_id.trim()}`;
      const meta_webhook_url = `${WA_API_BASE_URL}/meta/webhook`;
      const res = await fetch(`${WA_API_BASE_URL}/whatsapp/company-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, shopify_webhook_url, meta_webhook_url }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Config created successfully!');
        setSavedCompanyId(form.company_id.trim());
        if (data.two_side_conversation) setTwoSideResult(data.two_side_conversation);
      } else {
        setError(data.message || 'Failed to save config.');
      }
    } catch {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <span className="material-symbols-outlined">add_circle</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">Create Company Config</h2>
            <p className="text-xs text-secondary-text mt-1">Register a new company's WhatsApp + Shopify configuration</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">error</span>{error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex flex-col gap-3">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px]">check_circle</span>{success}
            </div>
            {savedCompanyId && (
              <>
                {/* Shopify Webhook URL */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Shopify Webhook URL</p>
                  <p className="text-xs text-amber-600 mb-3">Paste in Shopify → <strong>Settings → Notifications → Webhooks</strong> (Order fulfillment)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-amber-200 text-amber-900 text-xs font-mono px-3 py-2.5 rounded-lg break-all">
                      {`${WA_API_BASE_URL}/shopify/webhook?company_id=${savedCompanyId}`}
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(`${WA_API_BASE_URL}/shopify/webhook?company_id=${savedCompanyId}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-700 p-2.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined !text-[18px]">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                </div>
                {/* Meta Webhook URL */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Meta Webhook Callback URL</p>
                  <p className="text-xs text-blue-600 mb-3">Paste in Meta Developer Console → <strong>WhatsApp → Configuration → Callback URL</strong></p>
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
              </>
            )}
            {twoSideResult && (
              <div className={`rounded-lg p-4 flex items-start gap-3 ${twoSideResult.enabled ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <span className={`material-symbols-outlined !text-[22px] mt-0.5 shrink-0 ${twoSideResult.enabled ? 'text-green-600' : 'text-red-500'}`}>
                  {twoSideResult.enabled ? 'wifi_calling_3' : 'error'}
                </span>
                <div>
                  <p className={`text-sm font-bold ${twoSideResult.enabled ? 'text-green-700' : 'text-red-700'}`}>
                    Two-sided Conversation: {twoSideResult.enabled ? 'Enabled' : 'Not Enabled'}
                  </p>
                  <p className={`text-xs mt-0.5 ${twoSideResult.enabled ? 'text-green-600' : 'text-red-600'}`}>{twoSideResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <FormFields form={form} loading={loading} onChange={handleChange} companies={companies} />
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <span className="material-symbols-outlined !text-[20px]">save</span>
            {loading ? 'Creating...' : 'Create Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyConfigTab;
