import React, { useState, useEffect, useCallback } from 'react';
import type {
  HomepageApiResponse,
  HomepageSummary,
  HomepageDailyMetrics,
  HomepageWidgetHit,
  TimeRange,
} from './types';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://api.thewordofmouth.in/api';

interface HomePageTabProps {
  selectedCompany: string;
  companyName: string;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

// Colour scale based on count relative to max
const heatColour = (count: number, max: number): string => {
  if (max === 0) return 'bg-gray-100 text-gray-400';
  const ratio = count / max;
  if (ratio >= 0.75) return 'bg-orange-500 text-white';
  if (ratio >= 0.5) return 'bg-orange-300 text-orange-900';
  if (ratio >= 0.25) return 'bg-orange-100 text-orange-800';
  if (count > 0) return 'bg-orange-50 text-orange-700';
  return 'bg-gray-50 text-gray-400';
};

const HomePageTab: React.FC<HomePageTabProps> = ({ selectedCompany, companyName }) => {
  const [data, setData] = useState<HomepageApiResponse | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_BASE_URL}/analytics/homepage/${selectedCompany}?time_range=${timeRange}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HomepageApiResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load homepage metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary: HomepageSummary = data?.summary ?? {
    total_unique_visitors: 0,
    total_hits: 0,
    total_wom_widget_hits: 0,
    avg_scroll_depth: 0,
    avg_session_duration: 0,
  };

  const widgetBreakdown: HomepageWidgetHit[] = data?.widget_breakdown ?? [];
  const maxCount = Math.max(...widgetBreakdown.map((w) => w.count), 1);

  const passiveWidgets = widgetBreakdown.filter((w) => w.widget_type === 'passive');
  const activeWidgets = widgetBreakdown.filter((w) => w.widget_type === 'active');

  const summaryCards = [
    { label: 'Unique Visitors', value: formatNumber(summary.total_unique_visitors), color: 'blue', icon: 'person' },
    { label: 'Total Hits', value: formatNumber(summary.total_hits), color: 'indigo', icon: 'visibility' },
    { label: 'WOM Widget Hits', value: formatNumber(summary.total_wom_widget_hits), color: 'orange', icon: 'touch_app' },
    { label: 'Avg Scroll Depth', value: `${summary.avg_scroll_depth.toFixed(1)}%`, color: 'green', icon: 'vertical_align_bottom' },
    { label: 'Avg Session', value: `${summary.avg_session_duration.toFixed(1)}s`, color: 'purple', icon: 'timer' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-primary-text">Homepage Metrics</h2>
          <p className="text-xs text-secondary-text mt-0.5">
            {companyName ? `${companyName} — ` : ''}visitor traffic and WOM widget engagement on the homepage
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as TimeRange[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === t
                  ? 'bg-primary text-white'
                  : 'bg-background-light text-secondary-text hover:bg-gray-200'
              }`}
            >
              {t === '7d' ? '7 Days' : t === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[card.color]}`}>
              <span className="material-symbols-outlined !text-[18px]">{card.icon}</span>
            </div>
            <p className="text-xs text-secondary-text font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-primary-text mt-1">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Table */}
      {data && data.daily_metrics.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-primary-text mb-4">Daily Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'Unique Visitors', 'Total Hits', 'WOM Widget Hits', 'Scroll Depth', 'Session (s)'].map((h) => (
                    <th key={h} className="px-3 py-2 text-xs font-semibold text-secondary-text uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.daily_metrics.map((row: HomepageDailyMetrics) => (
                  <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-xs text-secondary-text">{row.date}</td>
                    <td className="px-3 py-2 font-medium text-primary-text">{formatNumber(row.unique_visitors)}</td>
                    <td className="px-3 py-2 text-secondary-text">{formatNumber(row.total_hits)}</td>
                    <td className="px-3 py-2 text-orange-700 font-medium">{formatNumber(row.wom_widget_hits)}</td>
                    <td className="px-3 py-2 text-secondary-text">{row.avg_scroll_depth.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-secondary-text">{row.avg_session_duration.toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WOM Widget Heatmap */}
      {widgetBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-primary-text">WOM Widget Hits — Heatmap</h3>
            <span className="text-xs text-secondary-text">(higher count = darker colour)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passive */}
            <div>
              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">
                Passive (section viewed)
              </p>
              <div className="space-y-2">
                {passiveWidgets.map((w) => (
                  <div key={w.event_name} className="flex items-center gap-3">
                    <div
                      className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${heatColour(w.count, maxCount)}`}
                    >
                      <span className="truncate pr-2">{w.event_name.replace(/^wom_|_viewed_home$/g, '').replace(/_/g, ' ')}</span>
                      <span className="font-bold shrink-0">{formatNumber(w.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active */}
            <div>
              <p className="text-xs font-semibold text-secondary-text uppercase tracking-wider mb-3">
                Active (clicked)
              </p>
              <div className="space-y-2">
                {activeWidgets.map((w) => (
                  <div key={w.event_name} className="flex items-center gap-3">
                    <div
                      className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-between text-xs font-medium transition-colors ${heatColour(w.count, maxCount)}`}
                    >
                      <span className="truncate pr-2">{w.event_name.replace(/^wom_|_clicked_home$/g, '').replace(/_/g, ' ')}</span>
                      <span className="font-bold shrink-0">{formatNumber(w.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-secondary-text">Low</span>
            {['bg-orange-50', 'bg-orange-100', 'bg-orange-300', 'bg-orange-500'].map((c) => (
              <div key={c} className={`w-6 h-4 rounded ${c}`} />
            ))}
            <span className="text-xs text-secondary-text">High</span>
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-12 text-secondary-text text-sm">Select a company to view homepage metrics.</div>
      )}
    </div>
  );
};

export default HomePageTab;
