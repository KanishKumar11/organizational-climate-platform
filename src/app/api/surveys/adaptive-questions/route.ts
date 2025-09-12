import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  QuestionAdaptationEngine,
  AdaptationContext,
} from '@/lib/question-adaptation-engine';
import Survey from '@/models/Survey';
import { connectDB } from '@/lib/db';

// POST /api/surveys/adaptive-questions - Get adaptive questions for a survey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { surveyId, userContext, initialLoad = false } = body;

    if (!surveyId) {
      return NextResponse.json(
        { error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    // Get survey details
    const survey = await Survey.findById(surveyId).lean();
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Build adaptation context
    const adaptationContext: AdaptationContext = {
      department: userContext?.department || session.user.departmentId,
      role: userContext?.role || session.user.role,
      industry: userContext?.industry,
      companySize: userContext?.companySize,
      demographics: userContext?.demographics,
      surveyType: (survey.type === 'custom' ? 'general_climate' : survey.type) || 'general_climate',
    };

    // Get categories from survey or use defaults
    const categories = (survey as any).categories || [
      'Communication',
      'Collaboration',
      'Leadership',
      'Work Environment',
      'Job Satisfaction',
    ];

    const questionsPerCategory = Math.ceil(
      ((survey as any).target_questions || 15) / categories.length
    );

    // Get adapted questions
    const adaptedQuestions =
      await QuestionAdaptationEngine.adaptQuestionsForContext(
        categories,
        questionsPerCategory,
        adaptationContext,
        session.user.companyId
      );

    // Convert to the format expected by the UI
    const formattedQuestions = adaptedQuestions.map((q, index) => ({
      id: q.originalQuestionId || `generated_${index}`,
      text: q.text,
      type: q.type,
      category: q.category,
      subcategory: q.subcategory,
      options: q.options,
      scale_min: q.scale_min,
      scale_max: q.scale_max,
      scale_labels: q.scale_labels,
      required: true, // All adaptive questions are required by default
      adaptationType: q.adaptationType,
      adaptationReason: q.adaptationReason,
      confidence: q.confidence,
      contextExplanation: generateContextExplanation(q, adaptationContext),
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      survey_info: {
        id: survey._id,
        title: survey.title,
        type: survey.type,
      },
      adaptation_context: adaptationContext,
      total_questions: formattedQuestions.length,
    });
  } catch (error) {
    console.error('Error getting adaptive questions:', error);
    return NextResponse.json(
      { error: 'Failed to get adaptive questions' },
      { status: 500 }
    );
  }
}

function generateContextExplanation(
  question: any,
  context: AdaptationContext
): string | undefined {
  if (question.adaptationType === 'original') {
    return undefined; // No explanation needed for original questions
  }

  const explanations = {
    combined: `This question combines related topics to better understand your ${context.department || 'team'} experience.`,
    reformulated: `This question has been tailored for your role as a ${context.role || 'team member'} in ${context.department || 'your department'}.`,
    generated: `This question was created specifically based on patterns we've seen in ${context.department || 'similar'} teams.`,
  };

  return explanations[question.adaptationType as keyof typeof explanations];
}
