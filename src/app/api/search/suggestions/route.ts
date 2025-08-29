/**
 * Search suggestions API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const { db } = await connectToDatabase();
    const suggestions: string[] = [];

    // Build scope filter based on user role
    let scopeFilter = {};
    if (session.user.role !== 'super_admin') {
      if (session.user.company_id) {
        scopeFilter = { company_id: session.user.company_id };
      }
    }

    // Search for suggestions in surveys
    const surveyPipeline = [
      {
        $match: {
          ...scopeFilter,
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
        },
      },
      { $limit: 20 },
    ];

    const surveys = await db
      .collection('surveys')
      .aggregate(surveyPipeline)
      .toArray();

    // Extract relevant terms from survey titles and descriptions
    surveys.forEach((survey: any) => {
      if (survey.title) {
        const titleWords = survey.title.toLowerCase().split(/\s+/);
        titleWords.forEach((word: string) => {
          if (
            word.includes(query.toLowerCase()) &&
            word.length > 2 &&
            !suggestions.includes(word)
          ) {
            suggestions.push(word);
          }
        });
      }

      if (survey.description) {
        const descWords = survey.description.toLowerCase().split(/\s+/);
        descWords.forEach((word: string) => {
          if (
            word.includes(query.toLowerCase()) &&
            word.length > 2 &&
            !suggestions.includes(word)
          ) {
            suggestions.push(word);
          }
        });
      }
    });

    // Search for suggestions in AI insights (if user has access)
    if (
      ['super_admin', 'company_admin', 'leader'].includes(session.user.role)
    ) {
      const insightPipeline = [
        {
          $match: {
            ...scopeFilter,
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } },
            ],
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            category: 1,
          },
        },
        { $limit: 20 },
      ];

      const insights = await db
        .collection('aiinsights')
        .aggregate(insightPipeline)
        .toArray();

      insights.forEach((insight: any) => {
        [insight.title, insight.description, insight.category].forEach(
          (text: string) => {
            if (text && typeof text === 'string') {
              const words = text.toLowerCase().split(/\s+/);
              words.forEach((word: string) => {
                if (
                  word.includes(query.toLowerCase()) &&
                  word.length > 2 &&
                  !suggestions.includes(word)
                ) {
                  suggestions.push(word);
                }
              });
            }
          }
        );
      });
    }

    // Search for suggestions in action plans (if user has access)
    if (
      ['super_admin', 'company_admin', 'leader', 'supervisor'].includes(
        session.user.role
      )
    ) {
      const actionPlanPipeline = [
        {
          $match: {
            ...scopeFilter,
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
            ],
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
          },
        },
        { $limit: 20 },
      ];

      const actionPlans = await db
        .collection('actionplans')
        .aggregate(actionPlanPipeline)
        .toArray();

      actionPlans.forEach((plan: any) => {
        [plan.title, plan.description].forEach((text: string) => {
          if (text && typeof text === 'string') {
            const words = text.toLowerCase().split(/\s+/);
            words.forEach((word: string) => {
              if (
                word.includes(query.toLowerCase()) &&
                word.length > 2 &&
                !suggestions.includes(word)
              ) {
                suggestions.push(word);
              }
            });
          }
        });
      });
    }

    // Add common search terms
    const commonTerms = [
      'engagement',
      'satisfaction',
      'culture',
      'climate',
      'feedback',
      'performance',
      'communication',
      'collaboration',
      'leadership',
      'development',
      'training',
      'retention',
      'turnover',
      'morale',
    ];

    commonTerms.forEach((term) => {
      if (term.includes(query.toLowerCase()) && !suggestions.includes(term)) {
        suggestions.push(term);
      }
    });

    // Sort suggestions by relevance (exact matches first, then starts with, then contains)
    const sortedSuggestions = suggestions.sort((a, b) => {
      const aExact = a.toLowerCase() === query.toLowerCase() ? 3 : 0;
      const bExact = b.toLowerCase() === query.toLowerCase() ? 3 : 0;
      const aStarts = a.toLowerCase().startsWith(query.toLowerCase()) ? 2 : 0;
      const bStarts = b.toLowerCase().startsWith(query.toLowerCase()) ? 2 : 0;
      const aContains = a.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
      const bContains = b.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;

      const aScore = aExact + aStarts + aContains;
      const bScore = bExact + bStarts + bContains;

      return bScore - aScore;
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions: sortedSuggestions.slice(0, limit),
      },
    });
  } catch (error) {
    console.error('Search suggestions API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get search suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
