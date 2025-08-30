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
      entityTypes,
      minFrequency = 2,
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
        entities: {
          entities: [],
          relationships: [],
          confidence: 0,
        },
        message: 'No text responses found for entity recognition',
      });
    }

    // Extract text content
    const texts = responses
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
          r.response_value.trim().length > 5
        ) {
          return r.response_value.trim();
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (texts.length === 0) {
      return NextResponse.json({
        success: true,
        entities: {
          entities: [],
          relationships: [],
          confidence: 0,
        },
        message: 'No valid text content found for entity recognition',
      });
    }

    // Perform entity recognition
    const entityRecognition = await advancedNLP.recognizeEntities(texts);

    // Filter entities by frequency and type if specified
    let filteredEntities = entityRecognition.entities.filter(
      (e) => e.frequency >= minFrequency
    );

    if (entityTypes && entityTypes.length > 0) {
      filteredEntities = filteredEntities.filter((e) =>
        entityTypes.includes(e.type)
      );
    }

    // Filter relationships to only include filtered entities
    const entityTexts = new Set(filteredEntities.map((e) => e.text));
    const filteredRelationships = entityRecognition.relationships.filter(
      (r) => entityTexts.has(r.source) && entityTexts.has(r.target)
    );

    // Group entities by type for better organization
    const entitiesByType = filteredEntities.reduce(
      (acc, entity) => {
        if (!acc[entity.type]) {
          acc[entity.type] = [];
        }
        acc[entity.type].push(entity);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Sort entities within each type by relevance
    Object.keys(entitiesByType).forEach((type) => {
      entitiesByType[type].sort((a, b) => b.relevance - a.relevance);
    });

    // Calculate insights from entities
    const insights = this.generateEntityInsights(
      filteredEntities,
      filteredRelationships
    );

    return NextResponse.json({
      success: true,
      entities: {
        entities: filteredEntities,
        relationships: filteredRelationships,
        confidence: entityRecognition.confidence,
      },
      entitiesByType,
      insights,
      metadata: {
        totalResponses: responses.length,
        textDocuments: texts.length,
        totalEntitiesFound: entityRecognition.entities.length,
        filteredEntities: filteredEntities.length,
        relationshipsFound: filteredRelationships.length,
        analysisDate: new Date().toISOString(),
        parameters: {
          minFrequency,
          entityTypes: entityTypes || 'all',
        },
      },
    });
  } catch (error) {
    console.error('Entity recognition error:', error);
    return NextResponse.json(
      { error: 'Failed to perform entity recognition' },
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
    const entityType = searchParams.get('entityType');
    const period = searchParams.get('period') || '6months';

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

    // Extract text content
    const texts = responses
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
          r.response_value.trim().length > 5
        ) {
          return r.response_value.trim();
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (texts.length === 0) {
      return NextResponse.json({
        success: true,
        entities: [],
        trends: [],
        summary: {
          totalEntities: 0,
          entityTypes: [],
          averageSentiment: 0,
        },
      });
    }

    // Perform entity recognition
    const entityRecognition = await advancedNLP.recognizeEntities(texts);

    // Filter by entity type if specified
    let entities = entityRecognition.entities;
    if (entityType && entityType !== 'all') {
      entities = entities.filter((e) => e.type === entityType);
    }

    // Group entities by month for trend analysis
    const monthlyEntities = new Map();

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
          r.response_value.trim().length > 5
        ) {
          const monthKey = new Date(r.created_at).toISOString().substring(0, 7);
          if (!monthlyEntities.has(monthKey)) {
            monthlyEntities.set(monthKey, []);
          }
          monthlyEntities.get(monthKey).push(r.response_value.trim());
        }
      });

    // Analyze entities for each month
    const entityTrends = [];
    for (const [month, monthTexts] of monthlyEntities.entries()) {
      if (monthTexts.length >= 3) {
        try {
          const monthlyRecognition =
            await advancedNLP.recognizeEntities(monthTexts);
          let monthEntities = monthlyRecognition.entities;

          if (entityType && entityType !== 'all') {
            monthEntities = monthEntities.filter((e) => e.type === entityType);
          }

          entityTrends.push({
            month,
            date: new Date(month + '-01'),
            entities: monthEntities,
            totalMentions: monthEntities.reduce(
              (sum, e) => sum + e.frequency,
              0
            ),
            averageSentiment:
              monthEntities.length > 0
                ? monthEntities.reduce((sum, e) => sum + e.sentiment, 0) /
                  monthEntities.length
                : 0,
            entityCount: monthEntities.length,
          });
        } catch (error) {
          console.error(`Error analyzing entities for ${month}:`, error);
        }
      }
    }

    // Sort by date
    entityTrends.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate entity evolution
    const entityEvolution = this.analyzeEntityEvolution(entityTrends);

    // Calculate summary statistics
    const entityTypes = [...new Set(entities.map((e) => e.type))];
    const averageSentiment =
      entities.length > 0
        ? entities.reduce((sum, e) => sum + e.sentiment, 0) / entities.length
        : 0;

    return NextResponse.json({
      success: true,
      entities: entities.sort((a, b) => b.frequency - a.frequency),
      trends: entityTrends,
      evolution: entityEvolution,
      summary: {
        totalEntities: entities.length,
        entityTypes,
        averageSentiment,
        totalMentions: entities.reduce((sum, e) => sum + e.frequency, 0),
        monthsAnalyzed: entityTrends.length,
      },
    });
  } catch (error) {
    console.error('Entity trends error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze entity trends' },
      { status: 500 }
    );
  }
}


