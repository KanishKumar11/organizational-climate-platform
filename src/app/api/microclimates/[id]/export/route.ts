import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import Response from '@/models/Response';

// Export microclimate results
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

    const microclimateId = id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const includeOpenText = searchParams.get('include_open_text') === 'true';
    const includeTimestamps = searchParams.get('include_timestamps') === 'true';

    // Get microclimate
    const microclimate = await Microclimate.findById(microclimateId);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all responses
    const responses = await Response.find({
      survey_id: microclimateId,
      survey_type: 'microclimate',
    }).sort({ created_at: 1 });

    if (format === 'csv') {
      const csvData = generateMicroclimateCSV(
        microclimate,
        responses,
        includeOpenText,
        includeTimestamps
      );

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${microclimate.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = generateMicroclimateJSON(
        microclimate,
        responses,
        includeOpenText,
        includeTimestamps
      );

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${microclimate.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting microclimate results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMicroclimateCSV(
  microclimate: any,
  responses: any[],
  includeOpenText: boolean,
  includeTimestamps: boolean
): string {
  const headers = ['Response ID', 'User ID'];

  if (includeTimestamps) {
    headers.push('Response Time', 'Duration (seconds)');
  }

  // Add question headers
  microclimate.questions.forEach((question: any) => {
    headers.push(
      `Q${question.order + 1}: ${question.text.substring(0, 50)}...`
    );
    if (includeOpenText && question.type === 'open_ended') {
      headers.push(`Q${question.order + 1} (Text)`);
    }
  });

  const csvRows = [headers.join(',')];

  responses.forEach((response) => {
    const row = [response._id.toString(), response.user_id || 'Anonymous'];

    if (includeTimestamps) {
      row.push(
        response.created_at ? new Date(response.created_at).toISOString() : '',
        response.total_time_seconds || ''
      );
    }

    // Add question responses
    microclimate.questions.forEach((question: any) => {
      const questionResponse = response.responses?.find(
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

function generateMicroclimateJSON(
  microclimate: any,
  responses: any[],
  includeOpenText: boolean,
  includeTimestamps: boolean
) {
  return {
    microclimate: {
      id: microclimate._id,
      title: microclimate.title,
      description: microclimate.description,
      status: microclimate.status,
      created_at: microclimate.created_at,
      scheduling: microclimate.scheduling,
      targeting: microclimate.targeting,
    },
    questions: microclimate.questions.map((q: any) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      options: q.options,
    })),
    summary: {
      total_responses: responses.length,
      target_participants: microclimate.target_participant_count,
      participation_rate: microclimate.participation_rate,
      engagement_level: microclimate.live_results?.engagement_level,
      sentiment_score: microclimate.live_results?.sentiment_score,
    },
    live_results: {
      word_cloud_data: microclimate.live_results?.word_cloud_data || [],
      response_distribution:
        microclimate.live_results?.response_distribution || {},
      sentiment_score: microclimate.live_results?.sentiment_score || 0,
      engagement_level: microclimate.live_results?.engagement_level || 'low',
    },
    responses: responses.map((response) => {
      const responseData: any = {
        id: response._id,
        user_id: response.user_id,
        is_complete: response.is_complete,
        responses: includeOpenText
          ? response.responses
          : response.responses?.map((r: any) => ({
              question_id: r.question_id,
              response_value: r.response_value,
              // Exclude response_text unless specifically requested
              ...(includeOpenText && { response_text: r.response_text }),
            })),
      };

      if (includeTimestamps) {
        responseData.created_at = response.created_at;
        responseData.total_time_seconds = response.total_time_seconds;
      }

      return responseData;
    }),
    ai_insights: microclimate.ai_insights || [],
    export_metadata: {
      exported_at: new Date(),
      exported_by: microclimate.created_by,
      include_open_text: includeOpenText,
      include_timestamps: includeTimestamps,
    },
  };
}
