import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { checkPermissions } from '@/lib/permissions';

// GET /api/reports/filters - Get available filter options
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!checkPermissions(session.user.role, 'EXPORT_REPORTS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const Survey = (await import('@/models/Survey')).default;
    const User = (await import('@/models/User')).default;
    const Department = (await import('@/models/Department')).default;
    const Benchmark = (await import('@/models/Benchmark')).default;

    // Build query based on user role
    let companyFilter: unknown = {};
    if (session.user.role !== 'super_admin') {
      companyFilter.company_id = session.user.company_id;
    }

    // Get available surveys
    const surveys = await Survey.find(companyFilter)
      .select('_id title type start_date end_date')
      .sort({ created_at: -1 })
      .lean();

    // Get available departments
    const departments = await Department.find(companyFilter)
      .select('_id name')
      .sort({ name: 1 })
      .lean();

    // Get available survey types
    const surveyTypes = [
      { value: 'general_climate', label: 'General Climate' },
      { value: 'microclimate', label: 'Microclimate' },
      { value: 'organizational_culture', label: 'Organizational Culture' },
      { value: 'custom', label: 'Custom' },
    ];

    // Get available demographic fields with actual values from responses
    const Response = (await import('@/models/Response')).default;

    // Get unique demographic fields from actual responses
    const demographicFieldsData = await Response.aggregate([
      { $match: companyFilter },
      { $unwind: '$demographics' },
      {
        $group: {
          _id: '$demographics.field',
          values: { $addToSet: '$demographics.value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const demographicFields = demographicFieldsData.map((field) => ({
      field: field._id,
      label:
        field._id.charAt(0).toUpperCase() +
        field._id.slice(1).replace('_', ' '),
      type: 'select',
      values: field.values.sort(),
      count: field.count,
    }));

    // Add default demographic fields if no data exists
    if (demographicFields.length === 0) {
      demographicFields.push(
        {
          field: 'department',
          label: 'Department',
          type: 'select',
          values: [],
          count: 0,
        },
        { field: 'role', label: 'Role', type: 'select', values: [], count: 0 },
        {
          field: 'tenure',
          label: 'Tenure',
          type: 'select',
          values: [],
          count: 0,
        },
        {
          field: 'location',
          label: 'Location',
          type: 'select',
          values: [],
          count: 0,
        },
        {
          field: 'team_size',
          label: 'Team Size',
          type: 'select',
          values: [],
          count: 0,
        }
      );
    }

    // Get available benchmarks
    const benchmarks = await Benchmark.find({
      $or: [{ company_id: session.user.company_id }, { type: 'industry' }],
    })
      .select('_id name type category')
      .sort({ name: 1 })
      .lean();

    // Get date range suggestions
    const now = new Date();
    const dateRanges = [
      {
        label: 'Last 30 days',
        start_date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end_date: now,
      },
      {
        label: 'Last 3 months',
        start_date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end_date: now,
      },
      {
        label: 'Last 6 months',
        start_date: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        end_date: now,
      },
      {
        label: 'Last year',
        start_date: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        end_date: now,
      },
    ];

    // Get response statistics for better filtering context
    const responseStats = await Response.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: null,
          total_responses: { $sum: 1 },
          earliest_response: { $min: '$completion_time' },
          latest_response: { $max: '$completion_time' },
          unique_users: { $addToSet: '$user_id' },
        },
      },
    ]);

    const stats = responseStats[0] || {
      total_responses: 0,
      earliest_response: new Date(),
      latest_response: new Date(),
      unique_users: [],
    };

    // Get chart type options
    const chartTypes = [
      {
        value: 'response_distribution',
        label: 'Response Distribution',
        description: 'Pie chart showing survey type distribution',
      },
      {
        value: 'department_comparison',
        label: 'Department Comparison',
        description: 'Bar chart comparing departments',
      },
      {
        value: 'trend_analysis',
        label: 'Trend Analysis',
        description: 'Line chart showing trends over time',
      },
      {
        value: 'sentiment_analysis',
        label: 'Sentiment Analysis',
        description: 'Pie chart showing sentiment distribution',
      },
      {
        value: 'benchmark_comparison',
        label: 'Benchmark Comparison',
        description: 'Bar chart comparing against benchmarks',
      },
      {
        value: 'gap_analysis',
        label: 'Gap Analysis',
        description: 'Chart showing performance gaps',
      },
      {
        value: 'performance_matrix',
        label: 'Performance Matrix',
        description: 'Matrix showing performance across dimensions',
      },
    ];

    return NextResponse.json({
      surveys: surveys.map((s) => ({
        id: s._id,
        title: s.title,
        type: s.type,
        date_range: `${s.start_date.toDateString()} - ${s.end_date.toDateString()}`,
        response_count: 0, // Would need to calculate this
      })),
      departments: departments.map((d) => ({
        id: d._id,
        name: d.name,
      })),
      survey_types: surveyTypes,
      demographic_fields: demographicFields,
      benchmarks: benchmarks.map((b) => ({
        id: b._id,
        name: b.name,
        type: b.type,
        category: b.category,
      })),
      date_ranges: dateRanges,
      chart_types: chartTypes,
      statistics: {
        total_responses: stats.total_responses,
        unique_users: stats.unique_users.length,
        date_range: {
          earliest: stats.earliest_response,
          latest: stats.latest_response,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
