import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Microclimate } from '@/models/Microclimate';
import { Response } from '@/models/Response';
import { User } from '@/models/User';
import {
  exportMicroclimateToPDF,
  MicroclimatePDFData,
} from '@/lib/pdf-export-service';

/**
 * GET /api/microclimates/[id]/export/pdf
 * Export microclimate results as PDF
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

    // Fetch microclimate
    const microclimate = await (Microclimate as any)
      .findById(id)
      .populate('created_by', 'name email')
      .lean();

    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
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

    // Fetch responses
    const responses = await (Response as any)
      .find({ survey_id: id })
      .populate('user_id', 'name email')
      .lean();

    // Prepare question data
    const questionData = microclimate.questions.map((question: any) => {
      const questionResponses = responses.filter((r: any) =>
        r.answers.some((a: any) => a.question_id === question._id.toString())
      );

      // Calculate distribution
      const distribution: Record<string, number> = {};
      questionResponses.forEach((r: any) => {
        const answer = r.answers.find(
          (a: any) => a.question_id === question._id.toString()
        );
        const key = String(answer?.response_value || 'No Response');
        distribution[key] = (distribution[key] || 0) + 1;
      });

      const totalResponses = questionResponses.length;

      return {
        question: question.text,
        type: question.question_type || question.type,
        responses: Object.entries(distribution).map(([option, count]) => ({
          option,
          count,
          percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
        })),
      };
    });

    // Prepare PDF data
    const pdfData: MicroclimatePDFData = {
      microclimate: {
        title: microclimate.name || microclimate.title,
        description: microclimate.description,
        status: microclimate.status,
        response_count: microclimate.response_count || responses.length,
        participation_rate: microclimate.participation_rate || 0,
        sentiment_score: microclimate.live_results?.sentiment_score || 0,
        engagement_level:
          microclimate.live_results?.engagement_level || 'medium',
      },
      wordCloud: microclimate.live_results?.word_cloud_data || [],
      questions: questionData,
      aiInsights: microclimate.ai_insights || [],
    };

    // Generate PDF
    const pdfBlob = await exportMicroclimateToPDF(pdfData, {
      companyName: user.company_id?.name || 'Organizational Climate Platform',
      brandColor: '#4F46E5',
    });

    // Convert Blob to Buffer for Next.js response
    const buffer = await pdfBlob.arrayBuffer();

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="microclimate-${(microclimate.name || microclimate.title).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting microclimate to PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to export microclimate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
