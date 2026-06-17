import React, { useState, useEffect, useRef } from 'react';

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
    <label className="flex flex-col w-full">
      <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-normal pb-1">
        {label} <span className="text-red-500">*</span>
      </span>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={form[fieldKey]}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder={placeholder || ''}
          disabled={loading || readOnly}
          className={`w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono pr-10 ${readOnly ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-80' : ''}`}
        />
        {secret && !readOnly && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
          >
            <span className="material-symbols-outlined !text-[16px]">{show ? 'visibility_off' : 'visibility'}</span>
          </button>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </label>
  );
};

const CustomCompanyDropdown: React.FC<{
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled: boolean;
}> = ({ value, options, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all flex justify-between items-center"
      >
        <span className="truncate">{value || '-- Select a company --'}</span>
        <span className="material-symbols-outlined !text-[16px] text-slate-400">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            -- Select a company --
          </button>
          {options.map(c => (
            <button
              key={c}
              type="button"
              className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${value === c ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const FormFields: React.FC<{ form: ConfigForm; loading: boolean; onChange: (k: keyof ConfigForm, v: string) => void; readOnly?: boolean; companyIdReadOnly?: boolean; companies?: string[] }> = ({
  form, loading, onChange, readOnly, companyIdReadOnly, companies
}) => {
  const f = { form, loading, onChange };
  const companyIsReadOnly = readOnly || companyIdReadOnly;
  return (
    <div className="flex flex-col gap-4">
      {/* Group 1: Company & Message Template (3 cols) */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3.5">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5"><span className="material-symbols-outlined !text-[14px] text-indigo-500">business</span> Core Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {companies && !companyIsReadOnly ? (
            <label className="flex flex-col w-full">
              <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-normal pb-1">
                Company ID <span className="text-red-500">*</span>
              </span>
              <CustomCompanyDropdown
                value={form.company_id}
                options={companies}
                onChange={(val) => onChange('company_id', val)}
                disabled={loading}
              />
            </label>
          ) : (
            <Field {...f} label="Company ID" fieldKey="company_id" placeholder="e.g. arezou1" readOnly={companyIsReadOnly} />
          )}
          <Field {...f} label="Template Name" fieldKey="wa_template_name" placeholder="wom_review_simple_v1" readOnly={readOnly} />
          <Field {...f} label="Template Language Code" fieldKey="wa_template_language_code" placeholder="en" readOnly={readOnly} />
        </div>
      </div>

      {/* Group 2: WhatsApp API (3 cols) */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3.5">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5"><span className="material-symbols-outlined !text-[14px] text-indigo-500">api</span> WhatsApp API Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field {...f} label="Phone Number ID" fieldKey="wa_phone_number_id" placeholder="396503210206909" readOnly={readOnly} />
          <Field {...f} label="WABA ID" fieldKey="wa_waba_id" placeholder="358707160666406" readOnly={readOnly} />
          <Field {...f} label="API Version" fieldKey="wa_api_version" placeholder="v20.0" readOnly={readOnly} />
          
          <Field {...f} label="WA Token" fieldKey="wa_token" placeholder="EAAThvX..." secret readOnly={readOnly} />
          <Field {...f} label="App Secret" fieldKey="wa_app_secret" placeholder="2f9716a6..." secret readOnly={readOnly} />
          <Field {...f} label="Verify Token" fieldKey="wa_verify_token" placeholder="wom_whatsapp_verify_2025" readOnly={readOnly} />
        </div>
      </div>

      {/* Group 3: Shopify (2 cols) */}
      <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3.5">
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5"><span className="material-symbols-outlined !text-[14px] text-indigo-500">storefront</span> Shopify Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-3 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md shadow-sm">
            <span className="material-symbols-outlined !text-[16px]">add_circle</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">Create Company Config</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Register a new company's WhatsApp + Shopify configuration</p>
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
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs"
          >
            <span className="material-symbols-outlined !text-[16px]">save</span>
            {loading ? 'Creating...' : 'Create Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyConfigTab;
