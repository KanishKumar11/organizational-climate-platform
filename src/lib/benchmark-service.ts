import Benchmark, { IBenchmark, BenchmarkMetric } from '@/models/Benchmark';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import { connectDB } from '@/lib/db';

export interface BenchmarkCreationData {
  name: string;
  description: string;
  type: 'internal' | 'industry';
  category: string;
  source: string;
  industry?: string;
  company_size?: string;
  region?: string;
  created_by: string;
  company_id?: string;
  metrics: BenchmarkMetric[];
}

export interface BenchmarkFilter {
  type?: 'internal' | 'industry';
  category?: string;
  industry?: string;
  company_size?: string;
  region?: string;
  is_active?: boolean;
  validation_status?: 'pending' | 'validated' | 'rejected';
}

export class BenchmarkService {
  static async createBenchmark(
    data: BenchmarkCreationData
  ): Promise<IBenchmark> {
    await connectDB();

    // Validate metrics
    const validatedMetrics = await this.validateMetrics(data.metrics);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(data);

    const benchmark = new Benchmark({
      ...data,
      metrics: validatedMetrics,
      quality_score: qualityScore,
    });

    return await benchmark.save();
  }

  static async createInternalBenchmark(
    surveyIds: string[],
    category: string,
    name: string,
    description: string,
    createdBy: string,
    companyId: string
  ): Promise<IBenchmark> {
    await connectDB();

    // Generate metrics from historical survey data
    const metrics = await this.generateMetricsFromSurveys(surveyIds);

    return this.createBenchmark({
      name,
      description,
      type: 'internal',
      category,
      source: 'Historical Survey Data',
      created_by: createdBy,
      company_id: companyId,
      metrics,
    });
  }

  static async getBenchmarks(
    filter: BenchmarkFilter = {}
  ): Promise<IBenchmark[]> {
    await connectDB();

    const query: any = {};

    if (filter.type) query.type = filter.type;
    if (filter.category) query.category = filter.category;
    if (filter.industry) query.industry = filter.industry;
    if (filter.company_size) query.company_size = filter.company_size;
    if (filter.region) query.region = filter.region;
    if (filter.is_active !== undefined) query.is_active = filter.is_active;
    if (filter.validation_status)
      query.validation_status = filter.validation_status;

    return await (Benchmark as any).find(query).sort({ created_at: -1 });
  }

  static async getBenchmarkById(id: string): Promise<IBenchmark | null> {
    await connectDB();
    return await (Benchmark as any).findById(id);
  }

  static async updateBenchmark(
    id: string,
    updates: Partial<IBenchmark>
  ): Promise<IBenchmark | null> {
    await connectDB();

    if (updates.metrics) {
      updates.metrics = await this.validateMetrics(updates.metrics);
    }

    return await (Benchmark as any).findByIdAndUpdate(id, updates, {
      new: true,
    });
  }

  static async validateBenchmark(
    id: string,
    status: 'validated' | 'rejected'
  ): Promise<IBenchmark | null> {
    await connectDB();

    const benchmark = await (Benchmark as any).findByIdAndUpdate(
      id,
      {
        validation_status: status,
        updated_at: new Date(),
      },
      { new: true }
    );

    return benchmark;
  }

  static async getBenchmarkCategories(): Promise<string[]> {
    await connectDB();

    const categories = await Benchmark.distinct('category', {
      is_active: true,
    });
    return categories.sort();
  }

  static async getIndustryBenchmarks(
    industry: string,
    companySize?: string
  ): Promise<IBenchmark[]> {
    await connectDB();

    const query: any = {
      type: 'industry',
      industry,
      is_active: true,
      validation_status: 'validated',
    };

    if (companySize) {
      query.company_size = companySize;
    }

    return await (Benchmark as any).find(query).sort({ quality_score: -1 });
  }

  private static async generateMetricsFromSurveys(
    surveyIds: string[]
  ): Promise<BenchmarkMetric[]> {
    await connectDB();

    const metrics: BenchmarkMetric[] = [];

    for (const surveyId of surveyIds) {
      const survey = await (Survey as any).findById(surveyId);
      if (!survey) continue;

      // Get all responses for this survey
      const responses = await (Response as any).find({ survey_id: surveyId });

      // Calculate engagement rate
      const totalInvited = survey.total_invited || responses.length;
      const engagementRate = (responses.length / totalInvited) * 100;

      metrics.push({
        metric_name: 'Engagement Rate',
        value: engagementRate,
        unit: 'percentage',
        sample_size: totalInvited,
      });

      // Calculate average satisfaction scores for Likert questions
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
    }

    return metrics;
  }

  private static async validateMetrics(
    metrics: BenchmarkMetric[]
  ): Promise<BenchmarkMetric[]> {
    return metrics.map((metric) => {
      // Validate metric values
      if (metric.value < 0) metric.value = 0;
      if (
        metric.percentile &&
        (metric.percentile < 0 || metric.percentile > 100)
      ) {
        delete metric.percentile;
      }

      return metric;
    });
  }

  private static calculateQualityScore(data: BenchmarkCreationData): number {
    let score = 0;

    // Base score for having metrics
    if (data.metrics.length > 0) score += 30;

    // Score for sample size
    const avgSampleSize =
      data.metrics.reduce((sum, m) => sum + (m.sample_size || 0), 0) /
      data.metrics.length;

    if (avgSampleSize > 100) score += 20;
    else if (avgSampleSize > 50) score += 15;
    else if (avgSampleSize > 20) score += 10;

    // Score for confidence intervals
    const metricsWithCI = data.metrics.filter((m) => m.confidence_interval);
    if (metricsWithCI.length > 0) {
      score += (metricsWithCI.length / data.metrics.length) * 20;
    }

    // Score for metadata completeness
    if (data.industry) score += 10;
    if (data.company_size) score += 10;
    if (data.region) score += 10;

    return Math.min(score, 100);
  }
}


