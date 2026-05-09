import React, { useState, useEffect, useCallback } from 'react';
import type {
  WomEffectivenessApiResponse,
  EngagementLadderStep,
  TimeRange,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface WomEffectivenessTabProps {
  selectedCompany: string;
  companyName: string;
}

// ── Horizontal ladder / funnel bar ───────────────────────────────────────────
const LadderBar: React.FC<{ step: EngagementLadderStep; topUsers: number; color: string }> = ({
  step,
  topUsers,
  color,
}) => {
  const pct = topUsers > 0 ? (step.users / topUsers) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 text-sm text-gray-600 text-right">{step.step}</div>
      <div className="flex-1 h-9 bg-gray-100 rounded-lg overflow-hidden relative">
        <div
          className={`h-full ${color} rounded-lg transition-all duration-700`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-sm font-bold text-gray-700">{step.users.toLocaleString()}</span>
          <span className="text-xs text-gray-500">{step.pct_of_top.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const WomEffectivenessTab: React.FC<WomEffectivenessTabProps> = ({ selectedCompany, companyName }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [data, setData] = useState<WomEffectivenessApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (recompute = false) => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const sessionToken = localStorage.getItem('session_token');
      const res = await fetch(
        `${API_BASE_URL}/analytics/wom-effectiveness/${selectedCompany}?time_range=${timeRange}${recompute ? '&recompute=true' : ''}`,
        { headers: { Authorization: `Bearer ${sessionToken}` } },
      );
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.detail || 'Failed to load WOM effectiveness data');
      }
    } catch (err) {
      setError('Error fetching data. Make sure the analytics service is running.');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="text-secondary-text text-sm">Loading effectiveness data…</p>
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

  const { exposure, conversion, engagement_ladder, wom_vs_nowom, _debug } = data as any;
  const ladderTopUsers = engagement_ladder[0]?.users || 1;
  const ladderColors = [
    'bg-gray-300', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700',
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">WOM Effectiveness</h2>
          <p className="text-sm text-gray-500">Does the widget actually drive purchases?</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === r ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {/* The headline finding — only shown when a valid multiplier exists */}
      {conversion.passive_vs_never_multiplier != null && conversion.passive_vs_never_multiplier > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-black">{conversion.passive_vs_never_multiplier}×</span>
            </div>
            <div>
              <p className="text-white/80 text-sm">Headline finding</p>
              <p className="text-xl font-bold">
                Shoppers who engaged with the widget converted {conversion.passive_vs_never_multiplier}× more often
              </p>
              <p className="text-white/70 text-sm mt-1">
                {conversion.active_rate.toFixed(1)}% active engagers vs {conversion.never_exposed_rate.toFixed(1)}% never-exposed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exposure groups */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Who Saw the Widget?</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: 'Product Visitors', value: exposure.product_visitors, icon: 'person', color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-500', desc: 'Total visitors on product pages' },
            { label: 'Saw It (Passive)', value: exposure.passive_viewers + exposure.never_exposed, icon: 'visibility', color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-500', desc: 'Viewed widget, no clicks' },
            { label: 'Engaged (Active)', value: exposure.active_engagers, icon: 'touch_app', color: 'bg-green-50 border-green-200', iconColor: 'text-green-600', desc: 'Clicked inside widget' },
          ].map((card) => (
            <div key={card.label} className={`bg-white rounded-xl border ${card.color} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center border ${card.color}`}>
                  <span className={`material-symbols-outlined !text-[20px] ${card.iconColor}`}>{card.icon}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion rates comparison */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">Conversion Rate by Exposure Group</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: 'Saw It (Passive)', rate: conversion.passive_rate, sublabel: conversion.passive_vs_never_multiplier == null ? '∞× baseline' : conversion.passive_vs_never_multiplier === 0 ? '—' : `${conversion.passive_vs_never_multiplier}× baseline`, color: 'bg-blue-50', barColor: 'bg-blue-500', textColor: 'text-blue-700' },
            { label: 'Engaged (Active)', rate: conversion.active_rate, sublabel: 'Clicked inside widget', color: 'bg-green-50', barColor: 'bg-green-500', textColor: 'text-green-700' },
          ].map((group) => {
            const max = Math.max(conversion.passive_rate, conversion.active_rate) || 1;
            return (
              <div key={group.label} className={`${group.color} rounded-xl p-5`}>
                <p className={`text-sm font-semibold ${group.textColor} mb-1`}>{group.label}</p>
                <p className="text-3xl font-black text-gray-900">{group.rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mb-3">{group.sublabel}</p>
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${group.barColor} rounded-full transition-all duration-700`}
                    style={{ width: `${(group.rate / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement ladder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">Engagement Ladder</h3>
          <p className="text-sm text-gray-500">How far active users go inside the widget</p>
        </div>
        <div className="flex flex-col gap-3">
          {(engagement_ladder as EngagementLadderStep[]).map((step, i) => (
            <LadderBar key={step.step} step={step} topUsers={ladderTopUsers} color={ladderColors[i] || 'bg-green-500'} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Widget impressions tracked: {conversion.widget_impressions.toLocaleString()}
        </p>
      </div>

      {/* WOM vs no-WOM card sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">WOM Sessions vs Non-WOM Sessions</h3>
          <p className="text-sm text-gray-500">Session conversion: sessions with any WOM interaction vs sessions on non-WOM products</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'WOM sessions', sessions: wom_vs_nowom.only_wom_sessions, rate: wom_vs_nowom.only_wom_conv_rate, color: 'bg-blue-50 border-blue-200', rateColor: 'text-blue-700' },
            { label: 'Non-WOM sessions', sessions: wom_vs_nowom.only_nowom_sessions, rate: wom_vs_nowom.only_nowom_conv_rate, color: 'bg-gray-50 border-gray-200', rateColor: 'text-gray-700' },
            { label: 'Mixed sessions', sessions: wom_vs_nowom.both_sessions, rate: wom_vs_nowom.both_conv_rate, color: 'bg-green-50 border-green-200', rateColor: 'text-green-700' },
          ].map((seg) => (
            <div key={seg.label} className={`rounded-xl border p-5 ${seg.color}`}>
              <p className="text-xs text-gray-500 mb-1">{seg.label}</p>
              <p className={`text-2xl font-bold ${seg.rateColor}`}>{seg.rate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">{seg.sessions} sessions</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 italic">
          Note: no-WOM products often have higher search intent, making direct comparison inconclusive.
        </p>
      </div>

      {/* Debug panel — only visible when conversion rates are all 0 and _debug is present */}
      {_debug && conversion.passive_rate === 0 && conversion.active_rate === 0 && conversion.never_exposed_rate === 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-yellow-600">bug_report</span>
            <h3 className="text-sm font-bold text-yellow-800">Conversion Debug Info (all rates are 0)</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-yellow-900 mb-3">
            <span>Total events fetched: <b>{_debug.total_events_fetched}</b></span>
            <span>Product visitors: <b>{_debug.prod_visitors_count}</b></span>
            <span>Passive users: <b>{_debug.passive_users_count}</b></span>
            <span>Active users: <b>{_debug.active_users_count}</b></span>
            <span>Conv users (add_to_cart / checkout): <b>{_debug.conv_users_count}</b></span>
          </div>
          <p className="text-xs font-semibold text-yellow-800 mb-1">All event types in this PostHog project:</p>
          <div className="flex flex-wrap gap-1">
            {(_debug.all_event_types as string[]).map((et: string) => (
              <span key={et} className="px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded text-xs font-mono text-yellow-900">{et}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WomEffectivenessTab;
