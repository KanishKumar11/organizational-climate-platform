import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import OnboardingSystem from '@/lib/onboarding-system';

export const GET = withAuth(async (req, { params }) => {
  const user = req.user!;
  const { articleId } = params;

  try {
    const onboardingSystem = OnboardingSystem.getInstance();

    const article = onboardingSystem.getHelpArticle(articleId);

    if (!article) {
      return NextResponse.json(
        createApiResponse(false, null, 'Help article not found'),
        { status: 404 }
      );
    }

    // Check if user has access to this article
    if (!article.target_roles.includes(user.role)) {
      return NextResponse.json(
        createApiResponse(false, null, 'Access denied to this help article'),
        { status: 403 }
      );
    }

    return NextResponse.json(
      createApiResponse(true, article, 'Help article retrieved successfully')
    );
  } catch (error) {
    console.error('Error retrieving help article:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve help article'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req, { params }) => {
  const user = req.user!;
  const { articleId } = params;

  try {
    const body = await req.json();
    const { action, helpful } = body;

    if (action !== 'vote') {
      return NextResponse.json(
        createApiResponse(false, null, 'Invalid action'),
        { status: 400 }
      );
    }

    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        createApiResponse(false, null, 'Helpful vote must be boolean'),
        { status: 400 }
      );
    }

    const onboardingSystem = OnboardingSystem.getInstance();
    const article = onboardingSystem.getHelpArticle(articleId);

    if (!article) {
      return NextResponse.json(
        createApiResponse(false, null, 'Help article not found'),
        { status: 404 }
      );
    }

    // Update vote counts (in a real implementation, you'd want to track individual votes)
    article.total_votes++;
    if (helpful) {
      article.helpful_votes++;
    }

    const helpfulPercentage =
      article.total_votes > 0
        ? Math.round((article.helpful_votes / article.total_votes) * 100)
        : 0;

    return NextResponse.json(
      createApiResponse(
        true,
        {
          article_id: articleId,
          helpful_votes: article.helpful_votes,
          total_votes: article.total_votes,
          helpful_percentage: helpfulPercentage,
        },
        'Vote recorded successfully'
      )
    );
  } catch (error) {
    console.error('Error recording help article vote:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to record vote'),
      { status: 500 }
    );
  }
});
