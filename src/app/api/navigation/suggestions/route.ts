import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import NavigationFlowService from '@/lib/navigation-flow';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const currentPath = url.searchParams.get('current_path') || '/dashboard';
  const journeyId = url.searchParams.get('journey_id');
  const stepId = url.searchParams.get('step_id');

  try {
    const navigationService = NavigationFlowService.getInstance();

    // Get user's current progress
    const userProgress = navigationService.getUserProgress(user._id.toString());

    // Build navigation context
    const context = {
      user,
      current_path: currentPath,
      session_data: {},
      completed_steps: userProgress?.completed_steps || [],
      journey_id: journeyId || userProgress?.journey_id,
      step_id: stepId || userProgress?.current_step,
    };

    // Get navigation suggestions
    const suggestions =
      await navigationService.getNavigationSuggestions(context);

    // Get workflow state
    const workflowState = await navigationService.getWorkflowState(
      user._id.toString()
    );

    const response = {
      suggestions,
      workflow_state: workflowState,
      context: {
        current_path: currentPath,
        user_role: user.role,
        active_journey: userProgress,
      },
    };

    return NextResponse.json(
      createApiResponse(
        true,
        response,
        'Navigation suggestions retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error getting navigation suggestions:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to get navigation suggestions'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  try {
    const body = await req.json();
    const { journey_id, step_id, action } = body;

    if (!journey_id || !action) {
      return NextResponse.json(
        createApiResponse(false, null, 'Journey ID and action are required'),
        { status: 400 }
      );
    }

    const navigationService = NavigationFlowService.getInstance();

    if (action === 'start_journey') {
      const progress = await navigationService.startUserJourney(
        user,
        journey_id
      );

      return NextResponse.json(
        createApiResponse(true, progress, 'Journey started successfully')
      );
    }

    if (action === 'update_progress' && step_id) {
      const { progress_action } = body;

      if (
        !progress_action ||
        !['completed', 'skipped'].includes(progress_action)
      ) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            'Valid progress action is required (completed or skipped)'
          ),
          { status: 400 }
        );
      }

      const updatedProgress = await navigationService.updateUserProgress(
        user._id.toString(),
        step_id,
        progress_action
      );

      return NextResponse.json(
        createApiResponse(
          true,
          updatedProgress,
          'Progress updated successfully'
        )
      );
    }

    return NextResponse.json(createApiResponse(false, null, 'Invalid action'), {
      status: 400,
    });
  } catch (error) {
    console.error('Error updating navigation progress:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : 'Failed to update navigation progress'
      ),
      { status: 500 }
    );
  }
});
