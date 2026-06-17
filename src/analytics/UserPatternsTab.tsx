import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserPatternsApiResponse, EngagementSegment, FunnelStep, ArchetypeAtcRate } from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface UserPatternsTabProps {
  selectedCompany: string;
  companyName: string;
}

// ── Horizontal bar for funnel / segments ─────────────────────────────────────
const HBar: React.FC<{ label: string; value: number; pct: number; maxPct: number; color: string }> = ({
  label, value, pct, maxPct, color,
}) => {
  const width = maxPct > 0 ? (pct / maxPct) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 text-sm text-gray-600 text-right">{label}</div>
      <div className="flex-1 h-9 bg-gray-100 rounded-lg overflow-hidden relative">
        <div
          className={`h-full ${color} rounded-lg transition-all duration-700`}
          style={{ width: `${Math.max(width, 1)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-sm font-bold text-gray-700">{value.toLocaleString()}</span>
          <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// ── Archetype colors (used by ATC rate table) ─────────────────────────────────
const archetypeColors: Record<string, { bg: string; text: string; icon: string }> = {
  'Reviewer':           { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: 'rate_review' },
  'Deep Explorer':      { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   icon: 'explore' },
  'Image Browser':      { bg: 'bg-cyan-50 border-cyan-200',   text: 'text-cyan-700',   icon: 'photo_library' },
  'Social Proof Seeker':{ bg: 'bg-green-50 border-green-200', text: 'text-green-700',  icon: 'thumb_up' },
  'Quick Tapper':       { bg: 'bg-orange-50 border-orange-200',text: 'text-orange-700',icon: 'touch_app' },
  'Passive':            { bg: 'bg-gray-50 border-gray-200',   text: 'text-gray-600',   icon: 'visibility' },
};

const SEGMENT_COLORS = [
  'bg-gray-300', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-700',
];

// ── Main ─────────────────────────────────────────────────────────────────────
const UserPatternsTab: React.FC<UserPatternsTabProps> = ({ selectedCompany, companyName }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');
  const [data, setData] = useState<UserPatternsApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (recompute = false) => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/analytics/user-patterns/${selectedCompany}?time_range=${timeRange}${recompute ? '&recompute=true' : ''}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.detail || 'Failed to load user pattern data');
      }
    } catch {
      setError('Error fetching data. Make sure the analytics service is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxSegPct = useMemo(() => {
    if (!data) return 1;
    return Math.max(...(data.engagement_segments || []).map((s) => s.pct), 1);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-secondary-text text-sm">Loading user patterns…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    totals, engagement_segments, funnel,
    non_engager_count = 0, non_engager_rate = 0, archetype_atc_rates = [],
  } = data as UserPatternsApiResponse & { non_engager_count?: number; non_engager_rate?: number; archetype_atc_rates?: ArchetypeAtcRate[] };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Patterns</h2>
          <p className="text-sm text-gray-500">How users behave inside the WOM widget</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === r ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            title="Recompute from PostHog"
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            <span className={`material-symbols-outlined !text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total WOM Events', value: totals.wom_events.toLocaleString(), icon: 'bar_chart', color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600' },
          { label: 'Unique Users', value: totals.users.toLocaleString(), icon: 'people', color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600' },
          { label: 'Sessions', value: totals.sessions.toLocaleString(), icon: 'layers', color: 'bg-green-50 border-green-200', iconColor: 'text-green-600' },
          { label: 'Events / User (avg)', value: totals.events_per_user_mean.toFixed(1), icon: 'person_play', color: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border ${stat.color} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center border ${stat.color}`}>
                <span className={`material-symbols-outlined !text-[20px] ${stat.iconColor}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Events-per-user distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Events-per-user distribution</h3>
          <p className="text-sm text-gray-500">How many widget interactions each user has</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Average',  value: totals.events_per_user_mean.toFixed(1), desc: 'Mean events / user',    color: 'bg-purple-50 border-purple-200', valueColor: 'text-purple-700' },
            { label: 'Median',   value: totals.events_per_user_median,           desc: '50th percentile',       color: 'bg-blue-50 border-blue-200',   valueColor: 'text-blue-700'   },
            { label: 'P90',      value: totals.events_per_user_p90,              desc: 'Top 10% of users have', color: 'bg-orange-50 border-orange-200',valueColor: 'text-orange-700' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.valueColor}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement segments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">Engagement Segments</h3>
          <p className="text-sm text-gray-500">User depth by number of WOM events</p>
        </div>
        <div className="flex flex-col gap-3">
          {engagement_segments.map((seg: EngagementSegment, i: number) => (
            <HBar
              key={seg.segment}
              label={seg.segment}
              value={seg.users}
              pct={seg.pct}
              maxPct={maxSegPct}
              color={SEGMENT_COLORS[i] || 'bg-purple-500'}
            />
          ))}
        </div>
      </div>

      {/* WOM engagement funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">WOM Engagement Funnel</h3>
          <p className="text-sm text-gray-500">How far users progress through widget interactions</p>
        </div>
        <div className="flex flex-col gap-3">
          {funnel.map((step: FunnelStep, i: number) => {
            return (
              <HBar
                key={step.step}
                label={step.step}
                value={step.users}
                pct={step.pct_of_base}
                maxPct={100}
                color={i === 0 ? 'bg-purple-300' : i < 3 ? 'bg-purple-500' : 'bg-purple-700'}
              />
            );
          })}
        </div>
      </div>

      {/* Non-Engagers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Product Page Non-Engagers</h3>
          <p className="text-sm text-gray-500">Visitors who landed on a product page but never clicked any WOM widget element</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-medium text-red-600 mb-1">Non-Engagers</p>
            <p className="text-3xl font-black text-red-700">{non_engager_count.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-medium text-orange-600 mb-1">Non-Engagement Rate</p>
            <p className="text-3xl font-black text-orange-700">{non_engager_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Archetype Add-to-Cart Rates */}
      {archetype_atc_rates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Add-to-Cart Rate by Archetype</h3>
            <p className="text-sm text-gray-500">Conversion intent per user cohort</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Archetype</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Users</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added to Cart</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ATC Rate</th>
                </tr>
              </thead>
              <tbody>
                {archetype_atc_rates.map((row: ArchetypeAtcRate) => {
                  const colors = archetypeColors[row.archetype] || archetypeColors['Passive'];
                  return (
                    <tr key={row.archetype} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text}`}>
                          <span className="material-symbols-outlined !text-[13px]">{archetypeColors[row.archetype]?.icon || 'person'}</span>
                          {row.archetype}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600">{row.users.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-medium text-gray-700">{row.atc_users.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`font-bold text-sm ${row.atc_rate > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                          {Math.min(row.atc_rate, 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPatternsTab;
