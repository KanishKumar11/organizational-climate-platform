import {
  IReport,
  IReportFilters,
  IReportConfig,
  ReportType,
  ReportFormat,
} from '@/models/Report';
import { ISurvey } from '@/models/Survey';
import { IResponse } from '@/models/Response';
import { IAnalyticsInsight, IAIInsight } from '@/models/Analytics';
import { IBenchmark } from '@/models/Benchmark';
import { IUser } from '@/models/User';

// Report data interfaces
export interface IReportData {
  surveys: ISurvey[];
  responses: IResponse[];
  analytics: IAnalyticsInsight[];
  ai_insights: IAIInsight[];
  benchmarks?: IBenchmark[];
  users?: IUser[];
  metadata: IReportMetadata;
}

export interface IReportMetadata {
  generation_date: Date;
  total_responses: number;
  date_range: {
    start: Date;
    end: Date;
  };
  filters_applied: IReportFilters;
  company_name?: string;
  department_names?: string[];
}

// Chart data interfaces
export interface IChartData {
  type: 'bar' | 'line' | 'pie' | 'heatmap' | 'scatter';
  title: string;
  data: any[];
  labels?: string[];
  colors?: string[];
}

// Report generation service
export class ReportService {
  /**
   * Generate comprehensive report data with advanced filtering and comparative analysis
   */
  static async generateReportData(
    filters: IReportFilters,
    config: IReportConfig,
    companyId: string
  ): Promise<IReportData> {
    const Survey = (await import('@/models/Survey')).default;
    const Response = (await import('@/models/Response')).default;
    const { AnalyticsInsight, AIInsight } = await import('@/models/Analytics');
    const Benchmark = (await import('@/models/Benchmark')).default;
    const User = (await import('@/models/User')).default;

    // Build survey query
    const surveyQuery: any = { company_id: companyId };

    if (filters.survey_ids?.length) {
      surveyQuery._id = { $in: filters.survey_ids };
    }

    if (filters.survey_types?.length) {
      surveyQuery.type = { $in: filters.survey_types };
    }

    if (filters.time_filter) {
      surveyQuery.$or = [
        {
          start_date: {
            $gte: filters.time_filter.start_date,
            $lte: filters.time_filter.end_date,
          },
        },
        {
          end_date: {
            $gte: filters.time_filter.start_date,
            $lte: filters.time_filter.end_date,
          },
        },
      ];
    }

    // Fetch surveys
    const surveys = await Survey.find(surveyQuery).lean();
    const surveyIds = surveys.map((s) => s._id.toString());

    // Build response query
    const responseQuery: any = {
      survey_id: { $in: surveyIds },
      is_complete: true,
    };

    if (filters.department_filter?.department_ids?.length) {
      responseQuery.department_id = {
        $in: filters.department_filter.department_ids,
      };
    }

    if (filters.time_filter) {
      responseQuery.completion_time = {
        $gte: filters.time_filter.start_date,
        $lte: filters.time_filter.end_date,
      };
    }

    // Apply demographic filters
    if (filters.demographic_filters?.length) {
      const demographicConditions = filters.demographic_filters.map(
        (filter) => ({
          'demographics.field': filter.field,
          'demographics.value': { $in: filter.values },
        })
      );
      responseQuery.$and = demographicConditions;
    }

    // Fetch responses
    const responses = await Response.find(responseQuery).lean();

    // Fetch analytics insights
    const analyticsQuery: any = { company_id: companyId, is_current: true };
    if (surveyIds.length) {
      analyticsQuery.survey_id = { $in: surveyIds };
    }
    const analytics = await AnalyticsInsight.find(analyticsQuery).lean();

    // Fetch AI insights if configured
    let ai_insights: IAIInsight[] = [];
    if (config.include_ai_insights) {
      const aiQuery: any = { company_id: companyId };
      if (surveyIds.length) {
        aiQuery.survey_id = { $in: surveyIds };
      }
      if (filters.time_filter) {
        aiQuery.created_at = {
          $gte: filters.time_filter.start_date,
          $lte: filters.time_filter.end_date,
        };
      }
      ai_insights = await AIInsight.find(aiQuery).lean();
    }

    // Fetch benchmarks if needed
    let benchmarks: IBenchmark[] = [];
    if (filters.benchmark_ids?.length) {
      benchmarks = await Benchmark.find({
        _id: { $in: filters.benchmark_ids },
      }).lean();
    }

    // Fetch users for demographic analysis
    let users: IUser[] = [];
    if (config.include_raw_data) {
      const userQuery: any = { company_id: companyId, is_active: true };
      if (filters.department_filter?.department_ids?.length) {
        userQuery.department_id = {
          $in: filters.department_filter.department_ids,
        };
      }
      users = await User.find(userQuery).select('-password_hash').lean();
    }

    // Generate metadata
    const metadata: IReportMetadata = {
      generation_date: new Date(),
      total_responses: responses.length,
      date_range: {
        start: filters.time_filter?.start_date || new Date(0),
        end: filters.time_filter?.end_date || new Date(),
      },
      filters_applied: filters,
    };

    return {
      surveys,
      responses,
      analytics,
      ai_insights,
      benchmarks,
      users,
      metadata,
    };
  }

  /**
   * Generate chart data from report data
   */
  static generateChartData(
    reportData: IReportData,
    chartType: string
  ): IChartData[] {
    const charts: IChartData[] = [];

    switch (chartType) {
      case 'response_distribution':
        charts.push(this.generateResponseDistributionChart(reportData));
        break;
      case 'department_comparison':
        charts.push(this.generateDepartmentComparisonChart(reportData));
        break;
      case 'trend_analysis':
        charts.push(this.generateTrendAnalysisChart(reportData));
        break;
      case 'sentiment_analysis':
        charts.push(this.generateSentimentAnalysisChart(reportData));
        break;
      case 'benchmark_comparison':
        charts.push(this.generateBenchmarkComparisonChart(reportData));
        break;
    }

    return charts;
  }

  /**
   * Generate response distribution chart
   */
  private static generateResponseDistributionChart(
    reportData: IReportData
  ): IChartData {
    const surveyTypes = reportData.surveys.reduce(
      (acc, survey) => {
        acc[survey.type] = (acc[survey.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      type: 'pie',
      title: 'Survey Response Distribution',
      data: Object.entries(surveyTypes).map(([type, count]) => ({
        label: type.replace('_', ' ').toUpperCase(),
        value: count,
      })),
      colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
    };
  }

  /**
   * Generate department comparison chart
   */
  private static generateDepartmentComparisonChart(
    reportData: IReportData
  ): IChartData {
    const departmentData = reportData.responses.reduce(
      (acc, response) => {
        if (response.department_id) {
          acc[response.department_id] = (acc[response.department_id] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      type: 'bar',
      title: 'Responses by Department',
      data: Object.entries(departmentData).map(([dept, count]) => ({
        department: dept,
        responses: count,
      })),
      labels: Object.keys(departmentData),
    };
  }

  /**
   * Generate trend analysis chart
   */
  private static generateTrendAnalysisChart(
    reportData: IReportData
  ): IChartData {
    const timeSeriesData = reportData.analytics
      .filter(
        (insight) => insight.time_series && insight.time_series.length > 0
      )
      .flatMap((insight) => insight.time_series!)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      type: 'line',
      title: 'Engagement Trends Over Time',
      data: timeSeriesData.map((point) => ({
        date: point.date.toISOString().split('T')[0],
        value: point.value,
      })),
    };
  }

  /**
   * Generate sentiment analysis chart
   */
  private static generateSentimentAnalysisChart(
    reportData: IReportData
  ): IChartData {
    const sentimentData = reportData.ai_insights
      .filter((insight) => insight.category === 'sentiment')
      .reduce(
        (acc, insight) => {
          const sentiment = insight.supporting_data?.sentiment || 'neutral';
          acc[sentiment] = (acc[sentiment] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    return {
      type: 'pie',
      title: 'Sentiment Distribution',
      data: Object.entries(sentimentData).map(([sentiment, count]) => ({
        label: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
        value: count,
      })),
      colors: ['#10B981', '#F59E0B', '#EF4444'],
    };
  }

  /**
   * Generate benchmark comparison chart
   */
  private static generateBenchmarkComparisonChart(
    reportData: IReportData
  ): IChartData {
    if (!reportData.benchmarks?.length) {
      return {
        type: 'bar',
        title: 'Benchmark Comparison',
        data: [],
      };
    }

    const benchmarkData = reportData.benchmarks.map((benchmark) => ({
      name: benchmark.name,
      internal:
        benchmark.metrics.find((m) => m.metric_name === 'engagement')?.value ||
        0,
      industry:
        benchmark.metrics.find((m) => m.metric_name === 'industry_average')
          ?.value || 0,
    }));

    return {
      type: 'bar',
      title: 'Performance vs Industry Benchmarks',
      data: benchmarkData,
    };
  }

  /**
   * Apply demographic filters to data
   */
  static applyDemographicFilters(
    responses: IResponse[],
    filters: IReportFilters
  ): IResponse[] {
    if (!filters.demographic_filters?.length) {
      return responses;
    }

    return responses.filter((response) => {
      return filters.demographic_filters!.every((filter) => {
        const demographic = response.demographics.find(
          (d) => d.field === filter.field
        );
        return (
          demographic && filter.values.includes(demographic.value.toString())
        );
      });
    });
  }

  /**
   * Generate executive summary from AI insights
   */
  static generateExecutiveSummary(reportData: IReportData): string {
    const { ai_insights, metadata } = reportData;

    const criticalInsights = ai_insights.filter(
      (insight) => insight.priority === 'critical'
    );
    const highInsights = ai_insights.filter(
      (insight) => insight.priority === 'high'
    );
    const recommendations = ai_insights.flatMap(
      (insight) => insight.recommended_actions
    );

    let summary = `# Executive Summary\n\n`;
    summary += `**Report Period:** ${metadata.date_range.start.toDateString()} - ${metadata.date_range.end.toDateString()}\n`;
    summary += `**Total Responses:** ${metadata.total_responses}\n\n`;

    if (criticalInsights.length > 0) {
      summary += `## Critical Issues (${criticalInsights.length})\n`;
      criticalInsights.slice(0, 3).forEach((insight) => {
        summary += `- **${insight.title}:** ${insight.description}\n`;
      });
      summary += '\n';
    }

    if (highInsights.length > 0) {
      summary += `## High Priority Items (${highInsights.length})\n`;
      highInsights.slice(0, 3).forEach((insight) => {
        summary += `- **${insight.title}:** ${insight.description}\n`;
      });
      summary += '\n';
    }

    if (recommendations.length > 0) {
      summary += `## Key Recommendations\n`;
      recommendations.slice(0, 5).forEach((rec, index) => {
        summary += `${index + 1}. ${rec}\n`;
      });
    }

    return summary;
  }

  /**
   * Validate report filters
   */
  static validateFilters(filters: IReportFilters): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate time filter
    if (filters.time_filter) {
      if (filters.time_filter.start_date >= filters.time_filter.end_date) {
        errors.push('Start date must be before end date');
      }

      const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (
        filters.time_filter.end_date.getTime() -
          filters.time_filter.start_date.getTime() >
        maxRange
      ) {
        errors.push('Date range cannot exceed 1 year');
      }
    }

    // Validate demographic filters
    if (filters.demographic_filters) {
      filters.demographic_filters.forEach((filter, index) => {
        if (!filter.field || !filter.values?.length) {
          errors.push(`Demographic filter ${index + 1} is incomplete`);
        }
      });
    }

    // Validate department filter
    if (
      filters.department_filter &&
      !filters.department_filter.department_ids?.length
    ) {
      errors.push('Department filter must include at least one department');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate comparative analysis between departments
   */
  static generateComparativeAnalysis(
    reportData: IReportData,
    comparisonType: 'department' | 'time_period' | 'benchmark'
  ): any {
    switch (comparisonType) {
      case 'department':
        return this.generateDepartmentComparison(reportData);
      case 'time_period':
        return this.generateTimePeriodComparison(reportData);
      case 'benchmark':
        return this.generateBenchmarkComparison(reportData);
      default:
        return null;
    }
  }

  /**
   * Generate department comparison analysis
   */
  private static generateDepartmentComparison(reportData: IReportData): any {
    const departmentMetrics = reportData.responses.reduce(
      (acc, response) => {
        if (!response.department_id) return acc;

        if (!acc[response.department_id]) {
          acc[response.department_id] = {
            total_responses: 0,
            avg_score: 0,
            sentiment_scores: [],
            completion_rate: 0,
          };
        }

        acc[response.department_id].total_responses += 1;
        if (response.numeric_value) {
          acc[response.department_id].sentiment_scores.push(
            response.numeric_value
          );
        }

        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate averages and rankings
    Object.keys(departmentMetrics).forEach((deptId) => {
      const dept = departmentMetrics[deptId];
      if (dept.sentiment_scores.length > 0) {
        dept.avg_score =
          dept.sentiment_scores.reduce(
            (sum: number, score: number) => sum + score,
            0
          ) / dept.sentiment_scores.length;
      }
    });

    return {
      departments: departmentMetrics,
      rankings: Object.entries(departmentMetrics)
        .sort(
          ([, a]: [string, any], [, b]: [string, any]) =>
            b.avg_score - a.avg_score
        )
        .map(([deptId, metrics], index) => ({
          department_id: deptId,
          rank: index + 1,
          score: (metrics as any).avg_score,
          total_responses: (metrics as any).total_responses,
        })),
    };
  }

  /**
   * Generate time period comparison analysis
   */
  private static generateTimePeriodComparison(reportData: IReportData): any {
    const timeSeriesData = reportData.analytics
      .filter(
        (insight) => insight.time_series && insight.time_series.length > 0
      )
      .flatMap((insight) => insight.time_series!)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (timeSeriesData.length === 0) return null;

    const periods = this.groupByTimePeriod(timeSeriesData, 'month');
    const trends = this.calculateTrends(periods);

    return {
      periods,
      trends,
      overall_direction: trends.slope > 0 ? 'improving' : 'declining',
      change_rate: Math.abs(trends.slope),
    };
  }

  /**
   * Generate benchmark comparison analysis
   */
  private static generateBenchmarkComparison(reportData: IReportData): any {
    if (!reportData.benchmarks?.length) return null;

    const currentMetrics = this.calculateCurrentMetrics(reportData);
    const comparisons = reportData.benchmarks.map((benchmark) => {
      const gaps = benchmark.metrics.map((metric) => {
        const currentValue = currentMetrics[metric.metric_name] || 0;
        const gap = currentValue - metric.value;
        const gapPercentage = metric.value > 0 ? (gap / metric.value) * 100 : 0;

        return {
          metric_name: metric.metric_name,
          current_value: currentValue,
          benchmark_value: metric.value,
          gap,
          gap_percentage: gapPercentage,
          performance: gap >= 0 ? 'above' : 'below',
        };
      });

      return {
        benchmark_id: benchmark._id,
        benchmark_name: benchmark.name,
        benchmark_type: benchmark.type,
        gaps,
        overall_performance:
          gaps.filter((g) => g.performance === 'above').length / gaps.length,
      };
    });

    return {
      comparisons,
      summary: {
        total_benchmarks: comparisons.length,
        above_benchmark: comparisons.filter((c) => c.overall_performance > 0.5)
          .length,
        below_benchmark: comparisons.filter((c) => c.overall_performance <= 0.5)
          .length,
      },
    };
  }

  /**
   * Group time series data by period
   */
  private static groupByTimePeriod(
    timeSeriesData: any[],
    period: 'day' | 'week' | 'month' | 'quarter'
  ): any[] {
    const groups: Record<string, any[]> = {};

    timeSeriesData.forEach((point) => {
      let key: string;
      const date = new Date(point.date);

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(point);
    });

    return Object.entries(groups).map(([period, points]) => ({
      period,
      points,
      avg_value: points.reduce((sum, p) => sum + p.value, 0) / points.length,
      total_points: points.length,
    }));
  }

  /**
   * Calculate trends from time series data
   */
  private static calculateTrends(periods: any[]): any {
    if (periods.length < 2) return { slope: 0, correlation: 0 };

    const x = periods.map((_, index) => index);
    const y = periods.map((p) => p.avg_value);

    const n = periods.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate current metrics from report data
   */
  private static calculateCurrentMetrics(
    reportData: IReportData
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Calculate engagement score
    const engagementScores = reportData.responses
      .filter((r) => r.numeric_value !== undefined)
      .map((r) => r.numeric_value!);

    if (engagementScores.length > 0) {
      metrics.engagement =
        engagementScores.reduce((sum, score) => sum + score, 0) /
        engagementScores.length;
    }

    // Calculate response rate
    metrics.response_rate =
      reportData.metadata.total_responses / (reportData.users?.length || 1);

    // Calculate sentiment score from AI insights
    const sentimentInsights = reportData.ai_insights.filter(
      (insight) => insight.category === 'sentiment'
    );
    if (sentimentInsights.length > 0) {
      const sentimentScores = sentimentInsights
        .map((insight) => insight.supporting_data?.sentiment_score)
        .filter((score) => score !== undefined);
      if (sentimentScores.length > 0) {
        metrics.sentiment =
          sentimentScores.reduce((sum, score) => sum + score, 0) /
          sentimentScores.length;
      }
    }

    return metrics;
  }

  /**
   * Generate advanced filtering options
   */
  static generateAdvancedFilters(reportData: IReportData): any {
    const uniqueDepartments = [
      ...new Set(reportData.responses.map((r) => r.department_id)),
    ].filter(Boolean);
    const uniqueSurveyTypes = [
      ...new Set(reportData.surveys.map((s) => s.type)),
    ];
    const dateRange = {
      earliest: Math.min(
        ...reportData.responses.map((r) => r.completion_time?.getTime() || 0)
      ),
      latest: Math.max(
        ...reportData.responses.map((r) => r.completion_time?.getTime() || 0)
      ),
    };

    return {
      departments: uniqueDepartments,
      survey_types: uniqueSurveyTypes,
      date_range: {
        min: new Date(dateRange.earliest),
        max: new Date(dateRange.latest),
      },
      demographic_options: this.extractDemographicOptions(reportData),
    };
  }

  /**
   * Extract available demographic options from data
   */
  private static extractDemographicOptions(reportData: IReportData): any {
    const demographicOptions: Record<string, Set<string>> = {};

    reportData.responses.forEach((response) => {
      response.demographics.forEach((demo) => {
        if (!demographicOptions[demo.field]) {
          demographicOptions[demo.field] = new Set();
        }
        demographicOptions[demo.field].add(demo.value.toString());
      });
    });

    return Object.entries(demographicOptions).reduce(
      (acc, [field, values]) => {
        acc[field] = Array.from(values).sort();
        return acc;
      },
      {} as Record<string, string[]>
    );
  }

  /**
   * Get default report templates with enhanced configurations
   */
  static getDefaultTemplates(): any[] {
    return [
      {
        id: 'survey_analysis_standard',
        name: 'Standard Survey Analysis',
        description:
          'Comprehensive analysis of survey responses with demographics and trends',
        type: 'survey_analysis',
        config: {
          include_charts: true,
          include_raw_data: false,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: [
            'response_distribution',
            'department_comparison',
            'trend_analysis',
          ],
        },
        is_system_template: true,
      },
      {
        id: 'executive_summary',
        name: 'Executive Summary Report',
        description:
          'High-level overview with key insights and recommendations',
        type: 'executive_summary',
        config: {
          include_charts: true,
          include_raw_data: false,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: ['sentiment_analysis', 'benchmark_comparison'],
        },
        is_system_template: true,
      },
      {
        id: 'department_comparison',
        name: 'Department Comparison Report',
        description: 'Detailed comparison across departments with benchmarking',
        type: 'department_comparison',
        config: {
          include_charts: true,
          include_raw_data: true,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: ['department_comparison', 'benchmark_comparison'],
        },
        is_system_template: true,
      },
      {
        id: 'trend_analysis',
        name: 'Trend Analysis Report',
        description:
          'Time-based analysis showing engagement and culture trends',
        type: 'trend_analysis',
        config: {
          include_charts: true,
          include_raw_data: false,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: ['trend_analysis', 'sentiment_analysis'],
        },
        is_system_template: true,
      },
      {
        id: 'benchmark_comparison_detailed',
        name: 'Detailed Benchmark Comparison',
        description:
          'In-depth comparison against industry and internal benchmarks with gap analysis',
        type: 'benchmark_comparison',
        config: {
          include_charts: true,
          include_raw_data: true,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: [
            'benchmark_comparison',
            'gap_analysis',
            'performance_matrix',
          ],
        },
        is_system_template: true,
      },
      {
        id: 'custom_filtered',
        name: 'Custom Filtered Report',
        description:
          'Flexible report template with advanced filtering and customizable sections',
        type: 'custom',
        config: {
          include_charts: true,
          include_raw_data: true,
          include_ai_insights: true,
          include_recommendations: true,
          chart_types: [
            'response_distribution',
            'department_comparison',
            'trend_analysis',
            'sentiment_analysis',
            'benchmark_comparison',
          ],
          custom_sections: [
            'executive_summary',
            'detailed_analysis',
            'recommendations',
          ],
        },
        is_system_template: true,
      },
    ];
  }
}

// Export a default instance for convenience
export const reportService = new ReportService();
