import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import WorkflowValidationService from '@/lib/workflow-validation';

export const GET = withAuth(async (req, { params }) => {
  const user = req.user!;
  const { executionId } = params;

  try {
    const workflowService = WorkflowValidationService.getInstance();

    const execution = workflowService.getWorkflowExecution(executionId);

    if (!execution) {
      return NextResponse.json(
        createApiResponse(false, null, 'Workflow execution not found'),
        { status: 404 }
      );
    }

    // Check if user owns this execution
    if (execution.user_id !== user._id.toString()) {
      return NextResponse.json(
        createApiResponse(false, null, 'Access denied'),
        { status: 403 }
      );
    }

    // Get workflow definition for context
    const workflowDefinition = workflowService.getWorkflowDefinition(
      execution.workflow_id
    );

    const response = {
      execution,
      workflow_definition: workflowDefinition,
      progress: {
        total_steps: workflowDefinition?.steps.length || 0,
        completed_steps: execution.completed_steps.length,
        failed_steps: execution.failed_steps.length,
        completion_percentage: workflowDefinition?.steps.length
          ? (execution.completed_steps.length /
              workflowDefinition.steps.length) *
            100
          : 0,
      },
    };

    return NextResponse.json(
      createApiResponse(
        true,
        response,
        'Workflow execution retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error retrieving workflow execution:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve workflow execution'),
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req, { params }) => {
  const user = req.user!;
  const { executionId } = params;

  try {
    const body = await req.json();
    const { step_id, status, metadata } = body;

    if (!step_id || !status) {
      return NextResponse.json(
        createApiResponse(false, null, 'Step ID and status are required'),
        { status: 400 }
      );
    }

    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'Status must be "completed" or "failed"'
        ),
        { status: 400 }
      );
    }

    const workflowService = WorkflowValidationService.getInstance();

    const execution = workflowService.getWorkflowExecution(executionId);

    if (!execution) {
      return NextResponse.json(
        createApiResponse(false, null, 'Workflow execution not found'),
        { status: 404 }
      );
    }

    // Check if user owns this execution
    if (execution.user_id !== user._id.toString()) {
      return NextResponse.json(
        createApiResponse(false, null, 'Access denied'),
        { status: 403 }
      );
    }

    // Update workflow execution
    const updatedExecution = await workflowService.updateWorkflowExecution(
      executionId,
      step_id,
      status,
      metadata || {}
    );

    return NextResponse.json(
      createApiResponse(
        true,
        updatedExecution,
        'Workflow execution updated successfully'
      )
    );
  } catch (error) {
    console.error('Error updating workflow execution:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : 'Failed to update workflow execution'
      ),
      { status: 500 }
    );
  }
});
