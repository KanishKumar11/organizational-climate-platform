import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedNLP } from '../../../../../lib/advanced-nlp';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { Survey } from '../../../../../models/Survey';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      surveyId,
      companyId,
      departmentId,
      numTopics = 8,
      minDocumentFreq = 2,
      textOnly = true,
    } = await request.json();

    // Validate required parameters
    if (!companyId && !surveyId) {
      return NextResponse.json(
        { error: 'Either companyId or surveyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query filters
    const responseFilter: any = {};

    if (surveyId) {
      responseFilter.survey_id = surveyId;
    } else {
      // Get surveys for the company/department
      const surveyFilter: any = { company_id: companyId };
      if (departmentId) {
        surveyFilter.target_departments = departmentId;
      }

      const surveys = await Survey.find(surveyFilter).lean();
      const surveyIds = surveys.map((s) => s._id);
      responseFilter.survey_id = { $in: surveyIds };
    }

    // Get text responses only
    if (textOnly) {
      responseFilter.$or = [
        { response_type: 'text' },
        { response_value: { $type: 'string' } },
      ];
    }

    const responses = await Response.find(responseFilter).lean();

    if (responses.length === 0) {
      return NextResponse.json({
        success: true,
        topicModel: {
          topics: [],
          documentTopics: [],
          coherenceScore: 0,
          totalDocuments: 0,
        },
        message: 'No text responses found for analysis',
      });
    }

    // Extract text content
    const documents = responses
      .flatMap((r) => 
        (r.responses || []).map((qr) => ({
          ...qr,
          created_at: r.created_at,
          survey_id: r.survey_id,
          user_id: r.user_id,
        }))
      )
      .map((r) => {
        if (
          typeof r.response_value === 'string' &&
          r.response_value.trim().length > 10
        ) {
          return r.response_value.trim();
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        topicModel: {
          topics: [],
          documentTopics: [],
          coherenceScore: 0,
          totalDocuments: 0,
        },
        message: 'No valid text content found for topic modeling',
      });
    }

    // Perform topic modeling
    const topicModel = await advancedNLP.performTopicModeling(
      documents,
      numTopics,
      minDocumentFreq
    );

    // Add metadata about the analysis
    const metadata = {
      totalResponses: responses.length,
      textDocuments: documents.length,
      averageDocumentLength:
        documents.reduce((sum, doc) => sum + doc.length, 0) / documents.length,
      analysisDate: new Date().toISOString(),
      parameters: {
        numTopics,
        minDocumentFreq,
        textOnly,
      },
    };

    return NextResponse.json({
      success: true,
      topicModel,
      metadata,
    });
  } catch (error) {
    console.error('Topic modeling error:', error);
    return NextResponse.json(
      { error: 'Failed to perform topic modeling' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '6months';
    const topicCount = parseInt(searchParams.get('topicCount') || '5');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate period in months
    const periodMonths =
      period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date(
      Date.now() - periodMonths * 30 * 24 * 60 * 60 * 1000
    );

    // Get surveys for the company
    const surveys = await Survey.find({
      company_id: companyId,
      created_at: { $gte: startDate },
    }).lean();

    const surveyIds = surveys.map((s) => s._id);

    // Get text responses
    const responses = await Response.find({
      survey_id: { $in: surveyIds },
      created_at: { $gte: startDate },
      $or: [{ response_type: 'text' }, { response_value: { $type: 'string' } }],
    }).lean();

    // Group responses by month for trend analysis
    const monthlyTopics = new Map();

    responses
      .flatMap((r) => 
        (r.responses || []).map((qr) => ({
          ...qr,
          created_at: r.created_at,
          survey_id: r.survey_id,
          user_id: r.user_id,
        }))
      )
      .forEach((r) => {
        if (
          typeof r.response_value === 'string' &&
          r.response_value.trim().length > 10
        ) {
          const monthKey = new Date(r.created_at).toISOString().substring(0, 7);
          if (!monthlyTopics.has(monthKey)) {
            monthlyTopics.set(monthKey, []);
          }
          monthlyTopics.get(monthKey).push(r.response_value.trim());
        }
      });

    // Analyze topics for each month
    const topicTrends = [];
    for (const [month, texts] of monthlyTopics.entries()) {
      if (texts.length >= 5) {
        // Minimum texts for meaningful analysis
        try {
          const topicModel = await advancedNLP.performTopicModeling(
            texts,
            topicCount,
            1
          );
          topicTrends.push({
            month,
            date: new Date(month + '-01'),
            topics: topicModel.topics,
            coherenceScore: topicModel.coherenceScore,
            documentCount: texts.length,
          });
        } catch (error) {
          console.error(`Error analyzing topics for ${month}:`, error);
        }
      }
    }

    // Sort by date
    topicTrends.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Identify trending topics across time periods
    const topicEvolution = this.analyzeTopicEvolution(topicTrends);

    // Get overall topic model for the entire period
    const allTexts = Array.from(monthlyTopics.values()).flat();
    const overallTopicModel =
      allTexts.length > 0
        ? await advancedNLP.performTopicModeling(allTexts, topicCount * 2, 2)
        : {
            topics: [],
            documentTopics: [],
            coherenceScore: 0,
            totalDocuments: 0,
          };

    return NextResponse.json({
      success: true,
      trends: topicTrends,
      evolution: topicEvolution,
      overall: overallTopicModel,
      summary: {
        totalTexts: allTexts.length,
        monthsAnalyzed: topicTrends.length,
        averageCoherence:
          topicTrends.length > 0
            ? topicTrends.reduce((sum, t) => sum + t.coherenceScore, 0) /
              topicTrends.length
            : 0,
        topTrendingTopics: topicEvolution.trending.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Topic trends error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze topic trends' },
      { status: 500 }
    );
  }
}


