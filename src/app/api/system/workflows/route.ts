import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import WorkflowValidationService from '@/lib/workflow-validation';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const workflowId = url.searchParams.get('workflow_id');
  const includeDefinitions =
    url.searchParams.get('include_definitions') === 'true';

  try {
    const workflowService = WorkflowValidationService.getInstance();

    if (workflowId) {
      // Validate specific workflow
      const validation = await workflowService.validateWorkflow(
        user,
        workflowId
      );

      let workflowDefinition = null;
      if (includeDefinitions) {
        workflowDefinition = workflowService.getWorkflowDefinition(workflowId);
      }

      return NextResponse.json(
        createApiResponse(
          true,
          {
            validation,
            definition: workflowDefinition,
          },
          'Workflow validation completed'
        )
      );
    } else {
      // Get all workflows for user role
      const availableWorkflows = workflowService.getWorkflowsForRole(user.role);
      const workflowValidations =
        await workflowService.validateAllWorkflows(user);

      // Get active executions
      const activeExecutions = workflowService.getUserActiveExecutions(
        user._id.toString()
      );

      const response = {
        available_workflows: availableWorkflows,
        validations: workflowValidations,
        active_executions: activeExecutions,
        summary: {
          total_workflows: availableWorkflows.length,
          accessible_workflows: workflowValidations.filter((v) => v.valid)
            .length,
          blocked_workflows: workflowValidations.filter((v) => !v.valid).length,
          active_executions: activeExecutions.length,
          average_success_probability:
            workflowValidations.length > 0
              ? workflowValidations.reduce(
                  (sum, v) => sum + v.success_probability,
                  0
                ) / workflowValidations.length
              : 0,
        },
      };

      return NextResponse.json(
        createApiResponse(
          true,
          response,
          'Workflow information retrieved successfully'
        )
      );
    }
  } catch (error) {
    console.error('Error validating workflows:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to validate workflows'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  try {
    const body = await req.json();
    const { workflow_id, metadata } = body;

    if (!workflow_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Workflow ID is required'),
        { status: 400 }
      );
    }

    const workflowService = WorkflowValidationService.getInstance();

    // Start workflow execution
    const execution = await workflowService.startWorkflowExecution(
      user,
      workflow_id,
      metadata || {}
    );

    return NextResponse.json(
      createApiResponse(
        true,
        execution,
        'Workflow execution started successfully'
      )
    );
  } catch (error) {
    console.error('Error starting workflow execution:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        error instanceof Error
          ? error.message
          : 'Failed to start workflow execution'
      ),
      { status: 500 }
    );
  }
});
