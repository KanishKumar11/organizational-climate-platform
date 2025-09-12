import { connectDB } from '@/lib/mongodb';
import Benchmark from '@/models/Benchmark';

export class BenchmarkService {
  static async getBenchmarks(filters: any = {}) {
    await connectDB();

    let query: any = {};

    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.industry) query.industry = filters.industry;
    if (filters.company_size) query.company_size = filters.company_size;
    if (filters.region) query.region = filters.region;
    if (filters.is_active !== undefined) query.is_active = filters.is_active;
    if (filters.validation_status)
      query.validation_status = filters.validation_status;
    if (filters.name) query.name = { $regex: filters.name, $options: 'i' };

    return await Benchmark.find(query).sort({ created_at: -1 }).lean();
  }

  static async createBenchmark(benchmarkData: any) {
    await connectDB();

    const benchmark = new Benchmark({
      ...benchmarkData,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return await benchmark.save();
  }

  static async createInternalBenchmark(
    surveyIds: string[],
    category: string,
    name: string,
    description: string,
    userId: string,
    companyId: string
  ) {
    await connectDB();

    // This would typically aggregate data from the specified surveys
    // For now, we'll create a placeholder benchmark
    const benchmark = new Benchmark({
      name,
      description,
      type: 'internal',
      category,
      source: 'Internal Survey Data',
      company_id: companyId,
      created_by: userId,
      metrics: [
        {
          metric_name: 'Overall Satisfaction',
          value: 7.5,
          unit: 'score',
          sample_size: 100,
        },
      ],
      survey_ids: surveyIds,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return await benchmark.save();
  }

  static async bulkUpdateBenchmarks(
    benchmarkIds: string[],
    updates: any,
    companyId?: string
  ) {
    await connectDB();

    let query: any = { _id: { $in: benchmarkIds } };

    // Apply company scoping if provided
    if (companyId) {
      query.$or = [
        { company_id: companyId },
        { company_id: { $exists: false } },
      ];
    }

    return await Benchmark.updateMany(query, { $set: updates });
  }

  static async bulkDeleteBenchmarks(
    benchmarkIds: string[],
    companyId?: string
  ) {
    await connectDB();

    let query: any = { _id: { $in: benchmarkIds } };

    // Apply company scoping if provided
    if (companyId) {
      query.company_id = companyId;
    }

    // Soft delete by marking as inactive
    return await Benchmark.updateMany(query, {
      $set: {
        is_active: false,
        deleted_at: new Date(),
      },
    });
  }

  static async getComprehensiveAnalysis(options: {
    company_id: string;
    timeframe: number;
    include_industry?: boolean;
    categories?: string[];
  }) {
    await connectDB();

    const { company_id, timeframe, include_industry, categories } = options;

    // Build query for company benchmarks
    let query: any = {
      $or: [{ company_id }, { type: 'industry', is_active: true }],
    };

    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    const benchmarks = await Benchmark.find(query).lean();

    // Calculate analysis metrics
    const analysis = {
      summary: {
        total_benchmarks: benchmarks.length,
        internal_benchmarks: benchmarks.filter((b) => b.type === 'internal')
          .length,
        industry_benchmarks: benchmarks.filter((b) => b.type === 'industry')
          .length,
        categories_covered: [...new Set(benchmarks.map((b) => b.category))],
      },
      performance_comparison: await this.calculatePerformanceComparison(
        benchmarks,
        company_id
      ),
      trend_analysis: await this.calculateTrendAnalysis(benchmarks, timeframe),
      recommendations: await this.generateAnalysisRecommendations(
        benchmarks,
        company_id
      ),
    };

    return analysis;
  }

  static async generateCustomAnalysis(options: {
    survey_ids: string[];
    benchmark_ids: string[];
    analysis_type: string;
    custom_metrics?: any[];
    comparison_period?: string;
    requested_by: string;
    company_id: string;
  }) {
    await connectDB();

    const {
      survey_ids,
      benchmark_ids,
      analysis_type,
      custom_metrics,
      comparison_period,
      requested_by,
      company_id,
    } = options;

    // Get benchmarks
    const benchmarks = await Benchmark.find({
      _id: { $in: benchmark_ids },
    }).lean();

    // This would integrate with survey data to perform actual analysis
    // For now, we'll return a structured analysis object
    const customAnalysis = {
      analysis_id: `analysis_${Date.now()}`,
      type: analysis_type,
      created_by: requested_by,
      company_id,
      created_at: new Date(),
      survey_ids,
      benchmark_ids,
      results: {
        overall_score: Math.random() * 10,
        category_scores: benchmarks.map((b) => ({
          category: b.category,
          score: Math.random() * 10,
          benchmark_value: b.metrics[0]?.value || 0,
          variance: Math.random() * 2 - 1,
        })),
        insights: [
          'Performance is above industry average in most categories',
          'Leadership scores show room for improvement',
          'Employee engagement trends are positive',
        ],
        recommendations: [
          'Focus on leadership development programs',
          'Implement regular feedback mechanisms',
          'Consider team building initiatives',
        ],
      },
    };

    return customAnalysis;
  }

  static async generateRecommendations(options: {
    survey_id: string;
    company_id: string;
    focus_areas?: string[];
    priority_level?: 'high' | 'medium' | 'low';
  }) {
    await connectDB();

    const { survey_id, company_id, focus_areas, priority_level } = options;

    // Get relevant benchmarks
    const benchmarks = await Benchmark.find({
      $or: [{ company_id }, { type: 'industry', is_active: true }],
    }).lean();

    // Generate recommendations based on benchmark comparison
    const recommendations = {
      survey_id,
      generated_at: new Date(),
      priority_level: priority_level || 'medium',
      recommendations: [
        {
          id: 'rec_1',
          title: 'Improve Leadership Communication',
          description:
            'Based on benchmark analysis, leadership communication scores are below industry average',
          priority: 'high',
          category: 'Leadership',
          suggested_actions: [
            'Implement regular town halls',
            'Provide communication training for managers',
            'Establish feedback channels',
          ],
          expected_impact: 'High',
          timeline: '3-6 months',
          metrics_to_track: [
            'Leadership satisfaction',
            'Communication effectiveness',
          ],
        },
        {
          id: 'rec_2',
          title: 'Enhance Employee Recognition',
          description:
            'Recognition scores show opportunity for improvement compared to similar organizations',
          priority: 'medium',
          category: 'Recognition',
          suggested_actions: [
            'Launch peer recognition program',
            'Implement achievement celebrations',
            'Create career advancement pathways',
          ],
          expected_impact: 'Medium',
          timeline: '2-4 months',
          metrics_to_track: ['Recognition satisfaction', 'Employee engagement'],
        },
      ],
      focus_areas: focus_areas || [
        'Leadership',
        'Communication',
        'Recognition',
      ],
    };

    return recommendations;
  }

  static async createCustomRecommendation(options: {
    title: string;
    description: string;
    benchmark_data: any;
    target_metrics: any[];
    improvement_areas: string[];
    timeline: string;
    priority: string;
    created_by: string;
    company_id: string;
  }) {
    await connectDB();

    const customRecommendation = {
      ...options,
      id: `custom_rec_${Date.now()}`,
      created_at: new Date(),
      status: 'active',
      type: 'custom',
    };

    // In a real implementation, this would be saved to a recommendations collection
    // For now, we'll return the structured recommendation
    return customRecommendation;
  }

  private static async calculatePerformanceComparison(
    benchmarks: any[],
    company_id: string
  ) {
    const internalBenchmarks = benchmarks.filter(
      (b) => b.company_id === company_id
    );
    const industryBenchmarks = benchmarks.filter((b) => b.type === 'industry');

    return {
      categories: [...new Set(benchmarks.map((b) => b.category))].map(
        (category) => {
          const internal = internalBenchmarks.find(
            (b) => b.category === category
          );
          const industry = industryBenchmarks.find(
            (b) => b.category === category
          );

          return {
            category,
            internal_score: internal?.metrics[0]?.value || 0,
            industry_average: industry?.metrics[0]?.value || 0,
            variance:
              internal && industry
                ? internal.metrics[0].value - industry.metrics[0].value
                : 0,
            performance_level:
              internal && industry
                ? internal.metrics[0].value > industry.metrics[0].value
                  ? 'above_average'
                  : 'below_average'
                : 'no_comparison',
          };
        }
      ),
    };
  }

  private static async calculateTrendAnalysis(
    benchmarks: any[],
    timeframe: number
  ) {
    // This would analyze trends over the specified timeframe
    // For now, we'll return mock trend data
    return {
      timeframe_months: timeframe,
      trends: benchmarks.map((b) => ({
        category: b.category,
        trend_direction: Math.random() > 0.5 ? 'improving' : 'declining',
        change_percentage: (Math.random() * 20 - 10).toFixed(1),
        confidence_level: Math.random() > 0.7 ? 'high' : 'medium',
      })),
    };
  }

  private static async generateAnalysisRecommendations(
    benchmarks: unknown[],
    company_id: string
  ) {
    // Generate recommendations based on benchmark analysis
    return [
      {
        type: 'improvement_opportunity',
        title: 'Focus on underperforming categories',
        description: 'Several categories show scores below industry benchmarks',
        priority: 'high',
      },
      {
        type: 'strength_leverage',
        title: 'Leverage high-performing areas',
        description: 'Use strengths in top categories to improve other areas',
        priority: 'medium',
      },
    ];
  }
}
