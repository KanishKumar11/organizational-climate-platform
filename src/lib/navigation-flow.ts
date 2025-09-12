/**
 * Navigation Flow Service
 * Manages seamless navigation and guided user journeys
 */

import { IUser } from '../models/User';
import { UserRole } from '../types/user';
import { hasFeaturePermission } from './permissions';
import WorkflowValidationService from './workflow-validation';

export interface NavigationStep {
  id: string;
  title: string;
  description: string;
  path: string;
  icon?: string;
  required_permissions: string[];
  required_role?: UserRole;
  completion_criteria?: string[];
  estimated_time_minutes: number;
  dependencies: string[];
  optional: boolean;
}

export interface UserJourney {
  id: string;
  name: string;
  description: string;
  target_roles: UserRole[];
  steps: NavigationStep[];
  success_metrics: string[];
  onboarding: boolean;
}

export interface NavigationContext {
  user: IUser;
  current_path: string;
  session_data: Record<string, any>;
  completed_steps: string[];
  journey_id?: string;
  step_id?: string;
}

export interface NavigationSuggestion {
  type: 'next_step' | 'alternative' | 'shortcut' | 'help';
  title: string;
  description: string;
  path: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimated_time_minutes: number;
}

export interface ProgressState {
  journey_id: string;
  user_id: string;
  current_step: string;
  completed_steps: string[];
  skipped_steps: string[];
  started_at: Date;
  last_activity: Date;
  completion_percentage: number;
  estimated_remaining_time: number;
}

export class NavigationFlowService {
  private static instance: NavigationFlowService;
  private userJourneys: Map<string, UserJourney> = new Map();
  private userProgress: Map<string, ProgressState> = new Map();
  private workflowValidationService: WorkflowValidationService;

  private constructor() {
    this.workflowValidationService = WorkflowValidationService.getInstance();
    this.initializeUserJourneys();
  }

  public static getInstance(): NavigationFlowService {
    if (!NavigationFlowService.instance) {
      NavigationFlowService.instance = new NavigationFlowService();
    }
    return NavigationFlowService.instance;
  }

  private initializeUserJourneys(): void {
    // Super Admin Onboarding Journey
    this.userJourneys.set('super_admin_onboarding', {
      id: 'super_admin_onboarding',
      name: 'Super Admin Onboarding',
      description: 'Complete setup and configuration for super administrators',
      target_roles: ['super_admin'],
      onboarding: true,
      steps: [
        {
          id: 'welcome_dashboard',
          title: 'Welcome to Your Dashboard',
          description:
            'Get familiar with the super admin dashboard and global overview',
          path: '/dashboard',
          icon: 'LayoutDashboard',
          required_permissions: ['VIEW_DASHBOARD'],
          estimated_time_minutes: 5,
          dependencies: [],
          optional: false,
        },
        {
          id: 'system_settings',
          title: 'Configure System Settings',
          description: 'Set up global system configuration and preferences',
          path: '/admin/system-settings',
          icon: 'Settings',
          required_permissions: ['GLOBAL_SETTINGS'],
          estimated_time_minutes: 10,
          dependencies: ['welcome_dashboard'],
          optional: false,
        },
        {
          id: 'create_first_company',
          title: 'Create Your First Company',
          description: 'Set up the first organization in the system',
          path: '/admin/companies/create',
          icon: 'Building',
          required_permissions: ['MANAGE_COMPANIES'],
          estimated_time_minutes: 15,
          dependencies: ['system_settings'],
          optional: false,
        },
        {
          id: 'setup_benchmarks',
          title: 'Configure Benchmarks',
          description: 'Set up industry and internal benchmarks for comparison',
          path: '/benchmarks',
          icon: 'TrendingUp',
          required_permissions: ['MANAGE_BENCHMARKS'],
          estimated_time_minutes: 10,
          dependencies: ['create_first_company'],
          optional: true,
        },
        {
          id: 'review_question_bank',
          title: 'Review Question Bank',
          description: 'Explore and customize the 200+ question repository',
          path: '/question-bank',
          icon: 'HelpCircle',
          required_permissions: ['MANAGE_QUESTION_BANK'],
          estimated_time_minutes: 15,
          dependencies: ['create_first_company'],
          optional: true,
        },
      ],
      success_metrics: [
        'System configured successfully',
        'First company created',
        'Admin understands platform capabilities',
      ],
    });

    // Company Admin Journey
    this.userJourneys.set('company_admin_journey', {
      id: 'company_admin_journey',
      name: 'Company Admin Complete Journey',
      description: 'End-to-end journey from setup to insights and action plans',
      target_roles: ['company_admin'],
      onboarding: false,
      steps: [
        {
          id: 'dashboard_overview',
          title: 'Company Dashboard Overview',
          description: 'Review your company-specific KPIs and metrics',
          path: '/dashboard',
          icon: 'BarChart3',
          required_permissions: ['VIEW_DASHBOARD'],
          estimated_time_minutes: 5,
          dependencies: [],
          optional: false,
        },
        {
          id: 'setup_demographics',
          title: 'Configure Demographics',
          description: 'Set up demographic segmentation for your organization',
          path: '/demographics',
          icon: 'Users',
          required_permissions: ['MANAGE_DEMOGRAPHICS'],
          estimated_time_minutes: 10,
          dependencies: ['dashboard_overview'],
          optional: false,
        },
        {
          id: 'create_survey',
          title: 'Create Your First Survey',
          description:
            'Build a comprehensive climate survey using AI-adapted questions',
          path: '/surveys/create',
          icon: 'FileText',
          required_permissions: ['CREATE_SURVEYS'],
          estimated_time_minutes: 20,
          dependencies: ['setup_demographics'],
          optional: false,
        },
        {
          id: 'send_invitations',
          title: 'Send Survey Invitations',
          description: 'Distribute survey invitations to your target audience',
          path: '/invitations',
          icon: 'Mail',
          required_permissions: ['SEND_INVITATIONS'],
          estimated_time_minutes: 10,
          dependencies: ['create_survey'],
          optional: false,
        },
        {
          id: 'monitor_responses',
          title: 'Monitor Response Collection',
          description: 'Track survey participation and response rates',
          path: '/surveys/responses',
          icon: 'Activity',
          required_permissions: ['VIEW_RESPONSES'],
          estimated_time_minutes: 5,
          dependencies: ['send_invitations'],
          optional: false,
        },
        {
          id: 'review_ai_insights',
          title: 'Review AI-Generated Insights',
          description: 'Analyze AI-powered insights and recommendations',
          path: '/insights',
          icon: 'Brain',
          required_permissions: ['VIEW_AI_INSIGHTS'],
          estimated_time_minutes: 15,
          dependencies: ['monitor_responses'],
          optional: false,
        },
        {
          id: 'create_action_plans',
          title: 'Create Action Plans',
          description: 'Transform insights into actionable improvement plans',
          path: '/action-plans/create',
          icon: 'Target',
          required_permissions: ['CREATE_ACTION_PLANS'],
          estimated_time_minutes: 20,
          dependencies: ['review_ai_insights'],
          optional: false,
        },
        {
          id: 'launch_microclimate',
          title: 'Launch Follow-up Microclimate',
          description: 'Create real-time pulse checks to measure progress',
          path: '/microclimates/create',
          icon: 'Zap',
          required_permissions: ['LAUNCH_MICROCLIMATES'],
          estimated_time_minutes: 10,
          dependencies: ['create_action_plans'],
          optional: true,
        },
        {
          id: 'generate_reports',
          title: 'Generate Comprehensive Reports',
          description: 'Create detailed reports for stakeholders',
          path: '/reports',
          icon: 'FileBarChart',
          required_permissions: ['GENERATE_REPORTS'],
          estimated_time_minutes: 15,
          dependencies: ['review_ai_insights'],
          optional: true,
        },
      ],
      success_metrics: [
        'Survey created and distributed',
        'Minimum response rate achieved',
        'AI insights reviewed',
        'Action plans created',
        'Progress measured',
      ],
    });

    // Department Admin Journey
    this.userJourneys.set('department_admin_journey', {
      id: 'department_admin_journey',
      name: 'Department Admin Journey',
      description:
        'Department-focused workflow for team management and improvement',
      target_roles: ['department_admin'],
      onboarding: false,
      steps: [
        {
          id: 'department_dashboard',
          title: 'Department Dashboard',
          description: 'Review department-specific metrics and team health',
          path: '/dashboard',
          icon: 'Users',
          required_permissions: ['VIEW_DASHBOARD'],
          estimated_time_minutes: 5,
          dependencies: [],
          optional: false,
        },
        {
          id: 'team_survey',
          title: 'Create Department Survey',
          description: 'Create targeted surveys for your department',
          path: '/surveys/create',
          icon: 'FileText',
          required_permissions: ['CREATE_SURVEYS'],
          estimated_time_minutes: 15,
          dependencies: ['department_dashboard'],
          optional: false,
        },
        {
          id: 'microclimate_session',
          title: 'Launch Team Microclimate',
          description: 'Run real-time feedback sessions with your team',
          path: '/microclimates/create',
          icon: 'Zap',
          required_permissions: ['LAUNCH_MICROCLIMATES'],
          estimated_time_minutes: 10,
          dependencies: ['department_dashboard'],
          optional: false,
        },
        {
          id: 'monitor_live_results',
          title: 'Monitor Live Results',
          description: 'Watch real-time responses and engagement',
          path: '/microclimates/live',
          icon: 'Activity',
          required_permissions: ['VIEW_MICROCLIMATE_RESULTS'],
          estimated_time_minutes: 15,
          dependencies: ['microclimate_session'],
          optional: false,
        },
        {
          id: 'department_action_plans',
          title: 'Create Department Action Plans',
          description: 'Develop improvement plans for your team',
          path: '/action-plans/create',
          icon: 'Target',
          required_permissions: ['CREATE_ACTION_PLANS'],
          estimated_time_minutes: 20,
          dependencies: ['monitor_live_results'],
          optional: false,
        },
        {
          id: 'track_team_progress',
          title: 'Track Team Progress',
          description:
            'Monitor action plan implementation and team improvement',
          path: '/action-plans/progress',
          icon: 'TrendingUp',
          required_permissions: ['VIEW_ACTION_PLAN_PROGRESS'],
          estimated_time_minutes: 10,
          dependencies: ['department_action_plans'],
          optional: false,
        },
      ],
      success_metrics: [
        'Department survey completed',
        'Microclimate session conducted',
        'Team action plans created',
        'Progress tracked and measured',
      ],
    });

    // Employee Journey
    this.userJourneys.set('employee_journey', {
      id: 'employee_journey',
      name: 'Employee Participation Journey',
      description: 'Employee experience from survey participation to feedback',
      target_roles: ['employee'],
      onboarding: false,
      steps: [
        {
          id: 'personal_dashboard',
          title: 'Personal Dashboard',
          description:
            'View your personal feedback history and assigned surveys',
          path: '/dashboard',
          icon: 'User',
          required_permissions: ['VIEW_PERSONAL_DASHBOARD'],
          estimated_time_minutes: 3,
          dependencies: [],
          optional: false,
        },
        {
          id: 'complete_survey',
          title: 'Complete Assigned Survey',
          description: 'Participate in surveys with AI-adapted questions',
          path: '/survey/participate',
          icon: 'FileText',
          required_permissions: ['PARTICIPATE_IN_SURVEYS'],
          estimated_time_minutes: 15,
          dependencies: ['personal_dashboard'],
          optional: false,
        },
        {
          id: 'join_microclimate',
          title: 'Join Microclimate Session',
          description: 'Participate in real-time team feedback sessions',
          path: '/microclimates/participate',
          icon: 'Zap',
          required_permissions: ['PARTICIPATE_IN_MICROCLIMATES'],
          estimated_time_minutes: 10,
          dependencies: ['personal_dashboard'],
          optional: true,
        },
        {
          id: 'view_personal_results',
          title: 'View Personal Insights',
          description: 'Review your personal results and recommendations',
          path: '/results/personal',
          icon: 'BarChart3',
          required_permissions: ['VIEW_PERSONAL_RESULTS'],
          estimated_time_minutes: 5,
          dependencies: ['complete_survey'],
          optional: true,
        },
      ],
      success_metrics: [
        'Survey participation completed',
        'Microclimate participation when available',
        'Personal insights reviewed',
      ],
    });

    // Quick Start Journey
    this.userJourneys.set('quick_start', {
      id: 'quick_start',
      name: 'Quick Start Guide',
      description: 'Fast track to get started with essential features',
      target_roles: ['super_admin', 'company_admin', 'department_admin'],
      onboarding: true,
      steps: [
        {
          id: 'platform_overview',
          title: 'Platform Overview',
          description: 'Quick tour of the main features and capabilities',
          path: '/onboarding/overview',
          icon: 'Compass',
          required_permissions: ['VIEW_DASHBOARD'],
          estimated_time_minutes: 5,
          dependencies: [],
          optional: false,
        },
        {
          id: 'first_survey',
          title: 'Create Your First Survey',
          description: 'Quick survey creation using templates',
          path: '/surveys/quick-create',
          icon: 'Zap',
          required_permissions: ['CREATE_SURVEYS'],
          estimated_time_minutes: 10,
          dependencies: ['platform_overview'],
          optional: false,
        },
        {
          id: 'invite_team',
          title: 'Invite Your Team',
          description: 'Send invitations to get started quickly',
          path: '/invitations/quick-send',
          icon: 'UserPlus',
          required_permissions: ['SEND_INVITATIONS'],
          estimated_time_minutes: 5,
          dependencies: ['first_survey'],
          optional: false,
        },
      ],
      success_metrics: [
        'Platform overview completed',
        'First survey created',
        'Team invitations sent',
      ],
    });
  }

  public async getNavigationSuggestions(
    context: NavigationContext
  ): Promise<NavigationSuggestion[]> {
    const suggestions: NavigationSuggestion[] = [];

    // Get user's current journey progress
    const currentProgress = this.getUserProgress(context.user._id.toString());

    // Get available journeys for user role
    const availableJourneys = this.getJourneysForRole(context.user.role);

    // Suggest next steps in current journey
    if (currentProgress && currentProgress.journey_id) {
      const journey = this.userJourneys.get(currentProgress.journey_id);
      if (journey) {
        const nextStep = this.getNextStep(
          journey,
          currentProgress.completed_steps
        );
        if (nextStep && this.canUserAccessStep(context.user, nextStep)) {
          suggestions.push({
            type: 'next_step',
            title: `Continue: ${nextStep.title}`,
            description: nextStep.description,
            path: nextStep.path,
            priority: 'high',
            reason: 'Next step in your current journey',
            estimated_time_minutes: nextStep.estimated_time_minutes,
          });
        }
      }
    }

    // Suggest starting a new journey if none is active
    if (!currentProgress) {
      for (const journey of availableJourneys) {
        if (journey.onboarding && this.shouldSuggestOnboarding(context.user)) {
          const firstStep = journey.steps[0];
          if (this.canUserAccessStep(context.user, firstStep)) {
            suggestions.push({
              type: 'next_step',
              title: `Start: ${journey.name}`,
              description: journey.description,
              path: firstStep.path,
              priority: 'high',
              reason: 'Recommended onboarding journey',
              estimated_time_minutes: firstStep.estimated_time_minutes,
            });
          }
        }
      }
    }

    // Context-aware suggestions based on current path
    const contextSuggestions = this.getContextAwareSuggestions(context);
    suggestions.push(...contextSuggestions);

    // Suggest shortcuts for experienced users
    const shortcuts = this.getShortcutSuggestions(context);
    suggestions.push(...shortcuts);

    // Sort by priority and return top suggestions
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
  }

  private getContextAwareSuggestions(
    context: NavigationContext
  ): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = [];
    const currentPath = context.current_path;

    // Dashboard suggestions
    if (currentPath === '/dashboard') {
      if (hasFeaturePermission(context.user.role, 'CREATE_SURVEYS')) {
        suggestions.push({
          type: 'alternative',
          title: 'Create New Survey',
          description: 'Start measuring your organizational climate',
          path: '/surveys/create',
          priority: 'medium',
          reason: 'Common next action from dashboard',
          estimated_time_minutes: 20,
        });
      }

      if (hasFeaturePermission(context.user.role, 'LAUNCH_MICROCLIMATES')) {
        suggestions.push({
          type: 'alternative',
          title: 'Launch Microclimate',
          description: 'Get instant team feedback',
          path: '/microclimates/create',
          priority: 'medium',
          reason: 'Quick feedback option',
          estimated_time_minutes: 10,
        });
      }
    }

    // Survey creation suggestions
    if (currentPath.startsWith('/surveys/create')) {
      suggestions.push({
        type: 'help',
        title: 'Question Bank Help',
        description: 'Explore 200+ pre-built questions',
        path: '/question-bank',
        priority: 'low',
        reason: 'Helpful resource for survey creation',
        estimated_time_minutes: 5,
      });
    }

    // Survey results suggestions
    if (currentPath.includes('/surveys') && currentPath.includes('/results')) {
      if (hasFeaturePermission(context.user.role, 'CREATE_ACTION_PLANS')) {
        suggestions.push({
          type: 'next_step',
          title: 'Create Action Plans',
          description: 'Turn insights into actionable improvements',
          path: '/action-plans/create',
          priority: 'high',
          reason: 'Natural next step after reviewing results',
          estimated_time_minutes: 20,
        });
      }

      if (hasFeaturePermission(context.user.role, 'EXPORT_REPORTS')) {
        suggestions.push({
          type: 'alternative',
          title: 'Generate Report',
          description: 'Create comprehensive reports for stakeholders',
          path: '/reports/create',
          priority: 'medium',
          reason: 'Share results with stakeholders',
          estimated_time_minutes: 15,
        });
      }
    }

    return suggestions;
  }

  private getShortcutSuggestions(
    context: NavigationContext
  ): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = [];

    // Suggest shortcuts for experienced users (those who have completed journeys)
    const userProgress = this.getUserProgress(context.user._id.toString());
    if (userProgress && userProgress.completed_steps.length > 5) {
      // Quick survey creation shortcut
      if (hasFeaturePermission(context.user.role, 'CREATE_SURVEYS')) {
        suggestions.push({
          type: 'shortcut',
          title: 'Quick Survey',
          description: 'Create survey from template in 2 minutes',
          path: '/surveys/quick-create',
          priority: 'low',
          reason: 'Fast option for experienced users',
          estimated_time_minutes: 2,
        });
      }

      // Quick microclimate shortcut
      if (hasFeaturePermission(context.user.role, 'LAUNCH_MICROCLIMATES')) {
        suggestions.push({
          type: 'shortcut',
          title: 'Instant Pulse Check',
          description: 'Launch microclimate with one click',
          path: '/microclimates/instant',
          priority: 'low',
          reason: 'Quick feedback for experienced users',
          estimated_time_minutes: 1,
        });
      }
    }

    return suggestions;
  }

  public async startUserJourney(
    user: IUser,
    journeyId: string
  ): Promise<ProgressState> {
    const journey = this.userJourneys.get(journeyId);

    if (!journey) {
      throw new Error(`Journey not found: ${journeyId}`);
    }

    if (!journey.target_roles.includes(user.role)) {
      throw new Error(
        `Journey ${journeyId} is not available for role ${user.role}`
      );
    }

    // Check if user can access the first step
    const firstStep = journey.steps[0];
    if (!this.canUserAccessStep(user, firstStep)) {
      throw new Error(
        `Cannot access first step of journey: ${firstStep.title}`
      );
    }

    const progress: ProgressState = {
      journey_id: journeyId,
      user_id: user._id.toString(),
      current_step: firstStep.id,
      completed_steps: [],
      skipped_steps: [],
      started_at: new Date(),
      last_activity: new Date(),
      completion_percentage: 0,
      estimated_remaining_time: journey.steps.reduce(
        (sum, step) => sum + step.estimated_time_minutes,
        0
      ),
    };

    this.userProgress.set(user._id.toString(), progress);
    return progress;
  }

  public async updateUserProgress(
    userId: string,
    stepId: string,
    action: 'completed' | 'skipped'
  ): Promise<ProgressState> {
    const progress = this.userProgress.get(userId);

    if (!progress) {
      throw new Error('No active journey found for user');
    }

    const journey = this.userJourneys.get(progress.journey_id);
    if (!journey) {
      throw new Error('Journey not found');
    }

    if (action === 'completed') {
      progress.completed_steps.push(stepId);
    } else {
      progress.skipped_steps.push(stepId);
    }

    progress.last_activity = new Date();

    // Calculate completion percentage
    const totalSteps = journey.steps.length;
    const completedSteps = progress.completed_steps.length;
    progress.completion_percentage = (completedSteps / totalSteps) * 100;

    // Calculate remaining time
    const remainingSteps = journey.steps.filter(
      (step) =>
        !progress.completed_steps.includes(step.id) &&
        !progress.skipped_steps.includes(step.id)
    );
    progress.estimated_remaining_time = remainingSteps.reduce(
      (sum, step) => sum + step.estimated_time_minutes,
      0
    );

    // Update current step
    const nextStep = this.getNextStep(journey, progress.completed_steps);
    if (nextStep) {
      progress.current_step = nextStep.id;
    }

    this.userProgress.set(userId, progress);
    return progress;
  }

  public getUserProgress(userId: string): ProgressState | undefined {
    return this.userProgress.get(userId);
  }

  public getJourneysForRole(role: UserRole): UserJourney[] {
    return Array.from(this.userJourneys.values()).filter((journey) =>
      journey.target_roles.includes(role)
    );
  }

  public getJourney(journeyId: string): UserJourney | undefined {
    return this.userJourneys.get(journeyId);
  }

  private getNextStep(
    journey: UserJourney,
    completedSteps: string[]
  ): NavigationStep | undefined {
    return journey.steps.find(
      (step) =>
        !completedSteps.includes(step.id) &&
        step.dependencies.every((dep) => completedSteps.includes(dep))
    );
  }

  private canUserAccessStep(user: IUser, step: NavigationStep): boolean {
    // Check role requirement
    if (step.required_role && step.required_role !== user.role) {
      return false;
    }

    // Check permissions
    for (const permission of step.required_permissions) {
      if (!hasFeaturePermission(user.role, permission as any)) {
        return false;
      }
    }

    return true;
  }

  private shouldSuggestOnboarding(user: IUser): boolean {
    // Check if user is new (created within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return user.created_at > sevenDaysAgo;
  }

  // Workflow State Management
  public async getWorkflowState(userId: string): Promise<{
    active_journey?: ProgressState;
    available_journeys: UserJourney[];
    suggestions: NavigationSuggestion[];
    completion_stats: {
      total_journeys: number;
      completed_journeys: number;
      in_progress_journeys: number;
    };
  }> {
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const activeJourney = this.getUserProgress(userId);
    const availableJourneys = this.getJourneysForRole(user.role);

    const context: NavigationContext = {
      user,
      current_path: '/dashboard', // Default path
      session_data: {},
      completed_steps: activeJourney?.completed_steps || [],
      journey_id: activeJourney?.journey_id,
      step_id: activeJourney?.current_step,
    };

    const suggestions = await this.getNavigationSuggestions(context);

    return {
      active_journey: activeJourney,
      available_journeys: availableJourneys,
      suggestions,
      completion_stats: {
        total_journeys: availableJourneys.length,
        completed_journeys: 0, // Would need to track this in persistent storage
        in_progress_journeys: activeJourney ? 1 : 0,
      },
    };
  }
}

export default NavigationFlowService;
