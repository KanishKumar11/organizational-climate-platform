import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import OnboardingSystem from '@/lib/onboarding-system';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const path = url.searchParams.get('path');
  const query = url.searchParams.get('query');

  try {
    const onboardingSystem = OnboardingSystem.getInstance();

    if (action === 'tours') {
      // Get available tours for user
      const availableTours = await onboardingSystem.getAvailableTours(user);
      const onboardingProgress = await onboardingSystem.getOnboardingProgress(
        user._id.toString()
      );

      return NextResponse.json(
        createApiResponse(
          true,
          {
            available_tours: availableTours,
            progress: onboardingProgress,
          },
          'Tours retrieved successfully'
        )
      );
    }

    if (action === 'contextual_help' && path) {
      // Get contextual help for specific path
      const contextualHelp = onboardingSystem.getContextualHelp(path);

      return NextResponse.json(
        createApiResponse(
          true,
          { contextual_help: contextualHelp },
          'Contextual help retrieved successfully'
        )
      );
    }

    if (action === 'search_help' && query) {
      // Search help articles
      const articles = onboardingSystem.searchHelpArticles(query, user.role);

      return NextResponse.json(
        createApiResponse(
          true,
          { articles },
          'Help articles retrieved successfully'
        )
      );
    }

    if (action === 'user_state') {
      // Get user's onboarding state
      const userState = await onboardingSystem.getUserOnboardingState(
        user._id.toString()
      );
      const onboardingProgress = await onboardingSystem.getOnboardingProgress(
        user._id.toString()
      );

      return NextResponse.json(
        createApiResponse(
          true,
          {
            user_state: userState,
            progress: onboardingProgress,
          },
          'User onboarding state retrieved successfully'
        )
      );
    }

    // Default: return onboarding overview
    const userState = await onboardingSystem.getUserOnboardingState(
      user._id.toString()
    );
    const availableTours = await onboardingSystem.getAvailableTours(user);
    const onboardingProgress = await onboardingSystem.getOnboardingProgress(
      user._id.toString()
    );

    return NextResponse.json(
      createApiResponse(
        true,
        {
          user_state: userState,
          available_tours: availableTours,
          progress: onboardingProgress,
        },
        'Onboarding information retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error getting onboarding information:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to get onboarding information'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  try {
    const body = await req.json();
    const { action, tour_id, step_id, preferences, trigger_condition } = body;

    if (!action) {
      return NextResponse.json(
        createApiResponse(false, null, 'Action is required'),
        { status: 400 }
      );
    }

    const onboardingSystem = OnboardingSystem.getInstance();

    if (action === 'start_tour' && tour_id) {
      await onboardingSystem.startTour(user._id.toString(), tour_id);

      return NextResponse.json(
        createApiResponse(
          true,
          { tour_started: tour_id },
          'Tour started successfully'
        )
      );
    }

    if (action === 'complete_step' && step_id) {
      await onboardingSystem.completeTourStep(user._id.toString(), step_id);

      const progress = await onboardingSystem.getOnboardingProgress(
        user._id.toString()
      );

      return NextResponse.json(
        createApiResponse(
          true,
          { progress },
          'Tour step completed successfully'
        )
      );
    }

    if (action === 'skip_tour' && tour_id) {
      await onboardingSystem.skipTour(user._id.toString(), tour_id);

      return NextResponse.json(
        createApiResponse(
          true,
          { tour_skipped: tour_id },
          'Tour skipped successfully'
        )
      );
    }

    if (action === 'update_preferences' && preferences) {
      await onboardingSystem.updateHelpPreferences(
        user._id.toString(),
        preferences
      );

      const userState = await onboardingSystem.getUserOnboardingState(
        user._id.toString()
      );

      return NextResponse.json(
        createApiResponse(
          true,
          { preferences: userState.help_preferences },
          'Preferences updated successfully'
        )
      );
    }

    if (action === 'check_auto_tour' && trigger_condition) {
      const suggestedTour = await onboardingSystem.shouldStartTour(
        user,
        trigger_condition
      );

      return NextResponse.json(
        createApiResponse(
          true,
          { suggested_tour: suggestedTour },
          'Auto tour check completed'
        )
      );
    }

    return NextResponse.json(createApiResponse(false, null, 'Invalid action'), {
      status: 400,
    });
  } catch (error) {
    console.error('Error processing onboarding action:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : 'Failed to process onboarding action'
      ),
      { status: 500 }
    );
  }
});
