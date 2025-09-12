import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for widget configuration
const widgetConfigSchema = z.object({
  id: z.string().min(1, 'Widget ID is required'),
  type: z.enum([
    'kpi_card',
    'chart',
    'progress_bar',
    'alert_list',
    'recent_activity',
    'survey_status',
    'action_plan_summary',
    'ai_insights',
    'participation_tracker',
    'benchmark_comparison',
  ]),
  title: z.string().min(1, 'Widget title is required'),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  config: z.object({
    data_source: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
    refresh_interval: z.number().min(30).optional(), // seconds
    chart_type: z.enum(['bar', 'line', 'pie', 'doughnut', 'area']).optional(),
    color_scheme: z.string().optional(),
    show_legend: z.boolean().optional(),
    show_labels: z.boolean().optional(),
    date_range: z.enum(['7d', '30d', '90d', '1y', 'custom']).optional(),
    custom_date_range: z
      .object({
        start: z.string().datetime().optional(),
        end: z.string().datetime().optional(),
      })
      .optional(),
  }),
  permissions: z
    .object({
      roles: z.array(z.string()).optional(),
      companies: z.array(z.string()).optional(),
      departments: z.array(z.string()).optional(),
    })
    .optional(),
  is_active: z.boolean().default(true),
});

const dashboardConfigSchema = z.object({
  dashboard_id: z.string().min(1, 'Dashboard ID is required'),
  widgets: z.array(widgetConfigSchema),
  layout_config: z
    .object({
      columns: z.number().min(1).max(12).default(3),
      row_height: z.number().min(50).default(150),
      margin: z.array(z.number()).length(2).default([10, 10]),
      container_padding: z.array(z.number()).length(2).default([10, 10]),
      breakpoints: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
});

// GET /api/dashboard/widgets - Get available widget types and configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dashboard_id = searchParams.get('dashboard_id');
    const widget_type = searchParams.get('type');

    const { db } = await connectToDatabase();

    if (dashboard_id) {
      // Get widgets for specific dashboard
      const dashboard = await db
        .collection('dashboard_configurations')
        .findOne({
          dashboard_id,
          $or: [
            { user_id: session.user.id },
            { is_shared: true, company_id: session.user.companyId },
          ],
        });

      if (!dashboard) {
        return NextResponse.json(
          { error: 'Dashboard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        dashboard_id,
        widgets: dashboard.widgets || [],
        layout_config: dashboard.layout_config || {},
      });
    }

    // Get available widget types
    const availableWidgets = getAvailableWidgetTypes(session.user.role);

    if (widget_type) {
      const widgetConfig = availableWidgets.find((w) => w.type === widget_type);
      if (!widgetConfig) {
        return NextResponse.json(
          { error: 'Widget type not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        widget: widgetConfig,
      });
    }

    return NextResponse.json({
      success: true,
      available_widgets: availableWidgets,
    });
  } catch (error) {
    console.error('Error fetching dashboard widgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard widgets' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/widgets - Create or update dashboard widget configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dashboard_id, widgets, layout_config } =
      dashboardConfigSchema.parse(body);

    const { db } = await connectToDatabase();

    // Validate widget permissions
    for (const widget of widgets) {
      if (!hasWidgetPermission(widget, session.user)) {
        return NextResponse.json(
          { error: `Insufficient permissions for widget: ${widget.title}` },
          { status: 403 }
        );
      }
    }

    const configData = {
      dashboard_id,
      user_id: session.user.id,
      company_id: session.user.companyId,
      widgets,
      layout_config: layout_config || {
        columns: 3,
        row_height: 150,
        margin: [10, 10],
        container_padding: [10, 10],
      },
      updated_at: new Date(),
    };

    // Upsert dashboard configuration
    const result = await db
      .collection('dashboard_configurations')
      .findOneAndUpdate(
        { dashboard_id, user_id: session.user.id },
        {
          $set: configData,
          $setOnInsert: { created_at: new Date() },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

    return NextResponse.json({
      success: true,
      configuration: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error saving dashboard widget configuration:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save dashboard configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/widgets - Update specific widget configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dashboard_id, widget_id, widget_config } = body;

    if (!dashboard_id || !widget_id || !widget_config) {
      return NextResponse.json(
        { error: 'Dashboard ID, widget ID, and widget config are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Update specific widget in dashboard
    const result = await db
      .collection('dashboard_configurations')
      .findOneAndUpdate(
        {
          dashboard_id,
          user_id: session.user.id,
          'widgets.id': widget_id,
        },
        {
          $set: {
            'widgets.$': widget_config,
            updated_at: new Date(),
          },
        },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      return NextResponse.json(
        { error: 'Dashboard or widget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      configuration: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating widget configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update widget configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/widgets - Remove widget from dashboard
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dashboard_id = searchParams.get('dashboard_id');
    const widget_id = searchParams.get('widget_id');

    if (!dashboard_id || !widget_id) {
      return NextResponse.json(
        { error: 'Dashboard ID and widget ID are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Remove widget from dashboard
    const result = await db
      .collection('dashboard_configurations')
      .findOneAndUpdate(
        {
          dashboard_id,
          user_id: session.user.id,
        },
        {
          $pull: { widgets: { id: widget_id } },
          $set: { updated_at: new Date() },
        },
        { returnDocument: 'after' }
      );

    if (!result.value) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Widget removed successfully',
    });
  } catch (error) {
    console.error('Error removing widget:', error);
    return NextResponse.json(
      { error: 'Failed to remove widget' },
      { status: 500 }
    );
  }
}

function getAvailableWidgetTypes(userRole: string) {
  const baseWidgets = [
    {
      type: 'kpi_card',
      name: 'KPI Card',
      description: 'Display key performance indicators',
      category: 'metrics',
      default_size: { width: 1, height: 1 },
      config_options: ['data_source', 'filters', 'color_scheme'],
    },
    {
      type: 'chart',
      name: 'Chart Widget',
      description: 'Display data in various chart formats',
      category: 'visualization',
      default_size: { width: 2, height: 2 },
      config_options: [
        'chart_type',
        'data_source',
        'filters',
        'color_scheme',
        'show_legend',
      ],
    },
    {
      type: 'progress_bar',
      name: 'Progress Bar',
      description: 'Show progress towards goals',
      category: 'metrics',
      default_size: { width: 2, height: 1 },
      config_options: ['data_source', 'filters', 'color_scheme'],
    },
    {
      type: 'recent_activity',
      name: 'Recent Activity',
      description: 'Show recent system activity',
      category: 'activity',
      default_size: { width: 2, height: 2 },
      config_options: ['filters', 'refresh_interval'],
    },
  ];

  const adminWidgets = [
    {
      type: 'alert_list',
      name: 'Alert List',
      description: 'Display system alerts and notifications',
      category: 'alerts',
      default_size: { width: 2, height: 2 },
      config_options: ['filters', 'refresh_interval'],
    },
    {
      type: 'survey_status',
      name: 'Survey Status',
      description: 'Overview of survey statuses',
      category: 'surveys',
      default_size: { width: 2, height: 1 },
      config_options: ['filters', 'date_range'],
    },
    {
      type: 'action_plan_summary',
      name: 'Action Plan Summary',
      description: 'Summary of action plan progress',
      category: 'action_plans',
      default_size: { width: 2, height: 2 },
      config_options: ['filters', 'date_range'],
    },
  ];

  const superAdminWidgets = [
    {
      type: 'ai_insights',
      name: 'AI Insights',
      description: 'Display AI-generated insights',
      category: 'ai',
      default_size: { width: 3, height: 2 },
      config_options: ['filters', 'refresh_interval'],
    },
    {
      type: 'benchmark_comparison',
      name: 'Benchmark Comparison',
      description: 'Compare against benchmarks',
      category: 'benchmarks',
      default_size: { width: 2, height: 2 },
      config_options: ['data_source', 'filters'],
    },
  ];

  let availableWidgets = [...baseWidgets];

  if (['company_admin', 'department_admin', 'super_admin'].includes(userRole)) {
    availableWidgets.push(...adminWidgets);
  }

  if (userRole === 'super_admin') {
    availableWidgets.push(...superAdminWidgets);
  }

  return availableWidgets;
}

function hasWidgetPermission(widget: any, user: any): boolean {
  // Check role-based permissions
  if (
    widget.permissions?.roles &&
    !widget.permissions.roles.includes(user.role)
  ) {
    return false;
  }

  // Check company-based permissions
  if (
    widget.permissions?.companies &&
    !widget.permissions.companies.includes(user.companyId)
  ) {
    return false;
  }

  // Check department-based permissions
  if (
    widget.permissions?.departments &&
    !widget.permissions.departments.includes(user.departmentId)
  ) {
    return false;
  }

  return true;
}
