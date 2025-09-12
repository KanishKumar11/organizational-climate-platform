import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for report configuration
const reportConfigSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  report_type: z.enum([
    'survey_analysis',
    'microclimate_summary',
    'action_plan_progress',
    'benchmark_comparison',
    'ai_insights_summary',
    'engagement_trends',
    'custom_dashboard',
  ]),
  data_sources: z.array(
    z.object({
      type: z.enum([
        'survey',
        'microclimate',
        'action_plan',
        'benchmark',
        'ai_insight',
      ]),
      source_ids: z.array(z.string()),
      filters: z.record(z.string(), z.any()).optional(),
    })
  ),
  visualization_config: z
    .object({
      chart_types: z.array(z.string()).default(['bar', 'line', 'pie']),
      color_scheme: z.string().default('default'),
      include_tables: z.boolean().default(true),
      include_charts: z.boolean().default(true),
      include_insights: z.boolean().default(true),
    })
    .optional(),
  filters: z
    .object({
      date_range: z
        .object({
          start_date: z.string().datetime().optional(),
          end_date: z.string().datetime().optional(),
          preset: z.enum(['7d', '30d', '90d', '1y', 'custom']).optional(),
        })
        .optional(),
      demographics: z
        .object({
          departments: z.array(z.string()).optional(),
          roles: z.array(z.string()).optional(),
          tenure_ranges: z.array(z.string()).optional(),
          custom_attributes: z.record(z.string(), z.any()).optional(),
        })
        .optional(),
      performance_metrics: z
        .object({
          min_response_rate: z.number().min(0).max(100).optional(),
          min_engagement_score: z.number().min(0).max(10).optional(),
          categories: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
  export_settings: z
    .object({
      formats: z
        .array(z.enum(['pdf', 'excel', 'csv', 'json']))
        .default(['pdf']),
      include_raw_data: z.boolean().default(false),
      include_executive_summary: z.boolean().default(true),
      branding: z
        .object({
          logo_url: z.string().optional(),
          company_colors: z.array(z.string()).optional(),
          footer_text: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  schedule: z
    .object({
      frequency: z
        .enum(['once', 'daily', 'weekly', 'monthly', 'quarterly'])
        .default('once'),
      day_of_week: z.number().min(0).max(6).optional(), // 0 = Sunday
      day_of_month: z.number().min(1).max(31).optional(),
      time: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .default('09:00'),
      timezone: z.string().default('UTC'),
      recipients: z.array(z.string()).default([]),
    })
    .optional(),
  is_template: z.boolean().default(false),
  is_shared: z.boolean().default(false),
});

// GET /api/reports/configuration - Get report configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const config_id = searchParams.get('config_id');
    const report_type = searchParams.get('report_type');
    const include_templates = searchParams.get('include_templates') === 'true';
    const include_shared = searchParams.get('include_shared') === 'true';

    const { db } = await connectToDatabase();

    if (config_id) {
      // Get specific configuration
      const config = await db.collection('report_configurations').findOne({
        _id: config_id,
        $or: [
          { created_by: session.user.id },
          { company_id: session.user.companyId, is_shared: true },
        ],
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        configuration: {
          ...config,
          id: config._id.toString(),
        },
      });
    }

    // Get all available configurations
    let query: any = {
      $or: [{ created_by: session.user.id }],
    };

    if (include_shared) {
      query.$or.push({ company_id: session.user.companyId, is_shared: true });
    }

    if (include_templates) {
      query.$or.push({ is_template: true });
    }

    if (report_type) {
      query.report_type = report_type;
    }

    const configurations = await db
      .collection('report_configurations')
      .find(query)
      .sort({ name: 1 })
      .toArray();

    // Include built-in templates
    const builtInTemplates = getBuiltInReportTemplates();

    return NextResponse.json({
      success: true,
      configurations: [
        ...builtInTemplates,
        ...configurations.map((config) => ({
          ...config,
          id: config._id.toString(),
        })),
      ],
    });
  } catch (error) {
    console.error('Error fetching report configurations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report configurations' },
      { status: 500 }
    );
  }
}

// POST /api/reports/configuration - Create report configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create report configurations
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const configData = reportConfigSchema.parse(body);

    const { db } = await connectToDatabase();

    // Check if configuration name already exists for this company
    const existingConfig = await db
      .collection('report_configurations')
      .findOne({
        name: configData.name,
        company_id: session.user.companyId,
      });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Configuration name already exists' },
        { status: 409 }
      );
    }

    const configuration = {
      ...configData,
      created_by: session.user.id,
      company_id: session.user.companyId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db
      .collection('report_configurations')
      .insertOne(configuration);

    return NextResponse.json(
      {
        success: true,
        configuration: {
          ...configuration,
          id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create report configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/configuration - Update report configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { config_id, ...updateData } = body;

    if (!config_id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const validatedData = reportConfigSchema.partial().parse(updateData);

    const { db } = await connectToDatabase();

    // Verify ownership
    const existingConfig = await db
      .collection('report_configurations')
      .findOne({
        _id: config_id,
        $or: [
          { created_by: session.user.id },
          { company_id: session.user.companyId, is_shared: true },
        ],
      });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found or access denied' },
        { status: 404 }
      );
    }

    // Only creator or admin can modify
    if (
      existingConfig.created_by !== session.user.id &&
      !['super_admin', 'company_admin'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions to modify this configuration' },
        { status: 403 }
      );
    }

    const result = await db
      .collection('report_configurations')
      .findOneAndUpdate(
        { _id: config_id },
        {
          $set: {
            ...validatedData,
            updated_at: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

    return NextResponse.json({
      success: true,
      configuration: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating report configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update report configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/configuration - Delete report configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const config_id = searchParams.get('config_id');

    if (!config_id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership
    const existingConfig = await db
      .collection('report_configurations')
      .findOne({
        _id: config_id,
        created_by: session.user.id,
      });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found or access denied' },
        { status: 404 }
      );
    }

    await db.collection('report_configurations').deleteOne({ _id: config_id });

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting report configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete report configuration' },
      { status: 500 }
    );
  }
}

function getBuiltInReportTemplates() {
  return [
    {
      id: 'survey-analysis-template',
      name: 'Survey Analysis Report',
      description: 'Comprehensive survey results analysis',
      report_type: 'survey_analysis',
      is_template: true,
      is_built_in: true,
      visualization_config: {
        chart_types: ['bar', 'line', 'pie'],
        include_tables: true,
        include_charts: true,
        include_insights: true,
      },
    },
    {
      id: 'executive-summary-template',
      name: 'Executive Summary',
      description: 'High-level overview for executives',
      report_type: 'custom_dashboard',
      is_template: true,
      is_built_in: true,
      visualization_config: {
        chart_types: ['bar', 'pie'],
        include_tables: false,
        include_charts: true,
        include_insights: true,
      },
    },
    {
      id: 'action-plan-progress-template',
      name: 'Action Plan Progress Report',
      description: 'Track action plan implementation progress',
      report_type: 'action_plan_progress',
      is_template: true,
      is_built_in: true,
      visualization_config: {
        chart_types: ['bar', 'line'],
        include_tables: true,
        include_charts: true,
        include_insights: true,
      },
    },
    {
      id: 'benchmark-comparison-template',
      name: 'Benchmark Comparison Report',
      description: 'Compare performance against benchmarks',
      report_type: 'benchmark_comparison',
      is_template: true,
      is_built_in: true,
      visualization_config: {
        chart_types: ['bar', 'line'],
        include_tables: true,
        include_charts: true,
        include_insights: true,
      },
    },
  ];
}
