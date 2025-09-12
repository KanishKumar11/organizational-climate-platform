/**
 * Onboarding and Help System
 * Provides guided onboarding and contextual help for users
 */

import { IUser } from '../models/User';
import { UserRole } from '../types/user';
import NavigationFlowService from './navigation-flow';

export interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target_element?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action_required: boolean;
  action_text?: string;
  action_path?: string;
  skip_allowed: boolean;
  completion_criteria?: string[];
}

export interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  target_roles: UserRole[];
  trigger_conditions: string[];
  steps: OnboardingStep[];
  auto_start: boolean;
  repeatable: boolean;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  target_roles: UserRole[];
  related_features: string[];
  last_updated: Date;
  view_count: number;
  helpful_votes: number;
  total_votes: number;
}

export interface ContextualHelp {
  path: string;
  element?: string;
  title: string;
  content: string;
  type: 'tooltip' | 'popover' | 'modal' | 'inline';
  trigger: 'hover' | 'click' | 'focus' | 'auto';
  priority: 'high' | 'medium' | 'low';
}

export interface UserOnboardingState {
  user_id: string;
  completed_tours: string[];
  skipped_tours: string[];
  current_tour?: string;
  current_step?: string;
  onboarding_completed: boolean;
  help_preferences: {
    show_tooltips: boolean;
    show_contextual_help: boolean;
    auto_start_tours: boolean;
    preferred_help_format: 'text' | 'video' | 'interactive';
  };
  last_help_interaction: Date;
}

export class OnboardingSystem {
  private static instance: OnboardingSystem;
  private navigationFlowService: NavigationFlowService;
  private onboardingTours: Map<string, OnboardingTour> = new Map();
  private helpArticles: Map<string, HelpArticle> = new Map();
  private contextualHelp: Map<string, ContextualHelp[]> = new Map();
  private userStates: Map<string, UserOnboardingState> = new Map();

  private constructor() {
    this.navigationFlowService = NavigationFlowService.getInstance();
    this.initializeOnboardingTours();
    this.initializeHelpArticles();
    this.initializeContextualHelp();
  }

  public static getInstance(): OnboardingSystem {
    if (!OnboardingSystem.instance) {
      OnboardingSystem.instance = new OnboardingSystem();
    }
    return OnboardingSystem.instance;
  }

  private initializeOnboardingTours(): void {
    // Super Admin First Login Tour
    this.onboardingTours.set('super_admin_first_login', {
      id: 'super_admin_first_login',
      name: 'Super Admin Welcome Tour',
      description:
        "Welcome to the Organizational Climate Platform! Let's get you started.",
      target_roles: ['super_admin'],
      trigger_conditions: ['first_login', 'role_assigned'],
      auto_start: true,
      repeatable: false,
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to Your Platform!',
          content:
            'As a Super Admin, you have full control over the entire platform. You can manage multiple organizations, configure global settings, and oversee all operations.',
          position: 'center',
          action_required: false,
          skip_allowed: false,
        },
        {
          id: 'dashboard_overview',
          title: 'Your Global Dashboard',
          content:
            'This dashboard shows you metrics across all organizations. You can see system health, user activity, and global KPIs at a glance.',
          target_element: '[data-tour="dashboard-overview"]',
          position: 'bottom',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'system_settings',
          title: 'System Configuration',
          content:
            'Click here to access global system settings. You can configure security, integrations, and platform-wide preferences.',
          target_element: '[data-tour="system-settings"]',
          position: 'left',
          action_required: true,
          action_text: 'Open Settings',
          action_path: '/admin/system-settings',
          skip_allowed: true,
        },
        {
          id: 'company_management',
          title: 'Manage Organizations',
          content:
            'Create and manage organizations here. Each organization can have its own admins, departments, and settings.',
          target_element: '[data-tour="company-management"]',
          position: 'right',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'question_bank',
          title: 'Question Repository',
          content:
            'Explore our 200+ question bank. These questions are AI-adapted based on organizational context and demographics.',
          target_element: '[data-tour="question-bank"]',
          position: 'bottom',
          action_required: false,
          skip_allowed: true,
        },
      ],
    });

    // Company Admin Onboarding Tour
    this.onboardingTours.set('company_admin_onboarding', {
      id: 'company_admin_onboarding',
      name: 'Company Admin Onboarding',
      description:
        'Learn how to measure and improve your organizational climate',
      target_roles: ['company_admin'],
      trigger_conditions: ['first_login', 'role_assigned'],
      auto_start: true,
      repeatable: false,
      steps: [
        {
          id: 'welcome',
          title: "Welcome to Your Organization's Climate Platform!",
          content:
            "You're now ready to start measuring and improving your organizational climate. Let's walk through the key features.",
          position: 'center',
          action_required: false,
          skip_allowed: false,
        },
        {
          id: 'dashboard_tour',
          title: 'Your Company Dashboard',
          content:
            "This dashboard shows your organization's key metrics, recent surveys, and AI-generated insights.",
          target_element: '[data-tour="company-dashboard"]',
          position: 'bottom',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'create_survey_intro',
          title: 'Create Your First Survey',
          content:
            "Click here to create comprehensive climate surveys. Our AI will adapt questions based on your organization's context.",
          target_element: '[data-tour="create-survey-button"]',
          position: 'bottom',
          action_required: true,
          action_text: 'Create Survey',
          action_path: '/surveys/create',
          skip_allowed: true,
        },
        {
          id: 'microclimate_intro',
          title: 'Real-time Pulse Checks',
          content:
            'Launch microclimates for instant team feedback. Perfect for measuring sentiment after meetings or changes.',
          target_element: '[data-tour="microclimate-button"]',
          position: 'left',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'ai_insights_intro',
          title: 'AI-Powered Insights',
          content:
            "Our AI analyzes responses and provides actionable recommendations. You'll find insights here after collecting data.",
          target_element: '[data-tour="ai-insights"]',
          position: 'right',
          action_required: false,
          skip_allowed: true,
        },
      ],
    });

    // Survey Builder Tour
    this.onboardingTours.set('survey_builder_tour', {
      id: 'survey_builder_tour',
      name: 'Survey Builder Guide',
      description:
        'Learn how to create effective surveys with AI-adapted questions',
      target_roles: ['super_admin', 'company_admin', 'department_admin'],
      trigger_conditions: ['first_survey_creation'],
      auto_start: true,
      repeatable: true,
      steps: [
        {
          id: 'builder_overview',
          title: 'Survey Builder Overview',
          content:
            'This is where you create comprehensive climate surveys. You can use templates, add custom questions, or let AI suggest questions.',
          position: 'center',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'question_types',
          title: 'Question Types',
          content:
            'Choose from Likert scales, multiple choice, rankings, and open-ended questions. Each type provides different insights.',
          target_element: '[data-tour="question-types"]',
          position: 'right',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'ai_suggestions',
          title: 'AI Question Suggestions',
          content:
            "Click here to get AI-suggested questions based on your organization's demographics and previous surveys.",
          target_element: '[data-tour="ai-suggestions"]',
          position: 'left',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'demographics_setup',
          title: 'Demographic Targeting',
          content:
            'Set up demographic filters to segment responses by department, role, tenure, and custom attributes.',
          target_element: '[data-tour="demographics"]',
          position: 'bottom',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'preview_test',
          title: 'Preview and Test',
          content:
            'Always preview your survey before sending. You can test the flow and see how questions adapt.',
          target_element: '[data-tour="preview-button"]',
          position: 'top',
          action_required: true,
          action_text: 'Preview Survey',
          skip_allowed: true,
        },
      ],
    });

    // Microclimate Tour
    this.onboardingTours.set('microclimate_tour', {
      id: 'microclimate_tour',
      name: 'Microclimate Guide',
      description: 'Learn how to run effective real-time feedback sessions',
      target_roles: ['company_admin', 'department_admin'],
      trigger_conditions: ['first_microclimate_launch'],
      auto_start: true,
      repeatable: true,
      steps: [
        {
          id: 'microclimate_intro',
          title: 'What are Microclimates?',
          content:
            'Microclimates are real-time feedback sessions that capture team sentiment instantly. Perfect for post-meeting feedback or pulse checks.',
          position: 'center',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'quick_setup',
          title: 'Quick Setup',
          content:
            'Choose a template or create custom questions. Microclimates are designed to be launched quickly when you need immediate feedback.',
          target_element: '[data-tour="microclimate-setup"]',
          position: 'bottom',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'live_results',
          title: 'Live Results',
          content:
            "Watch responses come in real-time with animated visualizations. You'll see word clouds, sentiment analysis, and participation rates.",
          target_element: '[data-tour="live-results"]',
          position: 'left',
          action_required: false,
          skip_allowed: true,
        },
        {
          id: 'instant_insights',
          title: 'Instant AI Insights',
          content:
            "Our AI provides immediate insights as responses come in. You'll get alerts for concerning patterns or positive trends.",
          target_element: '[data-tour="instant-insights"]',
          position: 'right',
          action_required: false,
          skip_allowed: true,
        },
      ],
    });
  }

  private initializeHelpArticles(): void {
    this.helpArticles.set('getting-started', {
      id: 'getting-started',
      title: 'Getting Started with Organizational Climate Platform',
      content: `
# Getting Started Guide

Welcome to the Organizational Climate Platform! This guide will help you understand the key concepts and get you up and running quickly.

## Key Concepts

### Surveys
Comprehensive questionnaires that measure organizational climate and culture. Our AI adapts questions based on your organization's context.

### Microclimates
Real-time feedback sessions for instant pulse checks. Perfect for measuring sentiment after meetings or changes.

### AI Insights
Our AI analyzes all responses and provides actionable recommendations, risk alerts, and trend analysis.

### Action Plans
Convert insights into concrete improvement plans with tracking and accountability features.

## Quick Start Steps

1. **Set up your organization** - Configure departments and user roles
2. **Create your first survey** - Use templates or build custom surveys
3. **Invite your team** - Send invitations with optimized timing
4. **Review AI insights** - Analyze results and recommendations
5. **Create action plans** - Turn insights into improvements
6. **Measure progress** - Use follow-up surveys and microclimates

## Need Help?

- Use the search function to find specific topics
- Check contextual help tooltips throughout the platform
- Contact support for personalized assistance
      `,
      category: 'Getting Started',
      tags: ['onboarding', 'basics', 'overview'],
      target_roles: [
        'super_admin',
        'company_admin',
        'department_admin',
        'employee',
      ],
      related_features: [
        'surveys',
        'microclimates',
        'insights',
        'action-plans',
      ],
      last_updated: new Date(),
      view_count: 0,
      helpful_votes: 0,
      total_votes: 0,
    });

    this.helpArticles.set('survey-best-practices', {
      id: 'survey-best-practices',
      title: 'Survey Best Practices',
      content: `
# Survey Best Practices

Creating effective surveys is key to getting actionable insights. Here are our recommended best practices.

## Survey Design

### Question Selection
- Use our AI-suggested questions for optimal results
- Mix question types: Likert scales, multiple choice, and open-ended
- Keep surveys focused - aim for 15-25 questions
- Use conditional logic to personalize the experience

### Timing and Frequency
- Annual comprehensive surveys for deep insights
- Quarterly pulse surveys for trend tracking
- Post-event microclimates for immediate feedback
- Avoid survey fatigue - space surveys appropriately

## Demographic Segmentation

### Essential Demographics
- Department/Team
- Role/Level
- Tenure
- Location (if applicable)

### Custom Attributes
- Add organization-specific demographics
- Use for targeted analysis and action planning
- Keep demographic questions optional to encourage participation

## Invitation Strategy

### Timing Optimization
- Use our AI-optimized send times
- Avoid busy periods (Monday mornings, Friday afternoons)
- Consider time zones for distributed teams
- Send reminders strategically

### Communication
- Explain the purpose and importance
- Guarantee anonymity and confidentiality
- Share how results will be used
- Provide estimated completion time

## Response Collection

### Participation Rates
- Aim for 70%+ response rate for reliable insights
- Monitor participation by demographic
- Follow up with non-respondents appropriately
- Consider incentives for participation

### Data Quality
- Use required questions sparingly
- Provide "Not Applicable" options
- Monitor for response patterns indicating disengagement
- Review open-ended responses for quality

## Analysis and Action

### Review AI Insights
- Focus on high-priority recommendations
- Look for patterns across demographics
- Compare to benchmarks and previous surveys
- Identify both strengths and improvement areas

### Create Action Plans
- Address critical issues first
- Involve relevant stakeholders in planning
- Set measurable goals and timelines
- Communicate plans back to participants

### Follow-up
- Use microclimates to measure progress
- Conduct follow-up surveys to track improvement
- Share success stories and lessons learned
- Continuously refine your approach
      `,
      category: 'Surveys',
      tags: ['surveys', 'best-practices', 'design', 'analysis'],
      target_roles: ['super_admin', 'company_admin', 'department_admin'],
      related_features: ['surveys', 'demographics', 'invitations', 'insights'],
      last_updated: new Date(),
      view_count: 0,
      helpful_votes: 0,
      total_votes: 0,
    });

    this.helpArticles.set('understanding-ai-insights', {
      id: 'understanding-ai-insights',
      title: 'Understanding AI Insights',
      content: `
# Understanding AI Insights

Our AI engine analyzes survey responses and provides intelligent insights to help you understand and improve your organizational climate.

## Types of Insights

### Pattern Recognition
- Identifies trends across demographics
- Detects correlations between different metrics
- Highlights unexpected findings
- Compares to industry benchmarks

### Risk Alerts
- **Critical**: Immediate attention required
- **High**: Address within 30 days
- **Medium**: Monitor and plan improvements
- **Low**: Consider for future planning

### Recommendations
- Specific, actionable suggestions
- Prioritized by impact and feasibility
- Tailored to your organization's context
- Based on successful interventions from similar organizations

### Predictive Analytics
- Employee turnover risk prediction
- Engagement trend forecasting
- Team performance indicators
- Organizational health scoring

## How AI Adapts Questions

### Demographic Context
- Questions are reformulated based on department terminology
- Industry-specific language is used
- Role-appropriate complexity levels
- Cultural considerations for global organizations

### Historical Learning
- AI learns from your organization's previous surveys
- Adapts based on response patterns
- Improves question effectiveness over time
- Personalizes the survey experience

### Question Combining
- Related questions are merged for efficiency
- Example: Collaboration + Communication = "Team Effectiveness"
- Reduces survey fatigue while maintaining insights
- Creates hybrid questions for deeper understanding

## Interpreting Confidence Scores

### High Confidence (80-100%)
- Strong statistical significance
- Clear patterns in data
- Reliable for immediate action
- Based on sufficient response volume

### Medium Confidence (60-79%)
- Moderate statistical significance
- Some uncertainty in patterns
- Consider additional data collection
- Good for planning and monitoring

### Low Confidence (Below 60%)
- Limited statistical significance
- Uncertain patterns
- Requires more data for validation
- Use for hypothesis generation only

## Acting on Insights

### Prioritization Framework
1. **Critical + High Confidence**: Immediate action required
2. **High Priority + Medium Confidence**: Plan intervention within 30 days
3. **Medium Priority + High Confidence**: Include in quarterly planning
4. **Low Priority + Any Confidence**: Monitor and consider for annual planning

### Validation Steps
- Cross-reference with qualitative feedback
- Discuss with relevant stakeholders
- Consider organizational context
- Validate with follow-up microclimates

### Implementation Tracking
- Create action plans for key insights
- Set measurable goals and timelines
- Monitor progress with KPIs
- Use follow-up surveys to measure impact
      `,
      category: 'AI Insights',
      tags: ['ai', 'insights', 'analysis', 'interpretation'],
      target_roles: ['super_admin', 'company_admin', 'department_admin'],
      related_features: ['insights', 'action-plans', 'analytics'],
      last_updated: new Date(),
      view_count: 0,
      helpful_votes: 0,
      total_votes: 0,
    });
  }

  private initializeContextualHelp(): void {
    // Dashboard contextual help
    this.contextualHelp.set('/dashboard', [
      {
        path: '/dashboard',
        element: '[data-help="kpi-cards"]',
        title: 'KPI Overview',
        content:
          'These cards show your key performance indicators. Click on any card to see detailed trends and comparisons.',
        type: 'tooltip',
        trigger: 'hover',
        priority: 'medium',
      },
      {
        path: '/dashboard',
        element: '[data-help="recent-surveys"]',
        title: 'Recent Surveys',
        content:
          'View your latest surveys and their response rates. Click to see detailed results and AI insights.',
        type: 'tooltip',
        trigger: 'hover',
        priority: 'medium',
      },
      {
        path: '/dashboard',
        element: '[data-help="ai-alerts"]',
        title: 'AI Alerts',
        content:
          'Important insights and recommendations from our AI analysis. Critical alerts require immediate attention.',
        type: 'popover',
        trigger: 'click',
        priority: 'high',
      },
    ]);

    // Survey creation contextual help
    this.contextualHelp.set('/surveys/create', [
      {
        path: '/surveys/create',
        element: '[data-help="question-bank"]',
        title: 'Question Bank',
        content:
          'Access our library of 200+ validated questions. AI will suggest the most relevant questions for your context.',
        type: 'tooltip',
        trigger: 'hover',
        priority: 'high',
      },
      {
        path: '/surveys/create',
        element: '[data-help="ai-suggestions"]',
        title: 'AI Question Suggestions',
        content:
          'Our AI analyzes your organization and suggests optimal questions. These adapt based on demographics and previous surveys.',
        type: 'popover',
        trigger: 'click',
        priority: 'high',
      },
      {
        path: '/surveys/create',
        element: '[data-help="demographic-targeting"]',
        title: 'Demographic Targeting',
        content:
          'Segment your audience for more targeted insights. You can filter by department, role, tenure, and custom attributes.',
        type: 'tooltip',
        trigger: 'hover',
        priority: 'medium',
      },
    ]);

    // Microclimate contextual help
    this.contextualHelp.set('/microclimates/create', [
      {
        path: '/microclimates/create',
        element: '[data-help="quick-templates"]',
        title: 'Quick Templates',
        content:
          'Pre-built templates for common scenarios: post-meeting feedback, change management, team health checks.',
        type: 'tooltip',
        trigger: 'hover',
        priority: 'high',
      },
      {
        path: '/microclimates/create',
        element: '[data-help="real-time-settings"]',
        title: 'Real-time Settings',
        content:
          'Configure how long the microclimate stays open and whether to show live results to participants.',
        type: 'popover',
        trigger: 'click',
        priority: 'medium',
      },
    ]);
  }

  public async getUserOnboardingState(
    userId: string
  ): Promise<UserOnboardingState> {
    let state = this.userStates.get(userId);

    if (!state) {
      state = {
        user_id: userId,
        completed_tours: [],
        skipped_tours: [],
        onboarding_completed: false,
        help_preferences: {
          show_tooltips: true,
          show_contextual_help: true,
          auto_start_tours: true,
          preferred_help_format: 'interactive',
        },
        last_help_interaction: new Date(),
      };
      this.userStates.set(userId, state);
    }

    return state;
  }

  public async getAvailableTours(user: IUser): Promise<OnboardingTour[]> {
    const userState = await this.getUserOnboardingState(user._id.toString());

    return Array.from(this.onboardingTours.values()).filter((tour) => {
      // Check if tour is for user's role
      if (!tour.target_roles.includes(user.role)) {
        return false;
      }

      // Check if tour is already completed and not repeatable
      if (userState.completed_tours.includes(tour.id) && !tour.repeatable) {
        return false;
      }

      // Check if tour is skipped and not repeatable
      if (userState.skipped_tours.includes(tour.id) && !tour.repeatable) {
        return false;
      }

      return true;
    });
  }

  public async shouldStartTour(
    user: IUser,
    triggerCondition: string
  ): Promise<OnboardingTour | null> {
    const availableTours = await this.getAvailableTours(user);
    const userState = await this.getUserOnboardingState(user._id.toString());

    if (!userState.help_preferences.auto_start_tours) {
      return null;
    }

    return (
      availableTours.find(
        (tour) =>
          tour.auto_start && tour.trigger_conditions.includes(triggerCondition)
      ) || null
    );
  }

  public async startTour(userId: string, tourId: string): Promise<void> {
    const userState = await this.getUserOnboardingState(userId);
    userState.current_tour = tourId;
    userState.current_step = this.onboardingTours.get(tourId)?.steps[0]?.id;
    userState.last_help_interaction = new Date();
    this.userStates.set(userId, userState);
  }

  public async completeTourStep(userId: string, stepId: string): Promise<void> {
    const userState = await this.getUserOnboardingState(userId);

    if (!userState.current_tour) {
      return;
    }

    const tour = this.onboardingTours.get(userState.current_tour);
    if (!tour) {
      return;
    }

    const currentStepIndex = tour.steps.findIndex((step) => step.id === stepId);
    const nextStep = tour.steps[currentStepIndex + 1];

    if (nextStep) {
      userState.current_step = nextStep.id;
    } else {
      // Tour completed
      userState.completed_tours.push(userState.current_tour);
      userState.current_tour = undefined;
      userState.current_step = undefined;

      // Check if this completes onboarding
      if (this.isOnboardingComplete(userState)) {
        userState.onboarding_completed = true;
      }
    }

    userState.last_help_interaction = new Date();
    this.userStates.set(userId, userState);
  }

  public async skipTour(userId: string, tourId: string): Promise<void> {
    const userState = await this.getUserOnboardingState(userId);
    userState.skipped_tours.push(tourId);
    userState.current_tour = undefined;
    userState.current_step = undefined;
    userState.last_help_interaction = new Date();
    this.userStates.set(userId, userState);
  }

  public getContextualHelp(path: string): ContextualHelp[] {
    return this.contextualHelp.get(path) || [];
  }

  public searchHelpArticles(query: string, userRole: UserRole): HelpArticle[] {
    const searchTerms = query.toLowerCase().split(' ');

    return Array.from(this.helpArticles.values())
      .filter((article) => {
        // Check if article is for user's role
        if (!article.target_roles.includes(userRole)) {
          return false;
        }

        // Check if query matches title, content, or tags
        const searchableText =
          `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
        return searchTerms.some((term) => searchableText.includes(term));
      })
      .sort((a, b) => {
        // Sort by relevance (simple scoring based on title matches)
        const aScore = searchTerms.reduce(
          (score, term) =>
            score +
            (a.title.toLowerCase().includes(term) ? 2 : 0) +
            (a.tags.some((tag) => tag.toLowerCase().includes(term)) ? 1 : 0),
          0
        );
        const bScore = searchTerms.reduce(
          (score, term) =>
            score +
            (b.title.toLowerCase().includes(term) ? 2 : 0) +
            (b.tags.some((tag) => tag.toLowerCase().includes(term)) ? 1 : 0),
          0
        );
        return bScore - aScore;
      });
  }

  public getHelpArticle(articleId: string): HelpArticle | undefined {
    const article = this.helpArticles.get(articleId);
    if (article) {
      article.view_count++;
    }
    return article;
  }

  public async updateHelpPreferences(
    userId: string,
    preferences: Partial<UserOnboardingState['help_preferences']>
  ): Promise<void> {
    const userState = await this.getUserOnboardingState(userId);
    userState.help_preferences = {
      ...userState.help_preferences,
      ...preferences,
    };
    userState.last_help_interaction = new Date();
    this.userStates.set(userId, userState);
  }

  private isOnboardingComplete(userState: UserOnboardingState): boolean {
    // Define completion criteria based on completed tours
    const requiredTours = [
      'super_admin_first_login',
      'company_admin_onboarding',
    ];
    return requiredTours.some((tourId) =>
      userState.completed_tours.includes(tourId)
    );
  }

  public async getOnboardingProgress(userId: string): Promise<{
    completed_tours: number;
    total_available_tours: number;
    current_tour?: OnboardingTour;
    current_step?: OnboardingStep;
    completion_percentage: number;
    onboarding_completed: boolean;
  }> {
    const User = (await import('../models/User')).default;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const userState = await this.getUserOnboardingState(userId);
    const availableTours = await this.getAvailableTours(user);

    let currentTour: OnboardingTour | undefined;
    let currentStep: OnboardingStep | undefined;

    if (userState.current_tour) {
      currentTour = this.onboardingTours.get(userState.current_tour);
      if (currentTour && userState.current_step) {
        currentStep = currentTour.steps.find(
          (step) => step.id === userState.current_step
        );
      }
    }

    const completionPercentage =
      availableTours.length > 0
        ? (userState.completed_tours.length / availableTours.length) * 100
        : 100;

    return {
      completed_tours: userState.completed_tours.length,
      total_available_tours: availableTours.length,
      current_tour: currentTour,
      current_step: currentStep,
      completion_percentage: completionPercentage,
      onboarding_completed: userState.onboarding_completed,
    };
  }
}

export default OnboardingSystem;
