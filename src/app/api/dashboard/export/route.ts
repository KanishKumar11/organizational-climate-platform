import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for dashboard export
const exportConfigSchema = z.object({
  dashboard_id: z.string().min(1, 'Dashboard ID is required'),
  export_format: z.enum(['pdf', 'png', 'jpeg', 'svg', 'json']).default('pdf'),
  export_options: z
    .object({
      include_data: z.boolean().default(true),
      include_charts: z.boolean().default(true),
      include_widgets: z.array(z.string()).optional(), // Specific widget IDs to include
      exclude_widgets: z.array(z.string()).optional(), // Widget IDs to exclude
      resolution: z.enum(['low', 'medium', 'high']).default('medium'),
      page_size: z.enum(['A4', 'A3', 'Letter', 'Legal']).default('A4'),
      orientation: z.enum(['portrait', 'landscape']).default('portrait'),
      include_timestamp: z.boolean().default(true),
      include_branding: z.boolean().default(true),
    })
    .optional(),
  filters: z
    .object({
      date_range: z
        .object({
          start_date: z.string().datetime().optional(),
          end_date: z.string().datetime().optional(),
        })
        .optional(),
      widget_filters: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  delivery: z
    .object({
      method: z.enum(['download', 'email', 'webhook']).default('download'),
      email_recipients: z.array(z.string().email()).optional(),
      webhook_url: z.string().url().optional(),
      include_link_expiry: z.boolean().default(true),
      link_expiry_hours: z.number().min(1).max(168).default(24), // 1 hour to 1 week
    })
    .optional(),
});

// POST /api/dashboard/export - Export dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const exportConfig = exportConfigSchema.parse(body);

    const { db } = await connectToDatabase();

    // Verify dashboard access
    const dashboard = await db.collection('dashboard_configurations').findOne({
      dashboard_id: exportConfig.dashboard_id,
      $or: [
        { user_id: session.user.id },
        { is_shared: true, company_id: session.user.companyId },
      ],
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard not found or access denied' },
        { status: 404 }
      );
    }

    // Generate export
    const exportResult = await generateDashboardExport({
      dashboard,
      exportConfig,
      user: session.user,
    });

    // Log export activity
    await db.collection('dashboard_export_logs').insertOne({
      dashboard_id: exportConfig.dashboard_id,
      user_id: session.user.id,
      company_id: session.user.companyId,
      export_format: exportConfig.export_format,
      export_options: exportConfig.export_options,
      export_id: exportResult.export_id,
      created_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      export: exportResult,
    });
  } catch (error) {
    console.error('Error exporting dashboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export dashboard' },
      { status: 500 }
    );
  }
}

// GET /api/dashboard/export - Get export status or download
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const export_id = searchParams.get('export_id');
    const dashboard_id = searchParams.get('dashboard_id');
    const action = searchParams.get('action'); // 'status' or 'download'

    const { db } = await connectToDatabase();

    if (export_id) {
      // Get specific export status
      const exportLog = await db.collection('dashboard_export_logs').findOne({
        export_id,
        user_id: session.user.id,
      });

      if (!exportLog) {
        return NextResponse.json(
          { error: 'Export not found' },
          { status: 404 }
        );
      }

      if (action === 'download') {
        // Generate download link or stream file
        const downloadResult = await getExportDownload(export_id, exportLog);
        return NextResponse.json({
          success: true,
          download: downloadResult,
        });
      }

      // Return export status
      const status = await getExportStatus(export_id);
      return NextResponse.json({
        success: true,
        export_status: status,
      });
    }

    if (dashboard_id) {
      // Get export history for dashboard
      const exportHistory = await db
        .collection('dashboard_export_logs')
        .find({
          dashboard_id,
          user_id: session.user.id,
        })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();

      return NextResponse.json({
        success: true,
        export_history: exportHistory.map((log) => ({
          ...log,
          id: log._id.toString(),
        })),
      });
    }

    return NextResponse.json(
      { error: 'Export ID or Dashboard ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting dashboard export:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard export' },
      { status: 500 }
    );
  }
}

async function generateDashboardExport({
  dashboard,
  exportConfig,
  user,
}: {
  dashboard: any;
  exportConfig: any;
  user: any;
}) {
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // This would integrate with your actual export service
  // For now, we'll simulate the export process

  const exportData = {
    export_id: exportId,
    status: 'processing',
    dashboard_id: exportConfig.dashboard_id,
    format: exportConfig.export_format,
    created_at: new Date(),
    estimated_completion: new Date(Date.now() + 60000), // 1 minute from now
  };

  // In a real implementation, you would:
  // 1. Queue the export job
  // 2. Generate the actual export file
  // 3. Store it in cloud storage
  // 4. Send notifications if configured

  // Simulate processing time based on format
  const processingTime = {
    pdf: 30000, // 30 seconds
    png: 15000, // 15 seconds
    jpeg: 15000, // 15 seconds
    svg: 10000, // 10 seconds
    json: 5000, // 5 seconds
  };

  setTimeout(
    async () => {
      // Update status to completed
      const { db } = await connectToDatabase();
      await db.collection('dashboard_export_logs').updateOne(
        { export_id: exportId },
        {
          $set: {
            status: 'completed',
            completed_at: new Date(),
            file_url: `https://exports.example.com/${exportId}.${exportConfig.export_format}`,
            file_size: Math.floor(Math.random() * 5000000) + 100000, // Random size between 100KB and 5MB
          },
        }
      );

      // Send email notification if configured
      if (
        exportConfig.delivery?.method === 'email' &&
        exportConfig.delivery.email_recipients
      ) {
        // Send email notification (implement with your email service)
        console.log(
          `Sending export notification to: ${exportConfig.delivery.email_recipients.join(', ')}`
        );
      }

      // Send webhook notification if configured
      if (
        exportConfig.delivery?.method === 'webhook' &&
        exportConfig.delivery.webhook_url
      ) {
        // Send webhook (implement with your webhook service)
        console.log(`Sending webhook to: ${exportConfig.delivery.webhook_url}`);
      }
    },
    processingTime[exportConfig.export_format as keyof typeof processingTime] ||
      30000
  );

  return exportData;
}

async function getExportStatus(exportId: string) {
  const { db } = await connectToDatabase();

  const exportLog = await db.collection('dashboard_export_logs').findOne({
    export_id: exportId,
  });

  if (!exportLog) {
    return { status: 'not_found' };
  }

  return {
    export_id: exportId,
    status: exportLog.status || 'processing',
    created_at: exportLog.created_at,
    completed_at: exportLog.completed_at,
    file_url: exportLog.file_url,
    file_size: exportLog.file_size,
    error_message: exportLog.error_message,
  };
}

async function getExportDownload(exportId: string, exportLog: any) {
  // In a real implementation, this would:
  // 1. Verify the export is completed
  // 2. Check file expiry
  // 3. Generate a secure download URL
  // 4. Return the download information

  if (exportLog.status !== 'completed') {
    throw new Error('Export not completed yet');
  }

  // Check if file has expired
  const expiryHours = exportLog.link_expiry_hours || 24;
  const expiryTime = new Date(
    exportLog.created_at.getTime() + expiryHours * 60 * 60 * 1000
  );

  if (new Date() > expiryTime) {
    throw new Error('Export file has expired');
  }

  return {
    download_url: exportLog.file_url,
    expires_at: expiryTime,
    file_size: exportLog.file_size,
    content_type: getContentType(exportLog.export_format),
  };
}

function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
    json: 'application/json',
  };

  return contentTypes[format] || 'application/octet-stream';
}
