import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportService, ExportOptions } from '@/lib/export-service';
import { reportService } from '@/lib/report-service';
import { connectDB } from '@/lib/db';
import { AIInsight } from '@/models/AIInsight';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const {
      format,
      includeCharts,
      includeExecutiveSummary,
      sections,
      customBranding,
    } = await request.json();

    // Validate export options
    const exportOptions: ExportOptions = {
      format: format || 'pdf',
      includeCharts: includeCharts !== false,
      includeExecutiveSummary: includeExecutiveSummary !== false,
      sections: sections || [
        'overview',
        'demographics',
        'insights',
        'recommendations',
      ],
      customBranding,
    };

    if (!['pdf', 'excel', 'csv'].includes(exportOptions.format)) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }

    // Get the report with proper access control
    const Report = (await import('@/models/Report')).default;
    const report = await Report.findOne({
      _id: id,
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    }).lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get AI insights for executive summary
    let executiveSummary;
    if (exportOptions.includeExecutiveSummary) {
      try {
        const insights = await AIInsight.find({
          surveyId: { $in: report.filters?.survey_ids || [] },
          companyId: session.user.companyId,
        }).lean();

        executiveSummary = await exportService.generateExecutiveSummary(
          report,
          insights
        );
      } catch (error) {
        console.warn('Failed to generate executive summary:', error);
        // Continue without executive summary rather than failing the entire export
        executiveSummary = null;
      }
    }

    // Generate export based on format
    let exportBuffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'pdf':
        exportBuffer = await exportService.exportToPDF(
          report,
          exportOptions,
          executiveSummary
        );
        contentType = 'application/pdf';
        filename = `${(report.title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        break;

      case 'excel':
        exportBuffer = await exportService.exportToExcel(
          report,
          exportOptions,
          executiveSummary
        );
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${(report.title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        break;

      case 'csv':
        exportBuffer = await exportService.exportToCSV(report, exportOptions);
        contentType = 'text/csv';
        filename = `${(report.title || 'report').replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported format' },
          { status: 400 }
        );
    }

    // Log the export activity
    try {
      await reportService.logActivity({
        reportId: id,
        userId: session.user.id,
        action: 'export',
        details: {
          format: exportOptions.format,
          sections: exportOptions.sections,
        },
      });
    } catch (error) {
      console.warn('Failed to log export activity:', error);
      // Continue with export even if logging fails
    }

    // Return the file
    return new NextResponse(exportBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': exportBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: `Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    // Get export options and formats available for this report
    const Report = (await import('@/models/Report')).default;
    const report = await Report.findOne({
      _id: id,
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    }).lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const availableFormats = ['pdf', 'excel', 'csv'];
    const availableSections = report.sections.map((s) => s.name);

    return NextResponse.json({
      availableFormats,
      availableSections,
      defaultOptions: {
        format: 'pdf',
        includeCharts: true,
        includeExecutiveSummary: true,
        sections: availableSections,
      },
    });
  } catch (error) {
    console.error('Export options error:', error);
    return NextResponse.json(
      { error: 'Failed to get export options' },
      { status: 500 }
    );
  }
}
