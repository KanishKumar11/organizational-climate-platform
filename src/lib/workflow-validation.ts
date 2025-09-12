/**
 * Workflow Validation Service
 * Validates complete user workflows from login to reporting
 */

import { IUser } from '../models/User';
import { UserRole } from '../types/user';
import { DataScopingService, ScopeContext } from './data-scoping';
import { hasFeaturePermission } from './permissions';
import AuditService from './audit-service';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  required_permissions: string[];
  required_role?: UserRole;
  resource_type: string;
  operation: 'read' | 'write' | 'delete';
  dependencies: string[];
  optional: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  target_roles: UserRole[];
  steps: WorkflowStep[];
  success_criteria: string[];
}

export interface WorkflowValidationResult {
  workflow_id: string;
  user_id: string;
  valid: boolean;
  accessible_steps: WorkflowStep[];
  blocked_steps: WorkflowStep[];
  missing_permissions: string[];
  recommendations: string[];
  estimated_completion_time: number;
  success_probability: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
  current_step: string;
  completed_steps: string[];
  failed_steps: string[];
  started_at: Date;
  completed_at?: Date;
  metadata: Record<string, any>;
}

export class WorkflowValidationService {
  private static instance: WorkflowValidationService;
  private dataScopingService: DataScopingService;
  private auditService: AuditService;
  private workflowDefinitions: Map<string, WorkflowDefinition> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  private constructor() {
    this.dataScopingService = DataScopingService.getInstance();
    this.auditService = AuditService.getInstance();
    this.initializeWorkflowDefinitions();
  }

  public static getInstance(): WorkflowValidationService {
    if (!WorkflowValidationService.instance) {
      WorkflowValidationService.instance = new WorkflowValidationService();
    }
    return WorkflowValidationService.instance;
  }

  private initializeWorkflowDefinitions(): void {
    // Complete Survey Workflow
    this.workflowDefinitions.set('complete_survey_workflow', {
      id: 'complete_survey_workflow',
      name: 'Complete Survey Workflow',
      description:
        'End-to-end survey creation, distribution, and analysis workflow',
      target_roles: ['super_admin', 'company_admin', 'department_admin'],
      steps: [
        {
          id: 'login',
          name: 'User Authentication',
          description: 'User logs into the system',
          required_permissions: [],
          resource_type: 'auth',
          operation: 'read',
          dependencies: [],
          optional: false,
        },
        {
          id: 'access_dashboard',
          name: 'Access Dashboard',
          description: 'User accesses role-appropriate dashboard',
          required_permissions: ['VIEW_DASHBOARD'],
          resource_type: 'dashboard',
          operation: 'read',
          dependencies: ['login'],
          optional: false,
        },
        {
          id: 'create_survey',
          name: 'Create Survey',
          description: 'User creates a new survey using the survey builder',
          required_permissions: ['CREATE_SURVEYS'],
          resource_type: 'surveys',
          operation: 'write',
          dependencies: ['access_dashboard'],
          optional: false,
        },
        {
          id: 'configure_demographics',
          name: 'Configure Demographics',
          description: 'Set up demographic segmentation for the survey',
          required_permissions: ['MANAGE_DEMOGRAPHICS'],
          resource_type: 'demographics',
          operation: 'write',
          dependencies: ['create_survey'],
          optional: true,
        },
        {
          id: 'send_invitations',
          name: 'Send Survey Invitations',
          description: 'Distribute survey invitations to target audience',
          required_permissions: ['SEND_INVITATIONS'],
          resource_type: 'invitations',
          operation: 'write',
          dependencies: ['create_survey'],
          optional: false,
        },
        {
          id: 'collect_responses',
          name: 'Collect Responses',
          description: 'Monitor and collect survey responses',
          required_permissions: ['VIEW_RESPONSES'],
          resource_type: 'responses',
          operation: 'read',
          dependencies: ['send_invitations'],
          optional: false,
        },
        {
          id: 'ai_analysis',
          name: 'AI Analysis',
          description: 'Trigger AI analysis of survey responses',
          required_permissions: ['VIEW_AI_INSIGHTS'],
          resource_type: 'ai_insights',
          operation: 'read',
          dependencies: ['collect_responses'],
          optional: false,
        },
        {
          id: 'view_results',
          name: 'View Survey Results',
          description: 'Review survey results and insights',
          required_permissions: ['VIEW_SURVEY_RESULTS'],
          resource_type: 'surveys',
          operation: 'read',
          dependencies: ['ai_analysis'],
          optional: false,
        },
        {
          id: 'create_action_plans',
          name: 'Create Action Plans',
          description: 'Create action plans based on survey insights',
          required_permissions: ['CREATE_ACTION_PLANS'],
          resource_type: 'action_plans',
          operation: 'write',
          dependencies: ['view_results'],
          optional: true,
        },
        {
          id: 'generate_reports',
          name: 'Generate Reports',
          description: 'Generate and export comprehensive reports',
          required_permissions: ['GENERATE_REPORTS'],
          resource_type: 'reports',
          operation: 'write',
          dependencies: ['view_results'],
          optional: true,
        },
      ],
      success_criteria: [
        'Survey created successfully',
        'Invitations sent to target audience',
        'Minimum response rate achieved',
        'AI analysis completed',
        'Results reviewed by stakeholders',
      ],
    });

    // Microclimate Workflow
    this.workflowDefinitions.set('microclimate_workflow', {
      id: 'microclimate_workflow',
      name: 'Real-time Microclimate Workflow',
      description: 'Launch and manage real-time microclimate feedback sessions',
      target_roles: ['company_admin', 'department_admin'],
      steps: [
        {
          id: 'login',
          name: 'User Authentication',
          description: 'User logs into the system',
          required_permissions: [],
          resource_type: 'auth',
          operation: 'read',
          dependencies: [],
          optional: false,
        },
        {
          id: 'access_dashboard',
          name: 'Access Dashboard',
          description: 'User accesses role-appropriate dashboard',
          required_permissions: ['VIEW_DASHBOARD'],
          resource_type: 'dashboard',
          operation: 'read',
          dependencies: ['login'],
          optional: false,
        },
        {
          id: 'launch_microclimate',
          name: 'Launch Microclimate',
          description: 'Create and launch a real-time microclimate session',
          required_permissions: ['LAUNCH_MICROCLIMATES'],
          resource_type: 'microclimates',
          operation: 'write',
          dependencies: ['access_dashboard'],
          optional: false,
        },
        {
          id: 'monitor_responses',
          name: 'Monitor Real-time Responses',
          description: 'Monitor live responses and participation',
          required_permissions: ['VIEW_MICROCLIMATE_RESULTS'],
          resource_type: 'microclimates',
          operation: 'read',
          dependencies: ['launch_microclimate'],
          optional: false,
        },
        {
          id: 'view_live_insights',
          name: 'View Live AI Insights',
          description: 'Review real-time AI-generated insights',
          required_permissions: ['VIEW_AI_INSIGHTS'],
          resource_type: 'ai_insights',
          operation: 'read',
          dependencies: ['monitor_responses'],
          optional: false,
        },
        {
          id: 'create_follow_up_actions',
          name: 'Create Follow-up Actions',
          description:
            'Create immediate action items based on microclimate results',
          required_permissions: ['CREATE_ACTION_PLANS'],
          resource_type: 'action_plans',
          operation: 'write',
          dependencies: ['view_live_insights'],
          optional: true,
        },
      ],
      success_criteria: [
        'Microclimate launched successfully',
        'Target participation rate achieved',
        'Real-time insights generated',
        'Follow-up actions identified',
      ],
    });

    // Action Plan Management Workflow
    this.workflowDefinitions.set('action_plan_workflow', {
      id: 'action_plan_workflow',
      name: 'Action Plan Management Workflow',
      description: 'Create, assign, and track action plan progress',
      target_roles: ['company_admin', 'department_admin'],
      steps: [
        {
          id: 'login',
          name: 'User Authentication',
          description: 'User logs into the system',
          required_permissions: [],
          resource_type: 'auth',
          operation: 'read',
          dependencies: [],
          optional: false,
        },
        {
          id: 'access_dashboard',
          name: 'Access Dashboard',
          description: 'User accesses role-appropriate dashboard',
          required_permissions: ['VIEW_DASHBOARD'],
          resource_type: 'dashboard',
          operation: 'read',
          dependencies: ['login'],
          optional: false,
        },
        {
          id: 'create_action_plan',
          name: 'Create Action Plan',
          description: 'Create a new action plan with objectives and KPIs',
          required_permissions: ['CREATE_ACTION_PLANS'],
          resource_type: 'action_plans',
          operation: 'write',
          dependencies: ['access_dashboard'],
          optional: false,
        },
        {
          id: 'assign_responsibilities',
          name: 'Assign Responsibilities',
          description: 'Assign action items to team members',
          required_permissions: ['ASSIGN_ACTION_PLANS'],
          resource_type: 'action_plans',
          operation: 'write',
          dependencies: ['create_action_plan'],
          optional: false,
        },
        {
          id: 'track_progress',
          name: 'Track Progress',
          description: 'Monitor action plan progress and KPIs',
          required_permissions: ['VIEW_ACTION_PLAN_PROGRESS'],
          resource_type: 'action_plans',
          operation: 'read',
          dependencies: ['assign_responsibilities'],
          optional: false,
        },
        {
          id: 'collect_feedback',
          name: 'Collect Qualitative Feedback',
          description:
            'Gather qualitative feedback on action plan effectiveness',
          required_permissions: ['COLLECT_FEEDBACK'],
          resource_type: 'responses',
          operation: 'write',
          dependencies: ['track_progress'],
          optional: true,
        },
        {
          id: 'measure_impact',
          name: 'Measure Impact',
          description: 'Assess the impact of completed action plans',
          required_permissions: ['VIEW_ANALYTICS'],
          resource_type: 'analytics',
          operation: 'read',
          dependencies: ['track_progress'],
          optional: false,
        },
        {
          id: 'trigger_follow_up',
          name: 'Trigger Follow-up Microclimates',
          description: 'Launch follow-up microclimates to measure improvement',
          required_permissions: ['LAUNCH_MICROCLIMATES'],
          resource_type: 'microclimates',
          operation: 'write',
          dependencies: ['measure_impact'],
          optional: true,
        },
      ],
      success_criteria: [
        'Action plan created with clear objectives',
        'Responsibilities assigned to team members',
        'Progress tracked regularly',
        'Impact measured and documented',
      ],
    });

    // Employee Participation Workflow
    this.workflowDefinitions.set('employee_participation_workflow', {
      id: 'employee_participation_workflow',
      name: 'Employee Participation Workflow',
      description: 'Employee survey participation and feedback workflow',
      target_roles: ['employee'],
      steps: [
        {
          id: 'login',
          name: 'User Authentication',
          description: 'Employee logs into the system',
          required_permissions: [],
          resource_type: 'auth',
          operation: 'read',
          dependencies: [],
          optional: false,
        },
        {
          id: 'access_dashboard',
          name: 'Access Personal Dashboard',
          description: 'Employee accesses their personal dashboard',
          required_permissions: ['VIEW_PERSONAL_DASHBOARD'],
          resource_type: 'dashboard',
          operation: 'read',
          dependencies: ['login'],
          optional: false,
        },
        {
          id: 'view_assigned_surveys',
          name: 'View Assigned Surveys',
          description: 'Employee views surveys assigned to them',
          required_permissions: ['PARTICIPATE_IN_SURVEYS'],
          resource_type: 'surveys',
          operation: 'read',
          dependencies: ['access_dashboard'],
          optional: false,
        },
        {
          id: 'complete_survey',
          name: 'Complete Survey',
          description:
            'Employee completes assigned survey with adaptive questions',
          required_permissions: ['PARTICIPATE_IN_SURVEYS'],
          resource_type: 'responses',
          operation: 'write',
          dependencies: ['view_assigned_surveys'],
          optional: false,
        },
        {
          id: 'participate_microclimate',
          name: 'Participate in Microclimates',
          description:
            'Employee participates in real-time microclimate sessions',
          required_permissions: ['PARTICIPATE_IN_MICROCLIMATES'],
          resource_type: 'microclimates',
          operation: 'write',
          dependencies: ['access_dashboard'],
          optional: true,
        },
        {
          id: 'view_personal_results',
          name: 'View Personal Results',
          description: 'Employee views their personal results if enabled',
          required_permissions: ['VIEW_PERSONAL_RESULTS'],
          resource_type: 'responses',
          operation: 'read',
          dependencies: ['complete_survey'],
          optional: true,
        },
      ],
      success_criteria: [
        'Employee successfully logs in',
        'Assigned surveys completed',
        'Microclimate participation when available',
        'Personal insights accessed if enabled',
      ],
    });

    // Reporting and Analytics Workflow
    this.workflowDefinitions.set('reporting_workflow', {
      id: 'reporting_workflow',
      name: 'Comprehensive Reporting Workflow',
      description: 'Generate, customize, and distribute comprehensive reports',
      target_roles: ['super_admin', 'company_admin'],
      steps: [
        {
          id: 'login',
          name: 'User Authentication',
          description: 'User logs into the system',
          required_permissions: [],
          resource_type: 'auth',
          operation: 'read',
          dependencies: [],
          optional: false,
        },
        {
          id: 'access_dashboard',
          name: 'Access Dashboard',
          description: 'User accesses role-appropriate dashboard',
          required_permissions: ['VIEW_DASHBOARD'],
          resource_type: 'dashboard',
          operation: 'read',
          dependencies: ['login'],
          optional: false,
        },
        {
          id: 'access_report_center',
          name: 'Access Report Center',
          description: 'Navigate to the comprehensive report center',
          required_permissions: ['ACCESS_REPORT_CENTER'],
          resource_type: 'reports',
          operation: 'read',
          dependencies: ['access_dashboard'],
          optional: false,
        },
        {
          id: 'configure_report',
          name: 'Configure Report Parameters',
          description: 'Set up report filters, demographics, and time periods',
          required_permissions: ['CONFIGURE_REPORTS'],
          resource_type: 'reports',
          operation: 'write',
          dependencies: ['access_report_center'],
          optional: false,
        },
        {
          id: 'generate_report',
          name: 'Generate Report',
          description: 'Generate comprehensive report with AI insights',
          required_permissions: ['GENERATE_REPORTS'],
          resource_type: 'reports',
          operation: 'write',
          dependencies: ['configure_report'],
          optional: false,
        },
        {
          id: 'review_insights',
          name: 'Review AI-Generated Insights',
          description: 'Review executive summary and AI recommendations',
          required_permissions: ['VIEW_AI_INSIGHTS'],
          resource_type: 'ai_insights',
          operation: 'read',
          dependencies: ['generate_report'],
          optional: false,
        },
        {
          id: 'export_report',
          name: 'Export Report',
          description: 'Export report in multiple formats (PDF, Excel)',
          required_permissions: ['EXPORT_REPORTS'],
          resource_type: 'reports',
          operation: 'read',
          dependencies: ['review_insights'],
          optional: true,
        },
        {
          id: 'share_report',
          name: 'Share Report',
          description: 'Share report with stakeholders and team members',
          required_permissions: ['SHARE_REPORTS'],
          resource_type: 'reports',
          operation: 'write',
          dependencies: ['generate_report'],
          optional: true,
        },
      ],
      success_criteria: [
        'Report parameters configured correctly',
        'Comprehensive report generated',
        'AI insights reviewed and understood',
        'Report shared with relevant stakeholders',
      ],
    });
  }

  public async validateWorkflow(
    user: IUser,
    workflowId: string
  ): Promise<WorkflowValidationResult> {
    const workflow = this.workflowDefinitions.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const scopeContext: ScopeContext = {
      user_id: user._id.toString(),
      role: user.role,
      company_id: user.company_id.toString(),
      department_id: user.department_id.toString(),
      permissions: [], // IUser doesn't have permissions array, uses hasPermission method
    };

    const accessibleSteps: WorkflowStep[] = [];
    const blockedSteps: WorkflowStep[] = [];
    const missingPermissions: string[] = [];
    const recommendations: string[] = [];

    // Check if user role is appropriate for this workflow
    if (!workflow.target_roles.includes(user.role)) {
      recommendations.push(
        `This workflow is not designed for ${user.role} role`
      );
    }

    // Validate each step
    for (const step of workflow.steps) {
      let stepAccessible = true;
      const stepMissingPermissions: string[] = [];

      // Check role requirements
      if (step.required_role && step.required_role !== user.role) {
        stepAccessible = false;
        recommendations.push(
          `Step "${step.name}" requires ${step.required_role} role`
        );
      }

      // Check permissions
      for (const permission of step.required_permissions) {
        if (!hasFeaturePermission(user.role, permission as any)) {
          stepAccessible = false;
          stepMissingPermissions.push(permission);
        }
      }

      // Check data scoping
      if (step.resource_type !== 'auth') {
        const scopeValidation = await this.dataScopingService.validateAccess(
          scopeContext,
          step.resource_type,
          step.operation
        );

        if (!scopeValidation.allowed) {
          stepAccessible = false;
          recommendations.push(
            `Step "${step.name}": ${scopeValidation.reason}`
          );
        }
      }

      if (stepAccessible) {
        accessibleSteps.push(step);
      } else {
        blockedSteps.push(step);
        missingPermissions.push(...stepMissingPermissions);
      }
    }

    // Calculate success probability
    const totalSteps = workflow.steps.length;
    const accessibleCount = accessibleSteps.length;
    const requiredSteps = workflow.steps.filter((s) => !s.optional).length;
    const accessibleRequiredSteps = accessibleSteps.filter(
      (s) => !s.optional
    ).length;

    const successProbability =
      requiredSteps > 0 ? (accessibleRequiredSteps / requiredSteps) * 100 : 100;

    // Estimate completion time (in minutes)
    const estimatedTime = accessibleSteps.length * 5; // 5 minutes per step average

    // Log validation
    await this.auditService.logEvent({
      action: 'read',
      resource: 'action_plan',
      resource_id: workflowId,
      success: successProbability > 80,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        workflow_name: workflow.name,
        accessible_steps: accessibleCount,
        blocked_steps: blockedSteps.length,
        success_probability: successProbability,
        missing_permissions: missingPermissions,
      },
    });

    return {
      workflow_id: workflowId,
      user_id: user._id.toString(),
      valid: blockedSteps.length === 0,
      accessible_steps: accessibleSteps,
      blocked_steps: blockedSteps,
      missing_permissions: [...new Set(missingPermissions)],
      recommendations,
      estimated_completion_time: estimatedTime,
      success_probability: successProbability,
    };
  }

  public async validateAllWorkflows(
    user: IUser
  ): Promise<WorkflowValidationResult[]> {
    const results: WorkflowValidationResult[] = [];

    for (const [workflowId] of this.workflowDefinitions) {
      try {
        const result = await this.validateWorkflow(user, workflowId);
        results.push(result);
      } catch (error) {
        console.error(`Error validating workflow ${workflowId}:`, error);
      }
    }

    return results;
  }

  public getWorkflowDefinition(
    workflowId: string
  ): WorkflowDefinition | undefined {
    return this.workflowDefinitions.get(workflowId);
  }

  public getAllWorkflowDefinitions(): WorkflowDefinition[] {
    return Array.from(this.workflowDefinitions.values());
  }

  public getWorkflowsForRole(role: UserRole): WorkflowDefinition[] {
    return Array.from(this.workflowDefinitions.values()).filter((workflow) =>
      workflow.target_roles.includes(role)
    );
  }

  // Workflow Execution Tracking
  public async startWorkflowExecution(
    user: IUser,
    workflowId: string,
    metadata: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const validation = await this.validateWorkflow(user, workflowId);

    if (!validation.valid) {
      throw new Error(
        `Cannot start workflow: ${validation.recommendations.join(', ')}`
      );
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflow_id: workflowId,
      user_id: user._id.toString(),
      status: 'not_started',
      current_step: validation.accessible_steps[0]?.id || '',
      completed_steps: [],
      failed_steps: [],
      started_at: new Date(),
      metadata,
    };

    this.activeExecutions.set(execution.id, execution);

    await this.auditService.logEvent({
      action: 'create',
      resource: 'action_plan',
      resource_id: workflowId,
      success: true,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        execution_id: execution.id,
        estimated_time: validation.estimated_completion_time,
        success_probability: validation.success_probability,
      },
    });

    return execution;
  }

  public async updateWorkflowExecution(
    executionId: string,
    stepId: string,
    status: 'completed' | 'failed',
    metadata: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }

    if (status === 'completed') {
      execution.completed_steps.push(stepId);
    } else {
      execution.failed_steps.push(stepId);
    }

    execution.metadata = { ...execution.metadata, ...metadata };
    execution.status = 'in_progress';

    // Check if workflow is complete
    const workflow = this.workflowDefinitions.get(execution.workflow_id);
    if (workflow) {
      const requiredSteps = workflow.steps.filter((s) => !s.optional);
      const completedRequiredSteps = execution.completed_steps.filter(
        (stepId) => requiredSteps.some((s) => s.id === stepId)
      );

      if (completedRequiredSteps.length === requiredSteps.length) {
        execution.status = 'completed';
        execution.completed_at = new Date();
      } else if (execution.failed_steps.length > 0) {
        execution.status = 'failed';
        execution.completed_at = new Date();
      }
    }

    this.activeExecutions.set(executionId, execution);

    await this.auditService.logEvent({
      action: 'update',
      resource: 'action_plan',
      resource_id: execution.workflow_id,
      success: status === 'completed',
      context: {
        user_id: execution.user_id,
        company_id: '',
        ip_address: '',
      },
      details: {
        execution_id: executionId,
        step_id: stepId,
        step_status: status,
        workflow_status: execution.status,
      },
    });

    return execution;
  }

  public getWorkflowExecution(
    executionId: string
  ): WorkflowExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  public getUserActiveExecutions(userId: string): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values()).filter(
      (exec) => exec.user_id === userId && exec.status === 'in_progress'
    );
  }
}

export default WorkflowValidationService;
