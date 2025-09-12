import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  adaptiveQuestionAI,
  AdaptiveQuestionRequest,
} from '@/lib/adaptive-question-ai';
import { demographicContextAI } from '@/lib/demographic-context-ai';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only admins and leaders can request adaptive questions
    if (!['super_admin', 'company_admin', 'leader'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      companyId,
      departmentId,
      surveyType,
      targetQuestionCount = 20,
      adaptationPreferences = {
        allowCombinations: true,
        allowReformulations: true,
        allowGeneration: false,
        preferredCategories: [],
      },
    } = body;

    // Validate required fields
    if (!companyId || !surveyType) {
      return NextResponse.json(
        { error: 'Company ID and survey type are required' },
        { status: 400 }
      );
    }

    // Validate user has access to the company
    if (user.role !== 'super_admin' && user.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Build demographic context
    const demographicContext =
      await demographicContextAI.buildDemographicContext(
        companyId,
        departmentId
      );

    // Create adaptive question request
    const adaptiveRequest: AdaptiveQuestionRequest = {
      companyId,
      departmentId,
      surveyType,
      demographicContext: demographicContext.userProfiles.reduce(
        (acc, profile) => {
          acc[profile.userId] = {
            role: profile.role,
            tenure: profile.tenure,
            level: profile.level,
            workLocation: profile.workLocation,
          };
          return acc;
        },
        {} as Record<string, unknown>
      ),
      targetQuestionCount,
      adaptationPreferences,
    };

    // Generate adaptive questions
    const adaptedQuestions =
      await adaptiveQuestionAI.generateAdaptiveQuestions(adaptiveRequest);

    // Return results with metadata
    return NextResponse.json({
      success: true,
      data: {
        questions: adaptedQuestions,
        metadata: {
          totalGenerated: adaptedQuestions.length,
          adaptationTypes: {
            original: adaptedQuestions.filter(
              (q) => q.adaptationType === 'original'
            ).length,
            combined: adaptedQuestions.filter(
              (q) => q.adaptationType === 'combined'
            ).length,
            reformulated: adaptedQuestions.filter(
              (q) => q.adaptationType === 'reformulated'
            ).length,
            generated: adaptedQuestions.filter(
              (q) => q.adaptationType === 'generated'
            ).length,
          },
          averageConfidence:
            adaptedQuestions.reduce((sum, q) => sum + q.confidence, 0) /
            adaptedQuestions.length,
          demographicContext: {
            companySize: demographicContext.companyProfile.size,
            departmentSize: demographicContext.departmentProfile?.size || 0,
            userCount: demographicContext.userProfiles.length,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error generating adaptive questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate adaptive questions' },
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

    await connectToDatabase();

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const departmentId = searchParams.get('departmentId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Validate user has access to the company
    if (user.role !== 'super_admin' && user.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Get demographic context for the company/department
    const demographicContext =
      await demographicContextAI.buildDemographicContext(
        companyId,
        departmentId || undefined
      );

    // Return demographic insights that can inform question adaptation
    return NextResponse.json({
      success: true,
      data: {
        demographicContext: {
          company: {
            id: demographicContext.companyProfile.companyId,
            industry: demographicContext.companyProfile.industry,
            size: demographicContext.companyProfile.size,
            workModel: demographicContext.companyProfile.workModel,
            averageTenure: demographicContext.companyProfile.averageTenure,
          },
          department: demographicContext.departmentProfile
            ? {
                id: demographicContext.departmentProfile.departmentId,
                name: demographicContext.departmentProfile.name,
                function: demographicContext.departmentProfile.function,
                size: demographicContext.departmentProfile.size,
                averageTenure:
                  demographicContext.departmentProfile.averageTenure,
              }
            : null,
          insights: {
            questionPreferences:
              demographicContext.aggregatedInsights.questionPreferences,
            engagementFactors:
              demographicContext.aggregatedInsights.engagementFactors,
            adaptationOpportunities:
              demographicContext.aggregatedInsights.adaptationOpportunities,
            culturalConsiderations:
              demographicContext.aggregatedInsights.culturalConsiderations,
          },
          userProfiles: {
            total: demographicContext.userProfiles.length,
            byLevel: demographicContext.userProfiles.reduce(
              (acc, profile) => {
                acc[profile.level] = (acc[profile.level] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
            byTenure: demographicContext.userProfiles.reduce(
              (acc, profile) => {
                acc[profile.tenure] = (acc[profile.tenure] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
            byWorkLocation: demographicContext.userProfiles.reduce(
              (acc, profile) => {
                acc[profile.workLocation] =
                  (acc[profile.workLocation] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            ),
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting demographic context:', error);
    return NextResponse.json(
      { error: 'Failed to get demographic context' },
      { status: 500 }
    );
  }
}
