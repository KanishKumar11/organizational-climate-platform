import { connectDB } from '@/lib/db';
import Benchmark from '@/models/Benchmark';

const sampleBenchmarks = [
  {
    name: 'Technology Industry Engagement Benchmark',
    description:
      'Industry-wide employee engagement metrics for technology companies',
    type: 'industry',
    category: 'Employee Engagement',
    source: 'Industry Research Report 2024',
    industry: 'Technology',
    company_size: 'medium',
    region: 'North America',
    created_by: 'system',
    validation_status: 'validated',
    quality_score: 85,
    metrics: [
      {
        metric_name: 'Overall Engagement Score',
        value: 7.2,
        unit: 'scale_1_10',
        percentile: 75,
        sample_size: 15000,
        confidence_interval: { lower: 7.1, upper: 7.3 },
      },
      {
        metric_name: 'Employee Satisfaction',
        value: 78,
        unit: 'percentage',
        percentile: 70,
        sample_size: 15000,
        confidence_interval: { lower: 76, upper: 80 },
      },
      {
        metric_name: 'Retention Rate',
        value: 89,
        unit: 'percentage',
        percentile: 80,
        sample_size: 15000,
      },
    ],
  },
  {
    name: 'Healthcare Culture Assessment Benchmark',
    description: 'Organizational culture metrics for healthcare organizations',
    type: 'industry',
    category: 'Organizational Culture',
    source: 'Healthcare Culture Study 2024',
    industry: 'Healthcare',
    company_size: 'large',
    region: 'Global',
    created_by: 'system',
    validation_status: 'validated',
    quality_score: 92,
    metrics: [
      {
        metric_name: 'Cultural Alignment Score',
        value: 8.1,
        unit: 'scale_1_10',
        percentile: 85,
        sample_size: 25000,
        confidence_interval: { lower: 8.0, upper: 8.2 },
      },
      {
        metric_name: 'Values Adherence',
        value: 82,
        unit: 'percentage',
        percentile: 78,
        sample_size: 25000,
      },
      {
        metric_name: 'Purpose Clarity',
        value: 7.8,
        unit: 'scale_1_10',
        percentile: 72,
        sample_size: 25000,
      },
    ],
  },
  {
    name: 'Startup Microclimate Benchmark',
    description:
      'Real-time feedback and microclimate metrics for startup environments',
    type: 'industry',
    category: 'Microclimate',
    source: 'Startup Culture Report 2024',
    industry: 'Technology',
    company_size: 'startup',
    region: 'North America',
    created_by: 'system',
    validation_status: 'validated',
    quality_score: 78,
    metrics: [
      {
        metric_name: 'Response Rate',
        value: 85,
        unit: 'percentage',
        percentile: 90,
        sample_size: 5000,
      },
      {
        metric_name: 'Sentiment Score',
        value: 6.8,
        unit: 'scale_1_10',
        percentile: 65,
        sample_size: 5000,
      },
      {
        metric_name: 'Participation Frequency',
        value: 3.2,
        unit: 'times_per_month',
        percentile: 75,
        sample_size: 5000,
      },
    ],
  },
  {
    name: 'Financial Services Engagement Benchmark',
    description:
      'Employee engagement benchmarks for financial services industry',
    type: 'industry',
    category: 'Employee Engagement',
    source: 'Financial Services HR Study 2024',
    industry: 'Financial Services',
    company_size: 'large',
    region: 'Global',
    created_by: 'system',
    validation_status: 'pending',
    quality_score: 88,
    metrics: [
      {
        metric_name: 'Engagement Index',
        value: 6.9,
        unit: 'scale_1_10',
        percentile: 68,
        sample_size: 20000,
        confidence_interval: { lower: 6.8, upper: 7.0 },
      },
      {
        metric_name: 'Job Satisfaction',
        value: 74,
        unit: 'percentage',
        percentile: 65,
        sample_size: 20000,
      },
      {
        metric_name: 'Work-Life Balance Score',
        value: 6.5,
        unit: 'scale_1_10',
        percentile: 60,
        sample_size: 20000,
      },
    ],
  },
  {
    name: 'Manufacturing Safety Culture Benchmark',
    description:
      'Safety culture and engagement metrics for manufacturing companies',
    type: 'industry',
    category: 'Safety Culture',
    source: 'Manufacturing Safety Report 2024',
    industry: 'Manufacturing',
    company_size: 'large',
    region: 'North America',
    created_by: 'system',
    validation_status: 'validated',
    quality_score: 90,
    metrics: [
      {
        metric_name: 'Safety Culture Index',
        value: 8.3,
        unit: 'scale_1_10',
        percentile: 88,
        sample_size: 12000,
        confidence_interval: { lower: 8.2, upper: 8.4 },
      },
      {
        metric_name: 'Incident Reporting Rate',
        value: 92,
        unit: 'percentage',
        percentile: 85,
        sample_size: 12000,
      },
      {
        metric_name: 'Safety Training Completion',
        value: 96,
        unit: 'percentage',
        percentile: 90,
        sample_size: 12000,
      },
    ],
  },
];

export async function seedBenchmarks() {
  try {
    await connectDB();

    // Clear existing benchmarks
    await Benchmark.deleteMany({});

    // Insert sample benchmarks
    const benchmarks = await Benchmark.insertMany(sampleBenchmarks);

    console.log(`✅ Seeded ${benchmarks.length} benchmarks`);
    return benchmarks;
  } catch (error) {
    console.error('❌ Error seeding benchmarks:', error);
    throw error;
  }
}

// Function to seed a specific company's internal benchmarks
export async function seedInternalBenchmarks(
  companyId: string,
  userId: string
) {
  try {
    await connectDB();

    const internalBenchmarks = [
      {
        name: 'Q1 2024 Employee Engagement Internal Benchmark',
        description:
          'Internal benchmark based on Q1 2024 employee engagement survey results',
        type: 'internal',
        category: 'Employee Engagement',
        source: 'Q1 2024 Employee Survey',
        created_by: userId,
        company_id: companyId,
        validation_status: 'validated',
        quality_score: 82,
        metrics: [
          {
            metric_name: 'Overall Engagement',
            value: 7.5,
            unit: 'scale_1_10',
            sample_size: 450,
          },
          {
            metric_name: 'Manager Satisfaction',
            value: 8.1,
            unit: 'scale_1_10',
            sample_size: 450,
          },
          {
            metric_name: 'Career Development Score',
            value: 6.8,
            unit: 'scale_1_10',
            sample_size: 450,
          },
        ],
      },
      {
        name: 'Annual Culture Assessment Internal Benchmark',
        description:
          'Internal benchmark from annual organizational culture assessment',
        type: 'internal',
        category: 'Organizational Culture',
        source: 'Annual Culture Survey 2023',
        created_by: userId,
        company_id: companyId,
        validation_status: 'validated',
        quality_score: 88,
        metrics: [
          {
            metric_name: 'Cultural Alignment',
            value: 7.9,
            unit: 'scale_1_10',
            sample_size: 520,
          },
          {
            metric_name: 'Values Integration',
            value: 8.3,
            unit: 'scale_1_10',
            sample_size: 520,
          },
          {
            metric_name: 'Innovation Culture',
            value: 7.2,
            unit: 'scale_1_10',
            sample_size: 520,
          },
        ],
      },
    ];

    const benchmarks = await Benchmark.insertMany(internalBenchmarks);
    console.log(
      `✅ Seeded ${benchmarks.length} internal benchmarks for company ${companyId}`
    );
    return benchmarks;
  } catch (error) {
    console.error('❌ Error seeding internal benchmarks:', error);
    throw error;
  }
}
