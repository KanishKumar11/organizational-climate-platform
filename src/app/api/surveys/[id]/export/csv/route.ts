import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Response } from '@/models/Response';
import { Survey } from '@/models/Survey';
import { User } from '@/models/User';
import { exportSurveyToCSV, SurveyCSVData } from '@/lib/csv-export-service';

/**
 * GET /api/surveys/[id]/export/csv
 * Export survey responses as CSV
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

    // Get format parameter (long, wide, summary)
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'long') as 'long' | 'wide' | 'summary';

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

    // Fetch responses with user data
    const responses = await (Response as any)
      .find({ survey_id: id })
      .populate('user_id', 'name email department position employee_id')
      .lean();

    // Prepare CSV data
    const csvData: SurveyCSVData = {
      surveyId: id,
      surveyTitle: survey.title,
      surveyType: survey.type,
      responses: responses.map((response: any) => ({
        responseId: response._id.toString(),
        userId: response.user_id?._id?.toString() || 'Anonymous',
        userName: response.user_id?.name || 'Anonymous',
        userEmail: response.user_id?.email || 'anonymous@example.com',
        department: response.user_id?.department?.name,
        position: response.user_id?.position,
        submittedAt: response.submitted_at || response.created_at,
        timeToComplete: response.time_to_complete,
        answers: response.answers.map((answer: any) => {
          const question = survey.questions.find(
            (q: any) => q._id.toString() === answer.question_id
          );

          return {
            questionId: answer.question_id,
            questionText: question?.text || 'Unknown Question',
            questionType: question?.question_type || 'unknown',
            answer: answer.response_value,
            answerText: answer.response_text,
            score: answer.score,
          };
        }),
        demographics: response.demographics || {},
      })),
    };

    // Generate CSV
    const csvContent = exportSurveyToCSV(csvData, format);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format}-${Date.now()}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting survey to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export survey', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
