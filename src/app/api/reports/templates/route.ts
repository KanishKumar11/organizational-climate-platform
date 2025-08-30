import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReportService } from '@/lib/report-service';
import { checkPermissions } from '@/lib/permissions';

// GET /api/reports/templates - Get available report templates
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

    const templates = ReportService.getDefaultTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report templates' },
      { status: 500 }
    );
  }
}

// POST /api/reports/templates - Create custom report template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only company admins and above can create templates
    if (!checkPermissions(session.user.role, 'MANAGE_COMPANY')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, type, config, default_filters } = body;

    // Validate required fields
    if (!name || !type || !config) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create custom template
    const template = {
      id: `custom_${Date.now()}`,
      name,
      description,
      type,
      config,
      default_filters,
      is_system_template: false,
      created_by: session.user.id,
      company_id: session.user.companyId,
    };

    // In a real implementation, you would save this to a database
    // For now, we'll just return the template
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating report template:', error);
    return NextResponse.json(
      { error: 'Failed to create report template' },
      { status: 500 }
    );
  }
}


