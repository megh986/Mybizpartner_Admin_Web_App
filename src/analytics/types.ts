// Analytics Types

export interface DailyMetrics {
  date: string;
  page_views: number;
  unique_visits: number;
  review_interactions: number;
  more_review_clicks: number;
  instagram_visits: number;
  add_to_cart_after_review: number;
  checkout_clicks: number;
  avg_session_duration: number;
  // NorthStar KPI daily fields
  add_to_cart_users: number;
  purchase_count: number;
  revenue: number;
  macro_conversion_rate: number;
}

export interface LiveMetrics {
  current_visitors: number;
  active_on_review_page: number;
  recent_page_views: number;
}

export interface ProductReview {
  product_id: string;
  product_name: string;
  reviews_today: number;
  total_reviews: number;
  daily_average: number;
  star_breakdown?: Record<string, number>;
  source_breakdown?: Record<string, number>;
  real_review_count?: number;
}

export interface AnalyticsSummary {
  total_page_views: number;
  total_unique_visits: number;
  review_interaction_rate: number;
  avg_more_review_clicks: number;
  total_instagram_visits: number;
  add_to_cart_conversion_rate: number;
  checkout_click_rate: number;
  // NorthStar KPIs
  macro_conversion_rate: number;
  rpv: number;
  aov: number;
  cart_abandonment_rate: number;
  total_revenue: number;
  purchase_count: number;
  has_purchase_data: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export type TimeRange = '7d' | '14d' | '30d';

// API response shapes

export interface OverviewApiResponse {
  success: boolean;
  company_id: string;
  time_range: string;
  daily_metrics: DailyMetrics[];
  summary: AnalyticsSummary | null;
  live: LiveMetrics | null;
  computed_at: string | null;
}

export interface ProductReviewsApiResponse {
  success: boolean;
  company_id: string;
  products: ProductReview[];
  computed_at: string | null;
}

export interface DailyReviewBreakdown {
  date: string;
  reviews: number;
}

export interface ProductDailyBreakdownApiResponse {
  success: boolean;
  company_id: string;
  product_id: string;
  daily_breakdown: DailyReviewBreakdown[];
}

// ── WOM Effectiveness ─────────────────────────────────

export interface WomExposure {
  product_visitors: number;
  passive_viewers: number;
  active_engagers: number;
  never_exposed: number;
}

export interface WomConversion {
  passive_rate: number;
  active_rate: number;
  never_exposed_rate: number;
  passive_vs_never_multiplier: number;
  widget_impressions: number;
}

export interface EngagementLadderStep {
  step: string;
  users: number;
  pct_of_top: number;
}

export interface WomVsNowom {
  only_wom_sessions: number;
  only_wom_conv_rate: number;
  only_nowom_sessions: number;
  only_nowom_conv_rate: number;
  both_sessions: number;
  both_conv_rate: number;
}

export interface WomEffectivenessApiResponse {
  success: boolean;
  company_id: string;
  time_range: string;
  exposure: WomExposure;
  conversion: WomConversion;
  engagement_ladder: EngagementLadderStep[];
  wom_vs_nowom: WomVsNowom;
}

// ── Product Comparison ────────────────────────────────

export interface ProductPerfMetrics {
  product_handle: string;
  product_name: string;
  visitors: number;
  conv_rate: number;
  avg_time_ms: number;
  engagement_rate: number;
}

export interface ProductComparisonSummary {
  wom_product_count: number;
  non_wom_product_count: number;
  avg_wom_conv_rate: number;
  avg_non_wom_conv_rate: number;
  uplift_multiplier: number | null;
  avg_wom_time_ms: number;
  avg_non_wom_time_ms: number;
}

export interface ProductComparisonApiResponse {
  success: boolean;
  company_id: string;
  time_range: string;
  wom_products: ProductPerfMetrics[];
  non_wom_products: ProductPerfMetrics[];
  summary: ProductComparisonSummary;
}

// ── User Patterns ─────────────────────────────────────

export interface UserPatternTotals {
  wom_events: number;
  users: number;
  sessions: number;
  events_per_user_mean: number;
  events_per_user_median: number;
  events_per_user_p90: number;
}

export interface EngagementSegment {
  segment: string;
  users: number;
  pct: number;
}

export interface UserArchetype {
  archetype: string;
  users: number;
  pct: number;
  description: string;
}

export interface FunnelStep {
  step: string;
  users: number;
  pct_of_base: number;
}

export interface PowerUser {
  user_id: string;
  total_events: number;
}

export interface UserPatternsApiResponse {
  success: boolean;
  company_id: string;
  time_range: string;
  totals: UserPatternTotals;
  engagement_segments: EngagementSegment[];
  archetypes: UserArchetype[];
  funnel: FunnelStep[];
  power_users_top10: PowerUser[];
  non_engager_count: number;
  non_engager_rate: number;
  archetype_atc_rates: ArchetypeAtcRate[];
}

// ── Archetype ATC Rate ─────────────────────────────────

export interface ArchetypeAtcRate {
  archetype: string;
  users: number;
  atc_users: number;
  atc_rate: number;
}

// ── Homepage ───────────────────────────────────────────

export interface HomepageDailyMetrics {
  date: string;
  unique_visitors: number;
  total_hits: number;
  wom_widget_hits: number;
  avg_scroll_depth: number;
  avg_session_duration: number;
}

export interface HomepageWidgetHit {
  event_name: string;
  count: number;
  widget_type: 'passive' | 'active';
}

export interface HomepageSummary {
  total_unique_visitors: number;
  total_hits: number;
  total_wom_widget_hits: number;
  avg_scroll_depth: number;
  avg_session_duration: number;
}

export interface HomepageApiResponse {
  success: boolean;
  company_id: string;
  time_range: string;
  daily_metrics: HomepageDailyMetrics[];
  summary: HomepageSummary | null;
  widget_breakdown: HomepageWidgetHit[];
  computed_at: string | null;
}

// ── Product Review Metrics ─────────────────────────────

export interface ReviewSourceTypeStat {
  count: number;
  avg_rating: number;
}

export interface ProductReviewMetricsPerProduct {
  product_id: string;
  product_name: string;
  total: number;
  real_review_count: number;
  real_image_count: number;
  real_image_star_breakdown: Record<string, number>;
  with_images: number;
  wom_image_star_breakdown: Record<string, number>;
  generated: number;
  actual_customer: number;
  marketplace: number;
  untagged: number;
  source_breakdown: Record<string, number>;
  wom_source_breakdown: Record<string, number>;
  real_source_breakdown: Record<string, number>;
  avg_rating: number;
  overall_rating: number;
  daily_added: number;
  real_daily_added: number;
  wom_daily_added: number;
  star_breakdown: Record<string, number>;
}

export interface ProductReviewMetricsApiResponse {
  success: boolean;
  company_id: string;
  total_reviews: number;
  products_under_review: number;
  reviews_with_images: number;
  by_source_type: {
    generated: ReviewSourceTypeStat;
    actual_customer: ReviewSourceTypeStat;
    marketplace: ReviewSourceTypeStat;
    untagged: ReviewSourceTypeStat;
  };
  per_product: ProductReviewMetricsPerProduct[];
}
