import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Response } from '@/models/Response';
import { Survey } from '@/models/Survey';
import { User } from '@/models/User';
import { exportSurveyToPDF, SurveyPDFData } from '@/lib/pdf-export-service';

/**
 * GET /api/surveys/[id]/export/pdf
 * Export survey results as PDF
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

    // Fetch survey
    const survey = await (Survey as any)
      .findById(id)
      .populate('created_by', 'name email')
      .lean();

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    const user = await (User as any).findById(session.user.id);
    if (
      user.role !== 'super_admin' &&
      user.role !== 'company_admin' &&
      survey.created_by._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch responses
    const responses = await (Response as any)
      .find({ survey_id: id })
      .populate('user_id', 'name email department position')
      .lean();

    // Calculate statistics
    const responseCount = responses.length;
    const targetCount = survey.target_users?.length || 0;
    const completionRate =
      targetCount > 0 ? (responseCount / targetCount) * 100 : 0;

    // Prepare question data
    const questionData = survey.questions.map((question: any) => {
      const questionResponses = responses.filter((r: any) =>
        r.answers.some((a: any) => a.question_id === question._id.toString())
      );

      const scores = questionResponses
        .map((r: any) => {
          const answer = r.answers.find(
            (a: any) => a.question_id === question._id.toString()
          );
          return answer?.score;
        })
        .filter((s: any): s is number => typeof s === 'number');

      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : undefined;

      // Calculate distribution
      const distribution: Record<string, number> = {};
      questionResponses.forEach((r: any) => {
        const answer = r.answers.find(
          (a: any) => a.question_id === question._id.toString()
        );
        const key = String(answer?.response_value || 'No Response');
        distribution[key] = (distribution[key] || 0) + 1;
      });

      return {
        text: question.text,
        type: question.question_type,
        responses_count: questionResponses.length,
        average_score: averageScore,
        distribution,
      };
    });

    // Prepare demographics data
    const demographicsData: Array<{
      field: string;
      distribution: Record<string, number>;
    }> = [];

    if (survey.demographics && survey.demographics.length > 0) {
      survey.demographics.forEach((demo: any) => {
        const distribution: Record<string, number> = {};
        responses.forEach((r: any) => {
          const demoValue =
            r.demographics?.[demo.field_name] || 'Not Specified';
          distribution[demoValue] = (distribution[demoValue] || 0) + 1;
        });

        demographicsData.push({
          field: demo.field_label || demo.field_name,
          distribution,
        });
      });
    }

    // Prepare AI insights (if available)
    const insights =
      survey.ai_insights?.map((insight: any) => ({
        category: insight.category || 'General',
        insight: insight.insight || insight.message,
        confidence: insight.confidence || 0.5,
        priority: insight.priority || 'medium',
      })) || [];

    // Prepare PDF data
    const pdfData: SurveyPDFData = {
      survey: {
        title: survey.title,
        description: survey.description,
        type: survey.type,
        start_date: survey.start_date,
        end_date: survey.end_date,
        status: survey.status,
        response_count: responseCount,
        target_count: targetCount,
        completion_rate: completionRate,
      },
      questions: questionData,
      demographics: demographicsData,
      insights,
    };

    // Generate PDF
    const pdfBlob = await exportSurveyToPDF(pdfData, {
      companyName: user.company_id?.name || 'Organizational Climate Platform',
      brandColor: '#4F46E5',
    });

    // Convert Blob to Buffer for Next.js response
    const buffer = await pdfBlob.arrayBuffer();

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting survey to PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to export survey',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
