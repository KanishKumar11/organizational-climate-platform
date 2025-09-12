import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { Department } from '@/models/Department';
import { QuestionPool } from '@/models/QuestionPool';

export interface DemographicProfile {
  userId: string;
  companyId: string;
  departmentId: string;
  role: string;
  tenure: string;
  level: 'entry' | 'mid' | 'senior' | 'executive';
  workLocation: 'remote' | 'hybrid' | 'onsite';
  teamSize: number;
  reportingStructure:
    | 'individual_contributor'
    | 'team_lead'
    | 'manager'
    | 'director';
  industryContext: string;
  culturalContext: string;
  customAttributes: Record<string, unknown>;
}

export interface DemographicContext {
  companyProfile: CompanyDemographicProfile;
  departmentProfile: DepartmentDemographicProfile;
  userProfiles: DemographicProfile[];
  aggregatedInsights: DemographicInsights;
}

export interface CompanyDemographicProfile {
  companyId: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  culture: string[];
  values: string[];
  workModel: 'remote' | 'hybrid' | 'onsite' | 'mixed';
  averageTenure: number;
  diversityMetrics: Record<string, unknown>;
  geographicDistribution: Record<string, number>;
}

export interface DepartmentDemographicProfile {
  departmentId: string;
  name: string;
  function: string;
  size: number;
  averageTenure: number;
  skillLevels: Record<string, number>;
  workStyle: string[];
  communicationPreferences: string[];
  collaborationPatterns: Record<string, unknown>;
}

export interface DemographicInsights {
  questionPreferences: Record<string, number>;
  responsePatterns: Record<string, unknown>;
  engagementFactors: string[];
  adaptationOpportunities: string[];
  culturalConsiderations: string[];
}

export interface QuestionAdaptationContext {
  targetDemographic: DemographicProfile[];
  contextualFactors: {
    timeOfYear: string;
    organizationalChanges: string[];
    recentEvents: string[];
    currentInitiatives: string[];
  };
  adaptationGoals: {
    increaseEngagement: boolean;
    improveClarity: boolean;
    enhanceRelevance: boolean;
    addressCulturalSensitivity: boolean;
  };
  constraints: {
    maxQuestionLength: number;
    requiredTopics: string[];
    avoidedTopics: string[];
    languageLevel: 'simple' | 'standard' | 'advanced';
  };
}

export class DemographicContextAI {
  private static instance: DemographicContextAI;
  private contextCache: Map<string, DemographicContext> = new Map();

  public static getInstance(): DemographicContextAI {
    if (!DemographicContextAI.instance) {
      DemographicContextAI.instance = new DemographicContextAI();
    }
    return DemographicContextAI.instance;
  }

  /**
   * Build comprehensive demographic context for a company/department
   */
  async buildDemographicContext(
    companyId: string,
    departmentId?: string
  ): Promise<DemographicContext> {
    await connectToDatabase();

    const cacheKey = `${companyId}_${departmentId || 'all'}`;
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    try {
      // Build company profile
      const companyProfile = await this.buildCompanyProfile(companyId);

      // Build department profile
      const departmentProfile = departmentId
        ? await this.buildDepartmentProfile(departmentId)
        : null;

      // Get user profiles
      const userProfiles = await this.buildUserProfiles(
        companyId,
        departmentId
      );

      // Generate aggregated insights
      const aggregatedInsights = await this.generateAggregatedInsights(
        companyProfile,
        departmentProfile,
        userProfiles
      );

      const context: DemographicContext = {
        companyProfile,
        departmentProfile: departmentProfile!,
        userProfiles,
        aggregatedInsights,
      };

      // Cache the context
      this.contextCache.set(cacheKey, context);

      return context;
    } catch (error) {
      console.error('Error building demographic context:', error);
      throw new Error('Failed to build demographic context');
    }
  }

  /**
   * Build company demographic profile
   */
  private async buildCompanyProfile(
    companyId: string
  ): Promise<CompanyDemographicProfile> {
    const company = await Company.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Get all users in the company
    const users = await User.find({ company_id: companyId });

    // Calculate company metrics
    const size = this.determineCompanySize(users.length);
    const averageTenure = this.calculateAverageTenure(users);
    const diversityMetrics = this.calculateDiversityMetrics(users);
    const geographicDistribution = this.calculateGeographicDistribution(users);

    return {
      companyId,
      industry: company.industry || 'Unknown',
      size,
      culture: (company as any).culture_values || [],
      values: (company as any).core_values || [],
      workModel: (company as any).work_model || 'mixed',
      averageTenure,
      diversityMetrics,
      geographicDistribution,
    };
  }

  /**
   * Build department demographic profile
   */
  private async buildDepartmentProfile(
    departmentId: string
  ): Promise<DepartmentDemographicProfile> {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Get department users
    const users = await User.find({ department_id: departmentId });

    // Calculate department metrics
    const averageTenure = this.calculateAverageTenure(users);
    const skillLevels = this.calculateSkillLevels(users);
    const workStyle = this.identifyWorkStyle(users);
    const communicationPreferences =
      this.identifyCommunicationPreferences(users);
    const collaborationPatterns = this.analyzeCollaborationPatterns(users);

    return {
      departmentId,
      name: department.name,
      function: (department as any).function || 'General',
      size: users.length,
      averageTenure,
      skillLevels,
      workStyle,
      communicationPreferences,
      collaborationPatterns,
    };
  }

  /**
   * Build user demographic profiles
   */
  private async buildUserProfiles(
    companyId: string,
    departmentId?: string
  ): Promise<DemographicProfile[]> {
    const query: any = { company_id: companyId };
    if (departmentId) {
      query.department_id = departmentId;
    }

    const users = await User.find(query);
    const company = await Company.findById(companyId);

    return users.map((user) => ({
      userId: user._id.toString(),
      companyId,
      departmentId: user.department_id,
      role: user.role,
      tenure: this.calculateTenure(user.created_at),
      level: this.determineLevel(
        user.role,
        (user as any).metadata?.experience_years
      ),
      workLocation: (user as any).metadata?.work_location || 'onsite',
      teamSize: (user as any).metadata?.team_size || 1,
      reportingStructure: this.determineReportingStructure(user.role),
      industryContext: company?.industry || 'Unknown',
      culturalContext: this.determineCulturalContext(user, company),
      customAttributes: (user as any).metadata || {},
    }));
  }

  /**
   * Generate aggregated demographic insights
   */
  private async generateAggregatedInsights(
    companyProfile: CompanyDemographicProfile,
    departmentProfile: DepartmentDemographicProfile | null,
    userProfiles: DemographicProfile[]
  ): Promise<DemographicInsights> {
    // Analyze question preferences based on demographics
    const questionPreferences =
      await this.analyzeQuestionPreferences(userProfiles);

    // Identify response patterns
    const responsePatterns = await this.analyzeResponsePatterns(userProfiles);

    // Determine engagement factors
    const engagementFactors = this.identifyEngagementFactors(
      companyProfile,
      departmentProfile,
      userProfiles
    );

    // Find adaptation opportunities
    const adaptationOpportunities =
      this.identifyAdaptationOpportunities(userProfiles);

    // Consider cultural factors
    const culturalConsiderations = this.identifyCulturalConsiderations(
      companyProfile,
      userProfiles
    );

    return {
      questionPreferences,
      responsePatterns,
      engagementFactors,
      adaptationOpportunities,
      culturalConsiderations,
    };
  }

  /**
   * Generate question adaptation recommendations based on demographic context
   */
  async generateAdaptationRecommendations(
    questionId: string,
    context: DemographicContext,
    adaptationContext: QuestionAdaptationContext
  ): Promise<{
    recommendations: string[];
    adaptedVersions: Array<{
      text: string;
      reasoning: string;
      targetDemographic: string;
      confidence: number;
    }>;
    riskFactors: string[];
  }> {
    await connectToDatabase();

    try {
      // Get the original question
      const question = await (QuestionPool as any).findOne({ id: questionId });
      if (!question) {
        throw new Error('Question not found');
      }

      const recommendations: string[] = [];
      const adaptedVersions: Array<{
        text: string;
        reasoning: string;
        targetDemographic: string;
        confidence: number;
      }> = [];
      const riskFactors: string[] = [];

      // Analyze demographic composition
      const demographicAnalysis = this.analyzeDemographicComposition(
        adaptationContext.targetDemographic
      );

      // Generate language adaptations
      if (demographicAnalysis.needsSimplification) {
        const simplifiedVersion = this.simplifyQuestionLanguage(
          question.originalText
        );
        adaptedVersions.push({
          text: simplifiedVersion,
          reasoning: 'Simplified language for diverse experience levels',
          targetDemographic: 'Mixed experience levels',
          confidence: 85,
        });
        recommendations.push(
          'Consider simplified language version for broader accessibility'
        );
      }

      // Generate role-specific adaptations
      const roleGroups = this.groupByRole(adaptationContext.targetDemographic);
      for (const [role, profiles] of Object.entries(roleGroups)) {
        if (profiles.length > 3) {
          // Only adapt for significant groups
          const roleAdaptation = this.adaptForRole(
            question.originalText,
            role,
            profiles
          );
          if (roleAdaptation !== question.originalText) {
            adaptedVersions.push({
              text: roleAdaptation,
              reasoning: `Adapted terminology and context for ${role} role`,
              targetDemographic: role,
              confidence: 80,
            });
          }
        }
      }

      // Generate department-specific adaptations
      if (context.departmentProfile) {
        const deptAdaptation = this.adaptForDepartment(
          question.originalText,
          context.departmentProfile
        );
        if (deptAdaptation !== question.originalText) {
          adaptedVersions.push({
            text: deptAdaptation,
            reasoning: `Adapted for ${context.departmentProfile.name} department context`,
            targetDemographic: context.departmentProfile.name,
            confidence: 75,
          });
        }
      }

      // Generate cultural adaptations
      const culturalAdaptations = this.generateCulturalAdaptations(
        question.originalText,
        context.aggregatedInsights.culturalConsiderations
      );
      adaptedVersions.push(...culturalAdaptations);

      // Identify risk factors
      riskFactors.push(
        ...this.identifyAdaptationRisks(question, adaptationContext)
      );

      // Generate general recommendations
      recommendations.push(
        ...this.generateGeneralRecommendations(
          question,
          context,
          adaptationContext
        )
      );

      return {
        recommendations,
        adaptedVersions,
        riskFactors,
      };
    } catch (error) {
      console.error('Error generating adaptation recommendations:', error);
      throw new Error('Failed to generate adaptation recommendations');
    }
  }

  /**
   * Helper methods for demographic analysis
   */
  private determineCompanySize(
    userCount: number
  ): 'startup' | 'small' | 'medium' | 'large' | 'enterprise' {
    if (userCount < 10) return 'startup';
    if (userCount < 50) return 'small';
    if (userCount < 250) return 'medium';
    if (userCount < 1000) return 'large';
    return 'enterprise';
  }

  private calculateAverageTenure(users: any[]): number {
    if (users.length === 0) return 0;

    const totalTenure = users.reduce((sum, user) => {
      const tenure = this.calculateTenureInMonths(user.created_at);
      return sum + tenure;
    }, 0);

    return totalTenure / users.length;
  }

  private calculateTenure(createdAt: Date): string {
    const months = this.calculateTenureInMonths(createdAt);

    if (months < 6) return 'new';
    if (months < 12) return 'junior';
    if (months < 36) return 'experienced';
    return 'veteran';
  }

  private calculateTenureInMonths(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  private determineLevel(
    role: string,
    experienceYears?: number
  ): 'entry' | 'mid' | 'senior' | 'executive' {
    const roleLevel = role.toLowerCase();

    if (
      roleLevel.includes('executive') ||
      roleLevel.includes('director') ||
      roleLevel.includes('vp')
    ) {
      return 'executive';
    }
    if (
      roleLevel.includes('senior') ||
      roleLevel.includes('lead') ||
      (experienceYears && experienceYears > 5)
    ) {
      return 'senior';
    }
    if (
      roleLevel.includes('junior') ||
      (experienceYears && experienceYears < 2)
    ) {
      return 'entry';
    }
    return 'mid';
  }

  private determineReportingStructure(
    role: string
  ): 'individual_contributor' | 'team_lead' | 'manager' | 'director' {
    const roleLevel = role.toLowerCase();

    if (roleLevel.includes('director') || roleLevel.includes('vp'))
      return 'director';
    if (roleLevel.includes('manager')) return 'manager';
    if (roleLevel.includes('lead') || roleLevel.includes('senior'))
      return 'team_lead';
    return 'individual_contributor';
  }

  private determineCulturalContext(user: any, company: any): string {
    // Simple cultural context determination
    const location =
      user.metadata?.location || company?.headquarters || 'Unknown';
    const workStyle = user.metadata?.work_style || 'collaborative';
    return `${location}_${workStyle}`;
  }

  private calculateDiversityMetrics(users: any[]): Record<string, any> {
    // Calculate basic diversity metrics
    const roleDistribution = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const tenureDistribution = users.reduce((acc, user) => {
      const tenure = this.calculateTenure(user.created_at);
      acc[tenure] = (acc[tenure] || 0) + 1;
      return acc;
    }, {});

    return {
      roleDistribution,
      tenureDistribution,
      totalUsers: users.length,
    };
  }

  private calculateGeographicDistribution(
    users: any[]
  ): Record<string, number> {
    return users.reduce((acc, user) => {
      const location = user.metadata?.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateSkillLevels(users: any[]): Record<string, number> {
    const levels = users.reduce((acc, user) => {
      const level = this.determineLevel(
        user.role,
        user.metadata?.experience_years
      );
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    return levels;
  }

  private identifyWorkStyle(users: any[]): string[] {
    const styles = users.map(
      (user) => user.metadata?.work_style || 'collaborative'
    );
    return [...new Set(styles)];
  }

  private identifyCommunicationPreferences(users: any[]): string[] {
    const preferences = users.map(
      (user) => user.metadata?.communication_preference || 'email'
    );
    return [...new Set(preferences)];
  }

  private analyzeCollaborationPatterns(users: any[]): Record<string, any> {
    // Analyze collaboration patterns based on user metadata
    const teamSizes = users.map((user) => user.metadata?.team_size || 1);
    const avgTeamSize =
      teamSizes.reduce((sum, size) => sum + size, 0) / teamSizes.length;

    return {
      averageTeamSize: avgTeamSize,
      collaborationStyle: avgTeamSize > 5 ? 'large_team' : 'small_team',
    };
  }

  private async analyzeQuestionPreferences(
    _profiles: DemographicProfile[]
  ): Promise<Record<string, number>> {
    // Analyze which question types work best for different demographics
    // This would be based on historical effectiveness data
    return {
      likert: 85,
      multiple_choice: 75,
      open_ended: 60,
      ranking: 70,
    };
  }

  private async analyzeResponsePatterns(
    _profiles: DemographicProfile[]
  ): Promise<Record<string, unknown>> {
    // Analyze response patterns based on demographics
    return {
      averageResponseTime: 120, // seconds
      completionRate: 85,
      preferredQuestionLength: 'medium',
    };
  }

  private identifyEngagementFactors(
    companyProfile: CompanyDemographicProfile,
    departmentProfile: DepartmentDemographicProfile | null,
    _userProfiles: DemographicProfile[]
  ): string[] {
    const factors: string[] = [];

    // Company-level factors
    if (companyProfile.size === 'startup') {
      factors.push('fast-paced environment', 'innovation focus');
    }
    if (companyProfile.workModel === 'remote') {
      factors.push('remote work challenges', 'digital communication');
    }

    // Department-level factors
    if (departmentProfile) {
      if (departmentProfile.function === 'Engineering') {
        factors.push('technical challenges', 'code quality');
      }
      if (departmentProfile.function === 'Sales') {
        factors.push('target achievement', 'client relationships');
      }
    }

    return factors;
  }

  private identifyAdaptationOpportunities(
    profiles: DemographicProfile[]
  ): string[] {
    const opportunities: string[] = [];

    // Analyze profile diversity
    const roleVariety = new Set(profiles.map((p) => p.role)).size;
    const tenureVariety = new Set(profiles.map((p) => p.tenure)).size;

    if (roleVariety > 3) {
      opportunities.push('Role-specific question variations');
    }
    if (tenureVariety > 2) {
      opportunities.push('Experience-level adaptations');
    }

    return opportunities;
  }

  private identifyCulturalConsiderations(
    companyProfile: CompanyDemographicProfile,
    _profiles: DemographicProfile[]
  ): string[] {
    const considerations: string[] = [];

    // Industry-specific considerations
    if (companyProfile.industry === 'Healthcare') {
      considerations.push('Patient care focus', 'Regulatory compliance');
    }
    if (companyProfile.industry === 'Technology') {
      considerations.push('Innovation culture', 'Technical excellence');
    }

    // Work model considerations
    if (companyProfile.workModel === 'remote') {
      considerations.push('Remote work dynamics', 'Digital collaboration');
    }

    return considerations;
  }

  private analyzeDemographicComposition(profiles: DemographicProfile[]): {
    needsSimplification: boolean;
    dominantRoles: string[];
    experienceLevels: Record<string, number>;
  } {
    const experienceLevels = profiles.reduce(
      (acc, profile) => {
        acc[profile.level] = (acc[profile.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const needsSimplification =
      (experienceLevels.entry || 0) > profiles.length * 0.3;

    const roleCounts = profiles.reduce(
      (acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const dominantRoles = Object.entries(roleCounts)
      .filter(([_, count]) => count > profiles.length * 0.2)
      .map(([role, _]) => role);

    return {
      needsSimplification,
      dominantRoles,
      experienceLevels,
    };
  }

  private groupByRole(
    profiles: DemographicProfile[]
  ): Record<string, DemographicProfile[]> {
    return profiles.reduce(
      (groups, profile) => {
        if (!groups[profile.role]) groups[profile.role] = [];
        groups[profile.role].push(profile);
        return groups;
      },
      {} as Record<string, DemographicProfile[]>
    );
  }

  private simplifyQuestionLanguage(text: string): string {
    // Simple language simplification
    return text
      .replace(/utilize/g, 'use')
      .replace(/demonstrate/g, 'show')
      .replace(/facilitate/g, 'help')
      .replace(/implement/g, 'put in place')
      .replace(/collaborate/g, 'work together');
  }

  private adaptForRole(
    text: string,
    role: string,
    _profiles: DemographicProfile[]
  ): string {
    // Role-specific adaptations
    const roleAdaptations: Record<string, Record<string, string>> = {
      'Software Engineer': {
        team: 'development team',
        project: 'sprint',
        work: 'coding work',
      },
      'Sales Representative': {
        team: 'sales team',
        project: 'sales campaign',
        work: 'client work',
      },
      'Marketing Manager': {
        team: 'marketing team',
        project: 'campaign',
        work: 'marketing work',
      },
    };

    const adaptations = roleAdaptations[role];
    if (!adaptations) return text;

    let adaptedText = text;
    Object.entries(adaptations).forEach(([generic, specific]) => {
      adaptedText = adaptedText.replace(new RegExp(generic, 'gi'), specific);
    });

    return adaptedText;
  }

  private adaptForDepartment(
    text: string,
    department: DepartmentDemographicProfile
  ): string {
    // Department-specific adaptations
    const deptAdaptations: Record<string, Record<string, string>> = {
      Engineering: {
        quality: 'code quality',
        process: 'development process',
        collaboration: 'technical collaboration',
      },
      Sales: {
        performance: 'sales performance',
        goals: 'sales targets',
        success: 'deal closure',
      },
    };

    const adaptations = deptAdaptations[department.function];
    if (!adaptations) return text;

    let adaptedText = text;
    Object.entries(adaptations).forEach(([generic, specific]) => {
      adaptedText = adaptedText.replace(new RegExp(generic, 'gi'), specific);
    });

    return adaptedText;
  }

  private generateCulturalAdaptations(
    text: string,
    culturalConsiderations: string[]
  ): Array<{
    text: string;
    reasoning: string;
    targetDemographic: string;
    confidence: number;
  }> {
    const adaptations: Array<{
      text: string;
      reasoning: string;
      targetDemographic: string;
      confidence: number;
    }> = [];

    // Generate adaptations based on cultural considerations
    culturalConsiderations.forEach((consideration) => {
      if (consideration.includes('Remote work')) {
        const remoteAdaptation = text
          .replace(/in-person/g, 'virtual')
          .replace(/office/g, 'workspace');
        if (remoteAdaptation !== text) {
          adaptations.push({
            text: remoteAdaptation,
            reasoning: 'Adapted for remote work context',
            targetDemographic: 'Remote workers',
            confidence: 70,
          });
        }
      }
    });

    return adaptations;
  }

  private identifyAdaptationRisks(
    question: any,
    context: QuestionAdaptationContext
  ): string[] {
    const risks: string[] = [];

    // Check for potential risks
    if (context.targetDemographic.length < 5) {
      risks.push('Small sample size may not represent broader population');
    }

    if (
      question.originalText.length > 100 &&
      context.constraints.maxQuestionLength < 80
    ) {
      risks.push('Question may be too long for target audience');
    }

    return risks;
  }

  private generateGeneralRecommendations(
    question: any,
    context: DemographicContext,
    adaptationContext: QuestionAdaptationContext
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations based on context
    if (context.userProfiles.length > 50) {
      recommendations.push('Consider A/B testing different question versions');
    }

    if (context.aggregatedInsights.engagementFactors.length > 3) {
      recommendations.push(
        'Leverage identified engagement factors in question design'
      );
    }

    return recommendations;
  }

  /**
   * Clear context cache
   */
  public clearCache(): void {
    this.contextCache.clear();
  }
}

export const demographicContextAI = DemographicContextAI.getInstance();
