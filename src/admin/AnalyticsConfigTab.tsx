import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';
const IMAGE_API_BASE_URL = `${API_BASE_URL}/image`;
const ANALYTICS_API_BASE_URL = `${API_BASE_URL}/analytics`;

interface Company {
  _id: string;
  name: string;
  company_id: string;
}

interface AnalyticsConfig {
  company_id: string;
  posthog_api_key: string;
  posthog_project_id: string;
  posthog_host: string;
  enabled_formulas: string[];
  created_at?: string;
  updated_at?: string;
}

// ── All available formula types ───────────────────────────────────────────────
const FORMULA_OPTIONS = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Daily page views, unique visits, review interactions, add-to-cart, checkout, and live visitor snapshot.',
    icon: 'bar_chart',
    color: 'blue',
  },
  {
    key: 'wom_effectiveness',
    label: 'WOM Effectiveness',
    description: 'Measures widget impact on purchases — passive vs active exposure, conversion rates, engagement ladder, and WOM vs no-WOM card comparison.',
    icon: 'trending_up',
    color: 'green',
  },
  {
    key: 'user_patterns',
    label: 'User Patterns',
    description: 'Per-user behaviour: engagement segments, archetypes (Quick Tapper, Image Browser, Deep Explorer, Reviewer), funnel, and top power users.',
    icon: 'group',
    color: 'purple',
  },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
};

const AnalyticsConfigTab: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [configs, setConfigs] = useState<AnalyticsConfig[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [posthogApiKey, setPosthogApiKey] = useState('');
  const [posthogProjectId, setPosthogProjectId] = useState('');
  const [posthogHost, setPosthogHost] = useState('https://app.posthog.com');
  const [enabledFormulas, setEnabledFormulas] = useState<string[]>(['overview']);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(`${IMAGE_API_BASE_URL}/all-companies`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const data = await res.json();
      if (data.success) setCompanies(data.companies ?? []);
    } catch (err) {
      console.error('Failed to fetch companies', err);
    }
  }, []);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ANALYTICS_API_BASE_URL}/companies`);
      const data = await res.json();
      if (data.success) setConfigs(data.companies ?? []);
    } catch (err) {
      console.error('Failed to fetch analytics configs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchConfigs();
  }, [fetchCompanies, fetchConfigs]);

  // Pre-fill form when an already-configured company is selected
  useEffect(() => {
    if (!selectedCompanyId) {
      setPosthogApiKey('');
      setPosthogProjectId('');
      setPosthogHost('https://app.posthog.com');
      setEnabledFormulas(['overview']);
      return;
    }
    const existing = configs.find((c) => c.company_id === selectedCompanyId);
    if (existing) {
      setPosthogApiKey(existing.posthog_api_key);
      setPosthogProjectId(existing.posthog_project_id);
      setPosthogHost(existing.posthog_host || 'https://app.posthog.com');
      setEnabledFormulas(existing.enabled_formulas?.length ? existing.enabled_formulas : ['overview']);
    } else {
      setPosthogApiKey('');
      setPosthogProjectId('');
      setPosthogHost('https://app.posthog.com');
      setEnabledFormulas(['overview']);
    }
  }, [selectedCompanyId, configs]);

  const toggleFormula = (key: string) => {
    setEnabledFormulas((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (enabledFormulas.length === 0) {
      setError('At least one analytics formula must be enabled.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${ANALYTICS_API_BASE_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompanyId,
          posthog_api_key: posthogApiKey,
          posthog_project_id: posthogProjectId,
          posthog_host: posthogHost,
          enabled_formulas: enabledFormulas,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Config saved for "${selectedCompanyId}"`);
        fetchConfigs();
      } else {
        setError(data.detail || 'Failed to save config');
      }
    } catch (err) {
      setError('Error connecting to analytics service. Make sure it is running on port 8002.');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = configs.some((c) => c.company_id === selectedCompanyId);

  return (
    <div className="flex flex-col gap-6">
      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-text">Analytics PostHog Config</h2>
            <p className="text-xs text-secondary-text mt-1">
              Each company uses its own PostHog project. Set credentials and choose which analytics
              formulas are enabled for this company.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Company Select */}
          <label className="flex flex-col gap-1.5">
            <p className="text-primary-text text-sm font-semibold">Company *</p>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              required
              disabled={saving}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 p-3.5 outline-none transition-all"
            >
              <option value="">Select a company…</option>
              {companies.map((c) => (
                <option key={c._id} value={c.company_id}>
                  {c.company_id}{c.name ? ` — ${c.name}` : ''}
                </option>
              ))}
            </select>
            {selectedCompanyId && isEditing && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <span className="material-symbols-outlined !text-[14px]">edit</span>
                Updating existing config
              </p>
            )}
          </label>

          {/* PostHog API Key */}
          <label className="flex flex-col gap-1.5">
            <p className="text-primary-text text-sm font-semibold">PostHog API Key *</p>
            <input
              type="text"
              value={posthogApiKey}
              onChange={(e) => setPosthogApiKey(e.target.value)}
              placeholder="phx_xxxxxxxxxxxxxxxx"
              required
              disabled={saving}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 p-3.5 outline-none transition-all font-mono text-sm"
            />
            <p className="text-xs text-secondary-text">
              Personal API key from PostHog → Settings → Personal API Keys
            </p>
          </label>

          {/* PostHog Project ID */}
          <label className="flex flex-col gap-1.5">
            <p className="text-primary-text text-sm font-semibold">PostHog Project ID *</p>
            <input
              type="text"
              value={posthogProjectId}
              onChange={(e) => setPosthogProjectId(e.target.value)}
              placeholder="12345"
              required
              disabled={saving}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 p-3.5 outline-none transition-all"
            />
            <p className="text-xs text-secondary-text">
              Found in PostHog → Project Settings → Project ID
            </p>
          </label>

          {/* PostHog Host */}
          <label className="flex flex-col gap-1.5">
            <p className="text-primary-text text-sm font-semibold">PostHog Host</p>
            <input
              type="text"
              value={posthogHost}
              onChange={(e) => setPosthogHost(e.target.value)}
              disabled={saving}
              className="w-full bg-background-light border border-gray-200 text-primary-text text-base rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 p-3.5 outline-none transition-all"
            />
            <p className="text-xs text-secondary-text">
              Use <code className="bg-gray-100 px-1 rounded">https://eu.posthog.com</code> for EU cloud
            </p>
          </label>

          {/* Enabled Formulas */}
          <div className="flex flex-col gap-2">
            <p className="text-primary-text text-sm font-semibold">Enabled Analytics Formulas *</p>
            <p className="text-xs text-secondary-text -mt-1">
              Choose which analytics computations run for this company.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {FORMULA_OPTIONS.map((opt) => {
                const active = enabledFormulas.includes(opt.key);
                const c = COLOR_MAP[opt.color];
                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={saving}
                    onClick={() => toggleFormula(opt.key)}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border-2 text-left transition-all ${
                      active
                        ? `${c.bg} ${c.border}`
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                        active ? `${c.text} border-current bg-white` : 'border-gray-300 bg-white'
                      }`}
                    >
                      {active && (
                        <span className="material-symbols-outlined !text-[12px] font-bold">check</span>
                      )}
                    </div>

                    {/* Icon + text */}
                    <div className={`p-1 rounded ${active ? c.bg : 'bg-gray-100'}`}>
                      <span className={`material-symbols-outlined !text-[18px] ${active ? c.text : 'text-gray-400'}`}>
                        {opt.icon}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className={`text-sm font-semibold ${active ? 'text-primary-text' : 'text-secondary-text'}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-secondary-text leading-snug">
                        {opt.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {enabledFormulas.length === 0 && (
              <p className="text-xs text-red-500 mt-1">At least one formula must be selected.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !selectedCompanyId || !posthogApiKey || !posthogProjectId || enabledFormulas.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 mt-2"
          >
            <span className="material-symbols-outlined !text-[20px]">save</span>
            {saving ? 'Saving…' : isEditing ? 'Update Config' : 'Save Config'}
          </button>
        </form>
      </div>

      {/* Registered Companies Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <span className="material-symbols-outlined">table_chart</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-text">Registered Companies</h2>
              <p className="text-xs text-secondary-text mt-0.5">
                {configs.length} {configs.length === 1 ? 'company' : 'companies'} with PostHog config
              </p>
            </div>
          </div>
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-secondary-text hover:text-primary-text rounded-lg transition-colors text-sm font-medium"
          >
            <span className={`material-symbols-outlined !text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh
          </button>
        </div>

        {loading && configs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">analytics</span>
            <p className="text-secondary-text text-sm">No companies configured yet.</p>
            <p className="text-secondary-text text-xs mt-1">Use the form above to add a company's PostHog config.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    Company ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    Project ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    Enabled Formulas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {configs.map((cfg) => (
                  <tr
                    key={cfg.company_id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCompanyId(cfg.company_id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-primary-text">{cfg.company_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-primary-text font-mono">{cfg.posthog_project_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-secondary-text truncate max-w-[180px] block">
                        {cfg.posthog_host}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-secondary-text">
                        {cfg.posthog_api_key.slice(0, 10)}••••••••
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(cfg.enabled_formulas ?? ['overview']).map((f) => {
                          const opt = FORMULA_OPTIONS.find((o) => o.key === f);
                          const c = COLOR_MAP[opt?.color ?? 'blue'];
                          return (
                            <span
                              key={f}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}
                            >
                              <span className="material-symbols-outlined !text-[11px]">{opt?.icon ?? 'analytics'}</span>
                              {opt?.label ?? f}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-secondary-text">
                        {cfg.updated_at
                          ? new Date(cfg.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsConfigTab;
