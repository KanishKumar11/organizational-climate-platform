import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import ModuleIntegrationService from '@/lib/module-integration';
import WorkflowValidationService from '@/lib/workflow-validation';
import { hasFeaturePermission } from '@/lib/permissions';

export const GET = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins and company admins can check system integration
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const integrationService = ModuleIntegrationService.getInstance();
    const workflowService = WorkflowValidationService.getInstance();

    // Get system health status
    const systemHealth = await integrationService.checkSystemHealth();

    // Validate user workflows
    const workflowValidations =
      await workflowService.validateAllWorkflows(user);

    // Get integration configuration
    const integrationConfig = integrationService.getConfig();

    // Get available workflows for user role
    const availableWorkflows = workflowService.getWorkflowsForRole(user.role);

    // Get active workflow executions for user
    const activeExecutions = workflowService.getUserActiveExecutions(
      user._id.toString()
    );

    const integrationStatus = {
      system_health: systemHealth,
      workflow_validations: workflowValidations,
      integration_config: integrationConfig,
      available_workflows: availableWorkflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        steps_count: w.steps.length,
        target_roles: w.target_roles,
      })),
      active_executions: activeExecutions,
      user_context: {
        role: user.role,
        // permissions: user.permissions || [], // Property doesn't exist on IUser
        company_id: user.company_id,
        department_id: user.department_id,
      },
      integration_metrics: {
        total_modules: systemHealth.modules.length,
        healthy_modules: systemHealth.modules.filter(
          (m) => m.status === 'healthy'
        ).length,
        degraded_modules: systemHealth.modules.filter(
          (m) => m.status === 'degraded'
        ).length,
        error_modules: systemHealth.modules.filter((m) => m.status === 'error')
          .length,
        accessible_workflows: workflowValidations.filter((w) => w.valid).length,
        blocked_workflows: workflowValidations.filter((w) => !w.valid).length,
      },
    };

    return NextResponse.json(
      createApiResponse(
        true,
        integrationStatus,
        'System integration status retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Error checking system integration:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to check system integration'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can update integration configuration
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { config_updates } = body;

    if (!config_updates) {
      return NextResponse.json(
        createApiResponse(false, null, 'Configuration updates required'),
        { status: 400 }
      );
    }

    const integrationService = ModuleIntegrationService.getInstance();

    // Update integration configuration
    integrationService.updateConfig(config_updates);

    // Get updated configuration
    const updatedConfig = integrationService.getConfig();

    return NextResponse.json(
      createApiResponse(
        true,
        updatedConfig,
        'Integration configuration updated successfully'
      )
    );
  } catch (error) {
    console.error('Error updating integration configuration:', error);
    return NextResponse.json(
      createApiResponse(
        false,
        null,
        'Failed to update integration configuration'
      ),
      { status: 500 }
    );
  }
});
