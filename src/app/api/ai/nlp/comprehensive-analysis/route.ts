import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performComprehensiveTextAnalysis } from '../../../../../lib/advanced-nlp';
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
      analysisTypes = ['all'], // ['topics', 'entities', 'sentiment', 'themes', 'tags']
      timeframe = 'weekly',
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
    responseFilter.$or = [
      { response_type: 'text' },
      { response_value: { $type: 'string' } },
    ];

    const responses = await Response.find(responseFilter).lean();

    if (responses.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          topicModel: {
            topics: [],
            documentTopics: [],
            coherenceScore: 0,
            totalDocuments: 0,
          },
          entities: { entities: [], relationships: [], confidence: 0 },
          sentimentTrend: {
            timeframe,
            overallSentiment: {
              score: 0,
              magnitude: 0,
              classification: 'neutral',
              confidence: 0,
            },
            trends: [],
            topicSentiments: [],
            anomalies: [],
          },
          themes: [],
          tags: [],
          insights: [],
        },
        message: 'No text responses found for comprehensive analysis',
      });
    }

    // Prepare text data with dates and metadata
    const textData = responses
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
          return {
            text: r.response_value.trim(),
            date: new Date(r.created_at),
            metadata: {
              surveyId: r.survey_id,
              userId: r.user_id,
              questionId: r.question_id,
              // category: r.category, // Removed as category doesn't exist on flattened response
            },
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ text: string; date: Date; metadata?: any }>;

    if (textData.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          topicModel: {
            topics: [],
            documentTopics: [],
            coherenceScore: 0,
            totalDocuments: 0,
          },
          entities: { entities: [], relationships: [], confidence: 0 },
          sentimentTrend: {
            timeframe,
            overallSentiment: {
              score: 0,
              magnitude: 0,
              classification: 'neutral',
              confidence: 0,
            },
            trends: [],
            topicSentiments: [],
            anomalies: [],
          },
          themes: [],
          tags: [],
          insights: [],
        },
        message: 'No valid text content found for comprehensive analysis',
      });
    }

    // Perform comprehensive text analysis
    const analysisResult = await performComprehensiveTextAnalysis(textData);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      analysisResult,
      textData
    );

    // Calculate analysis quality metrics
    const qualityMetrics = this.calculateAnalysisQuality(
      analysisResult,
      textData
    );

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      executiveSummary,
      qualityMetrics,
      metadata: {
        totalResponses: responses.length,
        textDocuments: textData.length,
        averageTextLength:
          textData.reduce((sum, t) => sum + t.text.length, 0) / textData.length,
        dateRange: {
          start: new Date(Math.min(...textData.map((t) => t.date.getTime()))),
          end: new Date(Math.max(...textData.map((t) => t.date.getTime()))),
        },
        analysisDate: new Date().toISOString(),
        parameters: {
          analysisTypes,
          timeframe,
        },
      },
    });
  } catch (error) {
    console.error('Comprehensive text analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform comprehensive text analysis' },
      { status: 500 }
    );
  }
}


