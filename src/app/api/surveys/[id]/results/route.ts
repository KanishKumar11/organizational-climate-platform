import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import { hasPermission } from '@/lib/permissions';
import { sanitizeForSerialization } from '@/lib/datetime-utils';

// Get survey results and analytics
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
    const demographic = searchParams.get('demographic');
    const departmentId = searchParams.get('department');
    const includeOpenText = searchParams.get('include_open_text') === 'true';

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
    let responseQuery: any = {
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
    const responses = await Response.find(responseQuery);

    // Calculate basic statistics
    const totalResponses = responses.length;
    const responseRate = survey.target_audience_count
      ? (totalResponses / survey.target_audience_count) * 100
      : null;

    // Process question analytics
    const questionAnalytics = survey.questions.map((question) => {
      const questionResponses = responses
        .map((r) => r.responses.find((qr) => qr.question_id === question.id))
        .filter(Boolean);

      let analytics: any = {
        question_id: question.id,
        question_text: question.text,
        question_type: question.type,
        response_count: questionResponses.length,
        response_rate:
          totalResponses > 0
            ? (questionResponses.length / totalResponses) * 100
            : 0,
      };

      // Calculate type-specific analytics
      switch (question.type) {
        case 'likert':
        case 'rating':
          const numericValues = questionResponses
            .map((r) => Number(r.response_value))
            .filter((v) => !isNaN(v));

          if (numericValues.length > 0) {
            analytics.average =
              numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            analytics.distribution = calculateDistribution(
              numericValues,
              question.scale_min || 1,
              question.scale_max || 5
            );
          }
          break;

        case 'multiple_choice':
        case 'yes_no':
          const choiceDistribution = {};
          questionResponses.forEach((r) => {
            const value = String(r.response_value);
            choiceDistribution[value] = (choiceDistribution[value] || 0) + 1;
          });
          analytics.distribution = Object.entries(choiceDistribution).map(
            ([label, count]) => ({
              label,
              count: count as number,
              percentage: ((count as number) / questionResponses.length) * 100,
            })
          );
          break;

        case 'yes_no_comment':
          // Distribution of yes/no responses
          const yesNoCommentDistribution = {};
          questionResponses.forEach((r) => {
            const value = String(r.response_value);
            yesNoCommentDistribution[value] =
              (yesNoCommentDistribution[value] || 0) + 1;
          });
          analytics.distribution = Object.entries(yesNoCommentDistribution).map(
            ([label, count]) => ({
              label,
              count: count as number,
              percentage: ((count as number) / questionResponses.length) * 100,
            })
          );

          // Include comments if requested
          if (includeOpenText) {
            analytics.comments = questionResponses
              .filter((r) => r.response_text && r.response_text.trim())
              .map((r) => ({
                response: String(r.response_value),
                comment: r.response_text,
              }));
          }
          analytics.comment_count = questionResponses.filter(
            (r) => r.response_text && r.response_text.trim()
          ).length;
          break;

        case 'emoji_scale':
          // Calculate distribution and average for emoji scale
          const emojiValues = questionResponses
            .map((r) => Number(r.response_value))
            .filter((v) => !isNaN(v));

          if (emojiValues.length > 0) {
            analytics.average =
              emojiValues.reduce((a, b) => a + b, 0) / emojiValues.length;

            // Create distribution based on emoji options
            const emojiDistribution = {};
            questionResponses.forEach((r) => {
              const value = Number(r.response_value);
              if (!isNaN(value)) {
                // Find the matching emoji option
                const emojiOption = question.emoji_options?.find(
                  (opt) => opt.value === value
                );
                const label = emojiOption
                  ? `${emojiOption.emoji} ${emojiOption.label}`
                  : `Value ${value}`;
                emojiDistribution[label] = (emojiDistribution[label] || 0) + 1;
              }
            });

            analytics.distribution = Object.entries(emojiDistribution).map(
              ([label, count]) => ({
                label,
                count: count as number,
                percentage:
                  ((count as number) / questionResponses.length) * 100,
              })
            );
          }
          break;

        case 'ranking':
          // Calculate average ranking for each option
          const rankingData = {};
          questionResponses.forEach((r) => {
            if (Array.isArray(r.response_value)) {
              r.response_value.forEach((option, index) => {
                if (!rankingData[option]) {
                  rankingData[option] = { total: 0, count: 0 };
                }
                rankingData[option].total += index + 1; // Rankings start at 1
                rankingData[option].count += 1;
              });
            }
          });

          analytics.ranking_averages = Object.entries(rankingData)
            .map(([option, data]: [string, any]) => ({
              option,
              average_rank: data.total / data.count,
              response_count: data.count,
            }))
            .sort((a, b) => a.average_rank - b.average_rank);
          break;

        case 'open_ended':
          if (includeOpenText) {
            analytics.text_responses = questionResponses
              .map((r) => r.response_text || r.response_value)
              .filter(Boolean);
          }
          analytics.text_response_count = questionResponses.filter((r) =>
            (r.response_text || r.response_value)?.toString().trim()
          ).length;
          break;
      }

      return analytics;
    });

    // Calculate demographic breakdowns if requested
    let demographicBreakdowns = null;
    if (demographic && responses.length > 0) {
      demographicBreakdowns = calculateDemographicBreakdown(
        responses,
        demographic,
        survey.questions
      );
    }

    // Calculate completion time statistics
    const completionTimes = responses
      .filter((r) => r.total_time_seconds)
      .map((r) => r.total_time_seconds);

    const timeStats =
      completionTimes.length > 0
        ? {
            average_seconds:
              completionTimes.reduce((a, b) => a + b, 0) /
              completionTimes.length,
            median_seconds: calculateMedian(completionTimes),
            min_seconds: Math.min(...completionTimes),
            max_seconds: Math.max(...completionTimes),
          }
        : null;

    // Calculate response timeline
    const responseTimeline = calculateResponseTimeline(responses);

    const responseData = {
      survey: {
        id: survey._id,
        title: survey.title,
        type: survey.type,
        status: survey.status,
        start_date: survey.start_date,
        end_date: survey.end_date,
      },
      statistics: {
        total_responses: totalResponses,
        response_rate: responseRate,
        completion_rate: 100, // Only completed responses are included
        target_audience: survey.target_audience_count,
      },
      question_analytics: questionAnalytics,
      demographic_breakdowns: demographicBreakdowns,
      completion_time_stats: timeStats,
      response_timeline: responseTimeline,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(sanitizeForSerialization(responseData));
  } catch (error) {
    console.error('Error fetching survey results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDistribution(values: number[], min: number, max: number) {
  const distribution = {};
  for (let i = min; i <= max; i++) {
    distribution[i] = 0;
  }

  values.forEach((value) => {
    if (distribution[value] !== undefined) {
      distribution[value]++;
    }
  });

  return Object.entries(distribution).map(([label, count]) => ({
    label,
    count: count as number,
    percentage: ((count as number) / values.length) * 100,
  }));
}

function calculateDemographicBreakdown(
  responses: any[],
  demographic: string,
  questions: any[]
) {
  const groups = {};

  responses.forEach((response) => {
    const demographicValue =
      response.demographics.find((d) => d.field === demographic)?.value ||
      'Unknown';
    if (!groups[demographicValue]) {
      groups[demographicValue] = [];
    }
    groups[demographicValue].push(response);
  });

  return Object.entries(groups).map(
    ([group, groupResponses]: [string, any[]]) => ({
      group,
      count: groupResponses.length,
      percentage: (groupResponses.length / responses.length) * 100,
      question_averages: questions
        .filter((q) => q.type === 'likert' || q.type === 'rating')
        .map((question) => {
          const questionResponses = groupResponses
            .map((r) =>
              r.responses.find((qr) => qr.question_id === question.id)
            )
            .filter(Boolean)
            .map((r) => Number(r.response_value))
            .filter((v) => !isNaN(v));

          return {
            question_id: question.id,
            question_text: question.text,
            average:
              questionResponses.length > 0
                ? questionResponses.reduce((a, b) => a + b, 0) /
                  questionResponses.length
                : null,
            response_count: questionResponses.length,
          };
        }),
    })
  );
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calculateResponseTimeline(responses: any[]) {
  const timeline = {};

  responses.forEach((response) => {
    const date = new Date(response.completion_time || response.created_at);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    timeline[dateKey] = (timeline[dateKey] || 0) + 1;
  });

  return Object.entries(timeline)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
