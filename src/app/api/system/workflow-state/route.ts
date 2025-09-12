import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import WorkflowStateManager from '@/lib/workflow-state-manager';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const stateId = url.searchParams.get('state_id');

  try {
    const workflowManager = WorkflowStateManager.getInstance();

    if (stateId) {
      // Get specific workflow state
      const state = workflowManager.getWorkflowState(stateId);

      if (!state) {
        return NextResponse.json(
          createApiResponse(false, null, 'Workflow state not found'),
          { status: 404 }
        );
      }

      // Check if user owns this workflow
      if (state.user_id !== user._id.toString()) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            'Unauthorized access to workflow state'
          ),
          { status: 403 }
        );
      }

      return NextResponse.json(
        createApiResponse(true, state, 'Workflow state retrieved successfully')
      );
    } else {
      // Get all active workflows for user
      const activeWorkflows = workflowManager.getUserActiveWorkflows(
        user._id.toString()
      );

      const response = {
        active_workflows: activeWorkflows,
        summary: {
          total_active: activeWorkflows.length,
          by_type: activeWorkflows.reduce(
            (acc, workflow) => {
              acc[workflow.workflow_type] =
                (acc[workflow.workflow_type] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
          average_progress:
            activeWorkflows.length > 0
              ? activeWorkflows.reduce(
                  (sum, w) => sum + w.progress_percentage,
                  0
                ) / activeWorkflows.length
              : 0,
        },
      };

      return NextResponse.json(
        createApiResponse(
          true,
          response,
          'User workflow states retrieved successfully'
        )
      );
    }
  } catch (error) {
    console.error('Error retrieving workflow states:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve workflow states'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  try {
    const body = await req.json();
    const { workflow_type, initial_data } = body;

    if (!workflow_type) {
      return NextResponse.json(
        createApiResponse(false, null, 'Workflow type is required'),
        { status: 400 }
      );
    }

    const workflowManager = WorkflowStateManager.getInstance();

    // Start new workflow
    const state = await workflowManager.startWorkflow(
      user,
      workflow_type,
      initial_data || {}
    );

    return NextResponse.json(
      createApiResponse(true, state, 'Workflow started successfully')
    );
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error ? error.message : 'Failed to start workflow'
      ),
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req) => {
  const user = req.user!;

  try {
    const body = await req.json();
    const { state_id, action, step_data } = body;

    if (!state_id || !action) {
      return NextResponse.json(
        createApiResponse(false, null, 'State ID and action are required'),
        { status: 400 }
      );
    }

    const workflowManager = WorkflowStateManager.getInstance();

    let updatedState;

    switch (action) {
      case 'advance':
        updatedState = await workflowManager.advanceWorkflow(
          state_id,
          user,
          step_data || {}
        );
        break;
      case 'pause':
        updatedState = await workflowManager.pauseWorkflow(state_id, user);
        break;
      case 'resume':
        updatedState = await workflowManager.resumeWorkflow(state_id, user);
        break;
      default:
        return NextResponse.json(
          createApiResponse(false, null, `Unknown action: ${action}`),
          { status: 400 }
        );
    }

    return NextResponse.json(
      createApiResponse(
        true,
        updatedState,
        `Workflow ${action} completed successfully`
      )
    );
  } catch (error) {
    console.error('Error updating workflow state:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : 'Failed to update workflow state'
      ),
      { status: 500 }
    );
  }
});
