import { connectDB } from '@/lib/db';
import Benchmark, { IBenchmark, BenchmarkMetric } from '@/models/Benchmark';
import Survey from '@/models/Survey';
import Response from '@/models/Response';

export interface ComparisonResult {
  metric_name: string;
  current_value: number;
  benchmark_value: number;
  gap: number;
  gap_percentage: number;
  performance_level: 'above' | 'at' | 'below';
  significance: 'high' | 'medium' | 'low';
  unit: string;
}

export interface GapAnalysis {
  overall_score: number;
  total_metrics: number;
  above_benchmark: number;
  at_benchmark: number;
  below_benchmark: number;
  critical_gaps: ComparisonResult[];
  improvement_opportunities: ComparisonResult[];
  strengths: ComparisonResult[];
  comparison_results: ComparisonResult[];
  benchmark_info: {
    id: string;
    name: string;
    type: string;
    category: string;
  };
}

export interface TrendAnalysis {
  metric_name: string;
  historical_values: Array<{
    date: string;
    value: number;
  }>;
  trend_direction: 'improving' | 'stable' | 'declining';
  trend_strength: number;
  forecast: Array<{
    date: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }>;
}

export interface StrategicRecommendation {
  priority: 'high' | 'medium' | 'low';
  focus_area: string;
  gap_size: number;
  recommended_actions: string[];
  expected_impact: string;
  timeline: string;
  resources_required: string[];
}

export class BenchmarkComparisonService {
  static async compareWithBenchmark(
    surveyId: string,
    benchmarkId: string
  ): Promise<GapAnalysis> {
    await connectDB();

    const benchmark = await Benchmark.findById(benchmarkId);
    if (!benchmark) {
      throw new Error('Benchmark not found');
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    // Calculate current metrics from survey data
    const currentMetrics = await this.calculateSurveyMetrics(surveyId);

    // Compare with benchmark metrics
    const comparisonResults = this.performComparison(
      currentMetrics,
      benchmark.metrics
    );

    // Analyze gaps and categorize results
    const gapAnalysis = this.analyzeGaps(comparisonResults, benchmark);

    return gapAnalysis;
  }

  static async findSimilarBenchmarks(
    industry?: string,
    companySize?: string,
    category?: string
  ): Promise<IBenchmark[]> {
    await connectDB();

    const query: any = {
      type: 'industry',
      is_active: true,
      validation_status: 'validated',
    };

    if (industry) query.industry = industry;
    if (companySize) query.company_size = companySize;
    if (category) query.category = category;

    return await Benchmark.find(query).sort({ quality_score: -1 }).limit(10);
  }

  static async generateStrategicRecommendations(
    gapAnalysis: GapAnalysis
  ): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];

    // Analyze critical gaps for high-priority recommendations
    for (const gap of gapAnalysis.critical_gaps) {
      if (gap.gap_percentage < -20) {
        // More than 20% below benchmark
        recommendations.push({
          priority: 'high',
          focus_area: gap.metric_name,
          gap_size: Math.abs(gap.gap_percentage),
          recommended_actions: this.getRecommendedActions(
            gap.metric_name,
            gap.gap_percentage
          ),
          expected_impact: this.calculateExpectedImpact(gap.gap_percentage),
          timeline: this.estimateTimeline(gap.gap_percentage),
          resources_required: this.getRequiredResources(gap.metric_name),
        });
      }
    }

    // Analyze improvement opportunities for medium-priority recommendations
    for (const opportunity of gapAnalysis.improvement_opportunities) {
      if (
        opportunity.gap_percentage < -10 &&
        opportunity.gap_percentage >= -20
      ) {
        recommendations.push({
          priority: 'medium',
          focus_area: opportunity.metric_name,
          gap_size: Math.abs(opportunity.gap_percentage),
          recommended_actions: this.getRecommendedActions(
            opportunity.metric_name,
            opportunity.gap_percentage
          ),
          expected_impact: this.calculateExpectedImpact(
            opportunity.gap_percentage
          ),
          timeline: this.estimateTimeline(opportunity.gap_percentage),
          resources_required: this.getRequiredResources(
            opportunity.metric_name
          ),
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static async analyzeTrends(
    surveyIds: string[],
    metricName: string
  ): Promise<TrendAnalysis> {
    await connectDB();

    const historicalData: Array<{ date: string; value: number }> = [];

    for (const surveyId of surveyIds) {
      const survey = await Survey.findById(surveyId);
      if (!survey) continue;

      const metrics = await this.calculateSurveyMetrics(surveyId);
      const metric = metrics.find((m) => m.metric_name === metricName);

      if (metric) {
        historicalData.push({
          date: survey.created_at.toISOString().split('T')[0],
          value: metric.value,
        });
      }
    }

    // Sort by date
    historicalData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate trend
    const trendAnalysis = this.calculateTrend(historicalData);

    // Generate forecast
    const forecast = this.generateForecast(historicalData, 6); // 6 months forecast

    return {
      metric_name: metricName,
      historical_values: historicalData,
      trend_direction: trendAnalysis.direction,
      trend_strength: trendAnalysis.strength,
      forecast,
    };
  }

  private static async calculateSurveyMetrics(
    surveyId: string
  ): Promise<BenchmarkMetric[]> {
    const responses = await Response.find({ survey_id: surveyId });
    const survey = await Survey.findById(surveyId);

    if (!survey || responses.length === 0) {
      return [];
    }

    const metrics: BenchmarkMetric[] = [];

    // Calculate engagement rate
    const totalInvited = survey.total_invited || responses.length;
    const engagementRate = (responses.length / totalInvited) * 100;

    metrics.push({
      metric_name: 'Engagement Rate',
      value: engagementRate,
      unit: 'percentage',
      sample_size: totalInvited,
    });

    // Calculate average satisfaction for Likert scale questions
    const likertResponses = responses.filter(
      (r) =>
        typeof r.response_value === 'number' &&
        r.response_value >= 1 &&
        r.response_value <= 5
    );

    if (likertResponses.length > 0) {
      const avgSatisfaction =
        likertResponses.reduce(
          (sum, r) => sum + (r.response_value as number),
          0
        ) / likertResponses.length;

      metrics.push({
        metric_name: 'Average Satisfaction Score',
        value: avgSatisfaction,
        unit: 'scale_1_5',
        sample_size: likertResponses.length,
      });
    }

    // Calculate completion rate
    const totalQuestions = survey.questions?.length || 1;
    const avgCompletionRate =
      responses.length > 0
        ? (responses.length / (totalInvited * totalQuestions)) * 100
        : 0;

    metrics.push({
      metric_name: 'Completion Rate',
      value: avgCompletionRate,
      unit: 'percentage',
      sample_size: totalInvited,
    });

    return metrics;
  }

  private static performComparison(
    currentMetrics: BenchmarkMetric[],
    benchmarkMetrics: BenchmarkMetric[]
  ): ComparisonResult[] {
    const results: ComparisonResult[] = [];

    for (const benchmarkMetric of benchmarkMetrics) {
      const currentMetric = currentMetrics.find(
        (m) => m.metric_name === benchmarkMetric.metric_name
      );

      if (currentMetric) {
        const gap = currentMetric.value - benchmarkMetric.value;
        const gapPercentage = (gap / benchmarkMetric.value) * 100;

        let performanceLevel: 'above' | 'at' | 'below';
        if (Math.abs(gapPercentage) <= 5) {
          performanceLevel = 'at';
        } else if (gapPercentage > 0) {
          performanceLevel = 'above';
        } else {
          performanceLevel = 'below';
        }

        let significance: 'high' | 'medium' | 'low';
        if (Math.abs(gapPercentage) >= 20) {
          significance = 'high';
        } else if (Math.abs(gapPercentage) >= 10) {
          significance = 'medium';
        } else {
          significance = 'low';
        }

        results.push({
          metric_name: benchmarkMetric.metric_name,
          current_value: currentMetric.value,
          benchmark_value: benchmarkMetric.value,
          gap,
          gap_percentage: gapPercentage,
          performance_level: performanceLevel,
          significance,
          unit: benchmarkMetric.unit,
        });
      }
    }

    return results;
  }

  private static analyzeGaps(
    comparisonResults: ComparisonResult[],
    benchmark: IBenchmark
  ): GapAnalysis {
    const criticalGaps = comparisonResults.filter(
      (r) => r.performance_level === 'below' && r.significance === 'high'
    );

    const improvementOpportunities = comparisonResults.filter(
      (r) => r.performance_level === 'below' && r.significance === 'medium'
    );

    const strengths = comparisonResults.filter(
      (r) => r.performance_level === 'above'
    );

    const aboveBenchmark = comparisonResults.filter(
      (r) => r.performance_level === 'above'
    ).length;
    const atBenchmark = comparisonResults.filter(
      (r) => r.performance_level === 'at'
    ).length;
    const belowBenchmark = comparisonResults.filter(
      (r) => r.performance_level === 'below'
    ).length;

    // Calculate overall score (0-100)
    const overallScore =
      comparisonResults.length > 0
        ? ((aboveBenchmark * 100 +
            atBenchmark * 75 +
            (belowBenchmark - criticalGaps.length) * 50) /
            (comparisonResults.length * 100)) *
          100
        : 0;

    return {
      overall_score: Math.round(overallScore),
      total_metrics: comparisonResults.length,
      above_benchmark: aboveBenchmark,
      at_benchmark: atBenchmark,
      below_benchmark: belowBenchmark,
      critical_gaps: criticalGaps,
      improvement_opportunities: improvementOpportunities,
      strengths,
      comparison_results: comparisonResults,
      benchmark_info: {
        id: benchmark._id.toString(),
        name: benchmark.name,
        type: benchmark.type,
        category: benchmark.category,
      },
    };
  }

  private static getRecommendedActions(
    metricName: string,
    gapPercentage: number
  ): string[] {
    const actions: Record<string, string[]> = {
      'Engagement Rate': [
        'Implement regular pulse surveys',
        'Improve manager-employee communication',
        'Create employee recognition programs',
        'Enhance career development opportunities',
      ],
      'Average Satisfaction Score': [
        'Conduct focus groups to identify pain points',
        'Improve work-life balance initiatives',
        'Enhance compensation and benefits',
        'Strengthen leadership development',
      ],
      'Completion Rate': [
        'Simplify survey design and reduce length',
        'Improve communication about survey importance',
        'Provide incentives for participation',
        'Optimize survey timing and frequency',
      ],
    };

    return (
      actions[metricName] || [
        'Conduct detailed analysis of this metric',
        'Benchmark against industry best practices',
        'Develop targeted improvement initiatives',
        'Monitor progress regularly',
      ]
    );
  }

  private static calculateExpectedImpact(gapPercentage: number): string {
    const absGap = Math.abs(gapPercentage);

    if (absGap >= 30) return 'High impact - significant improvement expected';
    if (absGap >= 15) return 'Medium impact - moderate improvement expected';
    return 'Low impact - incremental improvement expected';
  }

  private static estimateTimeline(gapPercentage: number): string {
    const absGap = Math.abs(gapPercentage);

    if (absGap >= 30) return '6-12 months';
    if (absGap >= 15) return '3-6 months';
    return '1-3 months';
  }

  private static getRequiredResources(metricName: string): string[] {
    const resources: Record<string, string[]> = {
      'Engagement Rate': [
        'HR team',
        'Management support',
        'Communication tools',
        'Training budget',
      ],
      'Average Satisfaction Score': [
        'HR team',
        'Leadership team',
        'Budget for initiatives',
        'External consultants',
      ],
      'Completion Rate': [
        'Survey platform',
        'Communication team',
        'Incentive budget',
        'Analytics tools',
      ],
    };

    return (
      resources[metricName] || [
        'Project team',
        'Management support',
        'Budget allocation',
        'Time commitment',
      ]
    );
  }

  private static calculateTrend(data: Array<{ date: string; value: number }>): {
    direction: 'improving' | 'stable' | 'declining';
    strength: number;
  } {
    if (data.length < 2) {
      return { direction: 'stable', strength: 0 };
    }

    // Simple linear regression to calculate trend
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.abs(slope) / (sumY / n); // Normalized strength

    let direction: 'improving' | 'stable' | 'declining';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'improving';
    } else {
      direction = 'declining';
    }

    return { direction, strength: Math.min(strength, 1) };
  }

  private static generateForecast(
    historicalData: Array<{ date: string; value: number }>,
    monthsAhead: number
  ): Array<{
    date: string;
    predicted_value: number;
    confidence_interval: { lower: number; upper: number };
  }> {
    if (historicalData.length < 2) {
      return [];
    }

    const trend = this.calculateTrend(historicalData);
    const lastValue = historicalData[historicalData.length - 1].value;
    const lastDate = new Date(historicalData[historicalData.length - 1].date);

    const forecast = [];
    for (let i = 1; i <= monthsAhead; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Simple linear projection
      const trendAdjustment =
        trend.direction === 'improving'
          ? trend.strength * i * 0.1
          : trend.direction === 'declining'
            ? -trend.strength * i * 0.1
            : 0;

      const predictedValue = lastValue + lastValue * trendAdjustment;
      const confidenceRange = predictedValue * 0.1; // 10% confidence interval

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted_value: Math.max(0, predictedValue),
        confidence_interval: {
          lower: Math.max(0, predictedValue - confidenceRange),
          upper: predictedValue + confidenceRange,
        },
      });
    }

    return forecast;
  }
}
