/**
 * Workflow State Management Service
 * Manages complete user journey state and progress tracking
 */

import { IUser } from '../models/User';
import { UserRole } from '../types/user';
import { DataScopingService, ScopeContext } from './data-scoping';
import AuditService from './audit-service';
import ModuleIntegrationService from './module-integration';

export interface WorkflowState {
  id: string;
  user_id: string;
  workflow_type:
    | 'survey_creation'
    | 'microclimate_session'
    | 'action_plan_management'
    | 'reporting';
  current_step: string;
  completed_steps: string[];
  step_data: Record<string, any>;
  progress_percentage: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  started_at: Date;
  last_activity: Date;
  estimated_completion: Date;
  metadata: Record<string, any>;
}

export interface StepTransition {
  from_step: string;
  to_step: string;
  condition?: (state: WorkflowState, user: IUser) => Promise<boolean>;
  action?: (state: WorkflowState, user: IUser) => Promise<void>;
  validation?: (
    state: WorkflowState,
    user: IUser
  ) => Promise<{ valid: boolean; message?: string }>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: string[];
  transitions: StepTransition[];
  completion_criteria: (state: WorkflowState) => boolean;
  timeout_minutes: number;
}

export class WorkflowStateManager {
  private static instance: WorkflowStateManager;
  private activeStates: Map<string, WorkflowState> = new Map();
  private workflowDefinitions: Map<string, WorkflowDefinition> = new Map();
  private dataScopingService: DataScopingService;
  private auditService: AuditService;
  private moduleIntegrationService: ModuleIntegrationService;

  private constructor() {
    this.dataScopingService = DataScopingService.getInstance();
    this.auditService = AuditService.getInstance();
    this.moduleIntegrationService = ModuleIntegrationService.getInstance();
    this.initializeWorkflowDefinitions();
    this.startCleanupTimer();
  }

  public static getInstance(): WorkflowStateManager {
    if (!WorkflowStateManager.instance) {
      WorkflowStateManager.instance = new WorkflowStateManager();
    }
    return WorkflowStateManager.instance;
  }

  private initializeWorkflowDefinitions(): void {
    // Survey Creation Workflow
    this.workflowDefinitions.set('survey_creation', {
      id: 'survey_creation',
      name: 'Survey Creation and Management',
      steps: [
        'login',
        'dashboard_access',
        'survey_builder',
        'question_selection',
        'demographic_setup',
        'preview_survey',
        'send_invitations',
        'monitor_responses',
        'ai_analysis',
        'view_results',
        'create_action_plans',
      ],
      transitions: [
        {
          from_step: 'login',
          to_step: 'dashboard_access',
          validation: async (state, user) => {
            const scopeContext: ScopeContext = {
              user_id: user._id.toString(),
              role: user.role,
              company_id: user.company_id.toString(),
              department_id: user.department_id.toString(),
              permissions: [], // IUser doesn't have permissions array, uses hasPermission method
            };

            const validation = await this.dataScopingService.validateAccess(
              scopeContext,
              'dashboard',
              'read'
            );

            return { valid: validation.allowed, message: validation.reason };
          },
        },
        {
          from_step: 'dashboard_access',
          to_step: 'survey_builder',
          validation: async (state, user) => {
            const scopeContext: ScopeContext = {
              user_id: user._id.toString(),
              role: user.role,
              company_id: user.company_id.toString(),
              department_id: user.department_id.toString(),
              permissions: [], // IUser doesn't have permissions array, uses hasPermission method
            };

            const validation = await this.dataScopingService.validateAccess(
              scopeContext,
              'surveys',
              'write'
            );

            return { valid: validation.allowed, message: validation.reason };
          },
        },
        {
          from_step: 'survey_builder',
          to_step: 'question_selection',
          condition: async (state) => {
            return (
              state.step_data.survey_title && state.step_data.survey_description
            );
          },
        },
        {
          from_step: 'question_selection',
          to_step: 'demographic_setup',
          condition: async (state) => {
            return (
              state.step_data.selected_questions &&
              state.step_data.selected_questions.length > 0
            );
          },
        },
        {
          from_step: 'demographic_setup',
          to_step: 'preview_survey',
          condition: async (state) => {
            return state.step_data.demographics_configured === true;
          },
        },
        {
          from_step: 'preview_survey',
          to_step: 'send_invitations',
          condition: async (state) => {
            return state.step_data.survey_approved === true;
          },
          action: async (state, user) => {
            // Create survey in database
            await this.createSurveyFromState(state, user);
          },
        },
        {
          from_step: 'send_invitations',
          to_step: 'monitor_responses',
          action: async (state, user) => {
            // Send invitations
            await this.sendSurveyInvitations(state, user);
          },
        },
        {
          from_step: 'monitor_responses',
          to_step: 'ai_analysis',
          condition: async (state) => {
            return state.step_data.minimum_responses_reached === true;
          },
          action: async (state, user) => {
            // Trigger AI analysis
            await this.triggerAIAnalysis(state, user);
          },
        },
        {
          from_step: 'ai_analysis',
          to_step: 'view_results',
          condition: async (state) => {
            return state.step_data.ai_analysis_complete === true;
          },
        },
        {
          from_step: 'view_results',
          to_step: 'create_action_plans',
          condition: async (state) => {
            return state.step_data.results_reviewed === true;
          },
        },
      ],
      completion_criteria: (state) => {
        return (
          state.completed_steps.includes('view_results') ||
          state.completed_steps.includes('create_action_plans')
        );
      },
      timeout_minutes: 120,
    });

    // Microclimate Session Workflow
    this.workflowDefinitions.set('microclimate_session', {
      id: 'microclimate_session',
      name: 'Real-time Microclimate Session',
      steps: [
        'login',
        'dashboard_access',
        'microclimate_setup',
        'launch_session',
        'monitor_participation',
        'view_live_results',
        'generate_insights',
        'create_follow_up_actions',
      ],
      transitions: [
        {
          from_step: 'login',
          to_step: 'dashboard_access',
          validation: async (state, user) => {
            const scopeContext: ScopeContext = {
              user_id: user._id.toString(),
              role: user.role,
              company_id: user.company_id.toString(),
              department_id: user.department_id.toString(),
              permissions: [], // IUser doesn't have permissions array, uses hasPermission method
            };

            const validation = await this.dataScopingService.validateAccess(
              scopeContext,
              'microclimates',
              'write'
            );

            return { valid: validation.allowed, message: validation.reason };
          },
        },
        {
          from_step: 'dashboard_access',
          to_step: 'microclimate_setup',
          condition: async (state) => true,
        },
        {
          from_step: 'microclimate_setup',
          to_step: 'launch_session',
          condition: async (state) => {
            return state.step_data.microclimate_configured === true;
          },
          action: async (state, user) => {
            await this.launchMicroclimate(state, user);
          },
        },
        {
          from_step: 'launch_session',
          to_step: 'monitor_participation',
          action: async (state, user) => {
            await this.startParticipationMonitoring(state, user);
          },
        },
        {
          from_step: 'monitor_participation',
          to_step: 'view_live_results',
          condition: async (state) => {
            return state.step_data.participation_started === true;
          },
        },
        {
          from_step: 'view_live_results',
          to_step: 'generate_insights',
          condition: async (state) => {
            return state.step_data.session_ended === true;
          },
          action: async (state, user) => {
            await this.generateMicroclimateInsights(state, user);
          },
        },
        {
          from_step: 'generate_insights',
          to_step: 'create_follow_up_actions',
          condition: async (state) => {
            return state.step_data.insights_generated === true;
          },
        },
      ],
      completion_criteria: (state) => {
        return (
          state.completed_steps.includes('generate_insights') ||
          state.completed_steps.includes('create_follow_up_actions')
        );
      },
      timeout_minutes: 60,
    });

    // Action Plan Management Workflow
    this.workflowDefinitions.set('action_plan_management', {
      id: 'action_plan_management',
      name: 'Action Plan Creation and Tracking',
      steps: [
        'login',
        'dashboard_access',
        'create_action_plan',
        'assign_responsibilities',
        'set_kpis',
        'track_progress',
        'collect_feedback',
        'measure_impact',
        'trigger_follow_up',
      ],
      transitions: [
        {
          from_step: 'login',
          to_step: 'dashboard_access',
          validation: async (state, user) => {
            const scopeContext: ScopeContext = {
              user_id: user._id.toString(),
              role: user.role,
              company_id: user.company_id.toString(),
              department_id: user.department_id.toString(),
              permissions: [], // IUser doesn't have permissions array, uses hasPermission method
            };

            const validation = await this.dataScopingService.validateAccess(
              scopeContext,
              'action_plans',
              'write'
            );

            return { valid: validation.allowed, message: validation.reason };
          },
        },
        {
          from_step: 'dashboard_access',
          to_step: 'create_action_plan',
          condition: async (state) => true,
        },
        {
          from_step: 'create_action_plan',
          to_step: 'assign_responsibilities',
          condition: async (state) => {
            return state.step_data.action_plan_created === true;
          },
        },
        {
          from_step: 'assign_responsibilities',
          to_step: 'set_kpis',
          condition: async (state) => {
            return state.step_data.responsibilities_assigned === true;
          },
        },
        {
          from_step: 'set_kpis',
          to_step: 'track_progress',
          condition: async (state) => {
            return state.step_data.kpis_defined === true;
          },
          action: async (state, user) => {
            await this.startProgressTracking(state, user);
          },
        },
        {
          from_step: 'track_progress',
          to_step: 'collect_feedback',
          condition: async (state) => {
            return state.step_data.progress_tracking_active === true;
          },
        },
        {
          from_step: 'collect_feedback',
          to_step: 'measure_impact',
          condition: async (state) => {
            return state.step_data.feedback_collected === true;
          },
        },
        {
          from_step: 'measure_impact',
          to_step: 'trigger_follow_up',
          condition: async (state) => {
            return state.step_data.impact_measured === true;
          },
          action: async (state, user) => {
            await this.triggerFollowUpMicroclimate(state, user);
          },
        },
      ],
      completion_criteria: (state) => {
        return (
          state.completed_steps.includes('measure_impact') ||
          state.completed_steps.includes('trigger_follow_up')
        );
      },
      timeout_minutes: 180,
    });

    // Reporting Workflow
    this.workflowDefinitions.set('reporting', {
      id: 'reporting',
      name: 'Comprehensive Reporting',
      steps: [
        'login',
        'dashboard_access',
        'report_center_access',
        'configure_parameters',
        'generate_report',
        'review_insights',
        'export_report',
        'share_report',
      ],
      transitions: [
        {
          from_step: 'login',
          to_step: 'dashboard_access',
          validation: async (state, user) => {
            const scopeContext: ScopeContext = {
              user_id: user._id.toString(),
              role: user.role,
              company_id: user.company_id.toString(),
              department_id: user.department_id.toString(),
              permissions: [], // IUser doesn't have permissions array, uses hasPermission method
            };

            const validation = await this.dataScopingService.validateAccess(
              scopeContext,
              'reports',
              'read'
            );

            return { valid: validation.allowed, message: validation.reason };
          },
        },
        {
          from_step: 'dashboard_access',
          to_step: 'report_center_access',
          condition: async (state) => true,
        },
        {
          from_step: 'report_center_access',
          to_step: 'configure_parameters',
          condition: async (state) => true,
        },
        {
          from_step: 'configure_parameters',
          to_step: 'generate_report',
          condition: async (state) => {
            return state.step_data.parameters_configured === true;
          },
          action: async (state, user) => {
            await this.generateComprehensiveReport(state, user);
          },
        },
        {
          from_step: 'generate_report',
          to_step: 'review_insights',
          condition: async (state) => {
            return state.step_data.report_generated === true;
          },
        },
        {
          from_step: 'review_insights',
          to_step: 'export_report',
          condition: async (state) => {
            return state.step_data.insights_reviewed === true;
          },
        },
        {
          from_step: 'export_report',
          to_step: 'share_report',
          condition: async (state) => {
            return state.step_data.report_exported === true;
          },
        },
      ],
      completion_criteria: (state) => {
        return (
          state.completed_steps.includes('review_insights') ||
          state.completed_steps.includes('export_report') ||
          state.completed_steps.includes('share_report')
        );
      },
      timeout_minutes: 90,
    });
  }

  public async startWorkflow(
    user: IUser,
    workflowType: string,
    initialData: Record<string, any> = {}
  ): Promise<WorkflowState> {
    const workflowDef = this.workflowDefinitions.get(workflowType);
    if (!workflowDef) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    const stateId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const state: WorkflowState = {
      id: stateId,
      user_id: user._id.toString(),
      workflow_type: workflowType as any,
      current_step: workflowDef.steps[0],
      completed_steps: [],
      step_data: initialData,
      progress_percentage: 0,
      status: 'active',
      started_at: now,
      last_activity: now,
      estimated_completion: new Date(
        now.getTime() + workflowDef.timeout_minutes * 60 * 1000
      ),
      metadata: {
        workflow_definition_id: workflowDef.id,
        user_role: user.role,
        company_id: user.company_id.toString(),
        department_id: user.department_id.toString(),
      },
    };

    this.activeStates.set(stateId, state);

    // Log workflow start
    await this.auditService.logEvent({
      action: 'create',
      resource: 'action_plan',
      resource_id: stateId,
      success: true,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        workflow_type: workflowType,
        initial_step: state.current_step,
        estimated_completion: state.estimated_completion,
      },
    });

    return state;
  }

  public async advanceWorkflow(
    stateId: string,
    user: IUser,
    stepData: Record<string, any> = {}
  ): Promise<WorkflowState> {
    const state = this.activeStates.get(stateId);
    if (!state) {
      throw new Error(`Workflow state not found: ${stateId}`);
    }

    if (state.user_id !== user._id.toString()) {
      throw new Error('Unauthorized to modify this workflow');
    }

    const workflowDef = this.workflowDefinitions.get(state.workflow_type);
    if (!workflowDef) {
      throw new Error(`Workflow definition not found: ${state.workflow_type}`);
    }

    // Update step data
    state.step_data = { ...state.step_data, ...stepData };
    state.last_activity = new Date();

    // Mark current step as completed
    if (!state.completed_steps.includes(state.current_step)) {
      state.completed_steps.push(state.current_step);
    }

    // Find next step
    const currentStepIndex = workflowDef.steps.indexOf(state.current_step);
    const transitions = workflowDef.transitions.filter(
      (t) => t.from_step === state.current_step
    );

    let nextStep: string | null = null;

    for (const transition of transitions) {
      // Check validation if present
      if (transition.validation) {
        const validation = await transition.validation(state, user);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.message}`);
        }
      }

      // Check condition if present
      if (transition.condition) {
        const conditionMet = await transition.condition(state, user);
        if (!conditionMet) {
          continue;
        }
      }

      // Execute action if present
      if (transition.action) {
        await transition.action(state, user);
      }

      nextStep = transition.to_step;
      break;
    }

    // If no transition found, try next step in sequence
    if (!nextStep && currentStepIndex < workflowDef.steps.length - 1) {
      nextStep = workflowDef.steps[currentStepIndex + 1];
    }

    if (nextStep) {
      state.current_step = nextStep;
    }

    // Update progress
    state.progress_percentage = Math.round(
      (state.completed_steps.length / workflowDef.steps.length) * 100
    );

    // Check completion
    if (workflowDef.completion_criteria(state)) {
      state.status = 'completed';
    }

    this.activeStates.set(stateId, state);

    // Log step advancement
    await this.auditService.logEvent({
      action: 'update',
      resource: 'action_plan',
      resource_id: stateId,
      success: true,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        previous_step: workflowDef.steps[currentStepIndex],
        current_step: state.current_step,
        progress_percentage: state.progress_percentage,
        status: state.status,
      },
    });

    return state;
  }

  public getWorkflowState(stateId: string): WorkflowState | undefined {
    return this.activeStates.get(stateId);
  }

  public getUserActiveWorkflows(userId: string): WorkflowState[] {
    return Array.from(this.activeStates.values()).filter(
      (state) => state.user_id === userId && state.status === 'active'
    );
  }

  public async pauseWorkflow(
    stateId: string,
    user: IUser
  ): Promise<WorkflowState> {
    const state = this.activeStates.get(stateId);
    if (!state) {
      throw new Error(`Workflow state not found: ${stateId}`);
    }

    if (state.user_id !== user._id.toString()) {
      throw new Error('Unauthorized to modify this workflow');
    }

    state.status = 'paused';
    state.last_activity = new Date();

    this.activeStates.set(stateId, state);

    await this.auditService.logEvent({
      action: 'update',
      resource: 'action_plan',
      resource_id: stateId,
      success: true,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        current_step: state.current_step,
        progress_percentage: state.progress_percentage,
      },
    });

    return state;
  }

  public async resumeWorkflow(
    stateId: string,
    user: IUser
  ): Promise<WorkflowState> {
    const state = this.activeStates.get(stateId);
    if (!state) {
      throw new Error(`Workflow state not found: ${stateId}`);
    }

    if (state.user_id !== user._id.toString()) {
      throw new Error('Unauthorized to modify this workflow');
    }

    state.status = 'active';
    state.last_activity = new Date();

    this.activeStates.set(stateId, state);

    await this.auditService.logEvent({
      action: 'update',
      resource: 'action_plan',
      resource_id: stateId,
      success: true,
      context: {
        user_id: user._id.toString(),
        company_id: user.company_id.toString(),
        ip_address: '',
      },
      details: {
        current_step: state.current_step,
        progress_percentage: state.progress_percentage,
      },
    });

    return state;
  }

  // Workflow action implementations
  private async createSurveyFromState(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    // Implementation would create survey in database
    console.log('Creating survey from workflow state:', state.step_data);

    // Emit cross-module event
    await this.moduleIntegrationService.emitEvent({
      type: 'survey_completed',
      source_module: 'surveys',
      target_modules: ['ai_insights', 'notifications'],
      data: {
        survey_id: state.step_data.survey_id,
        workflow_state_id: state.id,
      },
      context: {
        user,
        action: 'survey_creation',
        resource_type: 'survey',
        resource_id: state.step_data.survey_id,
      },
      timestamp: new Date(),
    });
  }

  private async sendSurveyInvitations(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log(
      'Sending survey invitations from workflow state:',
      state.step_data
    );

    // Update state to indicate invitations sent
    state.step_data.invitations_sent = true;
    state.step_data.invitation_count =
      state.step_data.target_audience?.length || 0;
  }

  private async triggerAIAnalysis(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Triggering AI analysis from workflow state:', state.step_data);

    // Update state to indicate AI analysis started
    state.step_data.ai_analysis_started = true;

    // In real implementation, this would call the AI service
    setTimeout(() => {
      state.step_data.ai_analysis_complete = true;
    }, 1000);
  }

  private async launchMicroclimate(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Launching microclimate from workflow state:', state.step_data);

    await this.moduleIntegrationService.emitEvent({
      type: 'microclimate_launched',
      source_module: 'microclimates',
      target_modules: ['notifications', 'ai_insights'],
      data: {
        microclimate_id: state.step_data.microclimate_id,
        department_id: user.department_id,
        workflow_state_id: state.id,
      },
      context: {
        user,
        action: 'microclimate_launch',
        resource_type: 'microclimate',
        resource_id: state.step_data.microclimate_id,
      },
      timestamp: new Date(),
    });
  }

  private async startParticipationMonitoring(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Starting participation monitoring:', state.step_data);
    state.step_data.participation_started = true;
  }

  private async generateMicroclimateInsights(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Generating microclimate insights:', state.step_data);
    state.step_data.insights_generated = true;
  }

  private async startProgressTracking(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Starting progress tracking:', state.step_data);
    state.step_data.progress_tracking_active = true;
  }

  private async triggerFollowUpMicroclimate(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Triggering follow-up microclimate:', state.step_data);
    state.step_data.follow_up_triggered = true;
  }

  private async generateComprehensiveReport(
    state: WorkflowState,
    user: IUser
  ): Promise<void> {
    console.log('Generating comprehensive report:', state.step_data);
    state.step_data.report_generated = true;
  }

  // Cleanup timer for abandoned workflows
  private startCleanupTimer(): void {
    setInterval(
      () => {
        this.cleanupAbandonedWorkflows();
      },
      60 * 60 * 1000
    ); // Run every hour
  }

  private cleanupAbandonedWorkflows(): void {
    const now = new Date();
    const abandonedStates: string[] = [];

    for (const [stateId, state] of this.activeStates) {
      // Mark as abandoned if inactive for more than the timeout period
      const timeoutMs = 120 * 60 * 1000; // 2 hours default
      if (now.getTime() - state.last_activity.getTime() > timeoutMs) {
        state.status = 'abandoned';
        abandonedStates.push(stateId);
      }
    }

    // Remove abandoned states
    for (const stateId of abandonedStates) {
      this.activeStates.delete(stateId);
    }

    if (abandonedStates.length > 0) {
      console.log(
        `Cleaned up ${abandonedStates.length} abandoned workflow states`
      );
    }
  }
}

export default WorkflowStateManager;
