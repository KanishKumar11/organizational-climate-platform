import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
// import { hasPermission } from '@/lib/permissions';

// Export survey results
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

    const surveyId = id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const includeOpenText = searchParams.get('include_open_text') === 'true';
    const departmentId = searchParams.get('department');

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build response query
    const responseQuery: Record<string, unknown> = {
      survey_id: surveyId,
      is_complete: true,
    };

    // Apply department filtering for department admins
    if (session.user.role === 'department_admin' && session.user.departmentId) {
      responseQuery.department_id = session.user.departmentId;
    } else if (departmentId) {
      responseQuery.department_id = departmentId;
    }

    // Get all completed responses
    const responses = await Response.find(responseQuery).sort({
      created_at: 1,
    });

    if (format === 'csv') {
      const csvData = generateCSV(survey, responses, includeOpenText);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = generateJSON(survey, responses, includeOpenText);

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting survey results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(
  survey: any,
  responses: any[],
  includeOpenText: boolean
): string {
  const headers = [
    'Response ID',
    'User ID',
    'Department ID',
    'Completion Time',
    'Total Time (seconds)',
  ];

  // Add demographic headers
  survey.demographics.forEach((demo: any) => {
    headers.push(`Demo: ${demo.label}`);
  });

  // Add question headers
  survey.questions.forEach((question: any) => {
    headers.push(
      `Q${question.order + 1}: ${question.text.substring(0, 50)}...`
    );
    if (includeOpenText && question.type === 'open_ended') {
      headers.push(`Q${question.order + 1} (Text)`);
    }
  });

  const csvRows = [headers.join(',')];

  responses.forEach((response) => {
    const row = [
      response._id.toString(),
      response.user_id || 'Anonymous',
      response.department_id || '',
      response.completion_time
        ? new Date(response.completion_time).toISOString()
        : '',
      response.total_time_seconds || '',
    ];

    // Add demographic values
    survey.demographics.forEach((demo: any) => {
      const demoResponse = response.demographics.find(
        (d: any) => d.field === demo.field
      );
      row.push(demoResponse ? String(demoResponse.value) : '');
    });

    // Add question responses
    survey.questions.forEach((question: any) => {
      const questionResponse = response.responses.find(
        (r: any) => r.question_id === question.id
      );
      if (questionResponse) {
        let value = questionResponse.response_value;
        if (Array.isArray(value)) {
          value = value.join('; ');
        }
        row.push(String(value));

        if (includeOpenText && question.type === 'open_ended') {
          row.push(questionResponse.response_text || '');
        }
      } else {
        row.push('');
        if (includeOpenText && question.type === 'open_ended') {
          row.push('');
        }
      }
    });

    // Escape commas and quotes in CSV
    const escapedRow = row.map((cell) => {
      const cellStr = String(cell);
      if (
        cellStr.includes(',') ||
        cellStr.includes('"') ||
        cellStr.includes('\n')
      ) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    });

    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
}

function generateJSON(survey: any, responses: any[], includeOpenText: boolean) {
  return {
    survey: {
      id: survey._id,
      title: survey.title,
      type: survey.type,
      created_at: survey.created_at,
      start_date: survey.start_date,
      end_date: survey.end_date,
    },
    questions: survey.questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      options: q.options,
    })),
    demographics: survey.demographics,
    responses: responses.map((response) => ({
      id: response._id,
      user_id: response.user_id,
      department_id: response.department_id,
      completion_time: response.completion_time,
      total_time_seconds: response.total_time_seconds,
      demographics: response.demographics,
      responses: includeOpenText
        ? response.responses
        : response.responses.map((r: unknown) => ({
            question_id: (r as any).question_id,
            response_value: (r as any).response_value,
            // Exclude response_text for non-open-ended questions unless specifically requested
            ...(includeOpenText && { response_text: (r as any).response_text }),
          })),
    })),
    export_metadata: {
      exported_at: new Date(),
      total_responses: responses.length,
      include_open_text: includeOpenText,
    },
  };
}
