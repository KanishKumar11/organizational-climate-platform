import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Microclimate } from '@/models/Microclimate';
import { Response } from '@/models/Response';
import { User } from '@/models/User';
import { CSVExportService } from '@/lib/csv-export-service';

/**
 * GET /api/microclimates/[id]/export/csv
 * Export microclimate responses as CSV
 * 
 * Query params:
 * - format: 'long' (default), 'wide', or 'summary'
 */
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

    // Get format from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'long';

    if (!['long', 'wide', 'summary'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use: long, wide, or summary' }, { status: 400 });
    }

    // Fetch microclimate
    const microclimate = await (Microclimate as any)
      .findById(id)
      .populate('created_by', 'name email')
      .lean();

    if (!microclimate) {
      return NextResponse.json({ error: 'Microclimate not found' }, { status: 404 });
    }

    // Check permissions
    const user = await (User as any).findById(session.user.id);
    if (
      user.role !== 'super_admin' &&
      user.role !== 'company_admin' &&
      microclimate.created_by._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch responses with user data
    const responses = await (Response as any)
      .find({ survey_id: id })
      .populate('user_id', 'name email demographics')
      .lean();

    // Map responses to include question text
    const mappedResponses = responses.map((response: any) => ({
      ...response,
      answers: response.answers.map((answer: any) => {
        const question = microclimate.questions.find(
          (q: any) => q._id.toString() === answer.question_id
        );
        return {
          ...answer,
          question_text: question?.text || 'Unknown Question',
          question_type: question?.question_type || question?.type || 'text',
        };
      }),
    }));

    // Prepare CSV data
    const csvData = {
      microclimateId: id,
      microclimateTitle: microclimate.name || microclimate.title,
      responses: mappedResponses.map((r: any) => ({
        responseId: r._id.toString(),
        userId: r.user_id?._id?.toString() || 'anonymous',
        userName: r.user_id?.name || 'Anonymous',
        submittedAt: r.submitted_at || r.created_at,
        answers: r.answers.map((a: any) => ({
          questionId: a.question_id,
          questionText: a.question_text,
          answer: a.response_value || a.answer_text,
        })),
      })),
    };

    // Generate CSV using CSVExportService
    const csvService = new CSVExportService();
    const csvContent = csvService.exportMicroclimateResponses(csvData);

    // Return CSV file
    const filename = `microclimate-${(microclimate.name || microclimate.title).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format}-${Date.now()}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting microclimate to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export microclimate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
