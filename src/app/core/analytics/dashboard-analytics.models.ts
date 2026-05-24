export interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
}

export interface DirectoryAnalytics {
  listingCount: number;
  aiSummaryCount: number;
  seoDescriptionCount: number;
  aiCoverage: number;
  seoReadiness: number;
  categoryCount: number;
  averageTags: string;
  categoryMetrics: CategoryMetric[];
}
