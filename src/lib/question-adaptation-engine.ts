import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';

export interface AdaptationContext {
  department?: string;
  role?: string;
  industry?: string;
  companySize?: string;
  demographics?: Record<string, any>;
  previousResponses?: Array<{
    questionId: string;
    response: any;
    category: string;
  }>;
  surveyType?: 'general_climate' | 'microclimate' | 'organizational_culture';
}

export interface AdaptedQuestion {
  originalQuestionId?: string;
  text: string;
  type: string;
  category: string;
  subcategory?: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  tags: string[];
  adaptationType: 'original' | 'combined' | 'reformulated' | 'generated';
  adaptationReason: string;
  confidence: number; // 0-1 score for adaptation quality
  sourceQuestions?: string[]; // IDs of questions used for adaptation
}

export interface QuestionCombination {
  primaryQuestionId: string;
  secondaryQuestionId: string;
  combinedText: string;
  combinationReason: string;
  confidence: number;
}

export interface QuestionReformulation {
  originalQuestionId: string;
  originalText: string;
  reformulatedText: string;
  reformulationReason: string;
  contextFactors: string[];
  confidence: number;
}

export class QuestionAdaptationEngine {
  /**
   * Main adaptation method that selects and adapts questions based on context
   */
  static async adaptQuestionsForContext(
    requestedCategories: string[],
    questionsPerCategory: number,
    context: AdaptationContext,
    companyId?: string
  ): Promise<AdaptedQuestion[]> {
    await connectDB();

    const adaptedQuestions: AdaptedQuestion[] = [];

    for (const category of requestedCategories) {
      const categoryQuestions = await this.adaptCategoryQuestions(
        category,
        questionsPerCategory,
        context,
        companyId
      );
      adaptedQuestions.push(...categoryQuestions);
    }

    // Sort by confidence and return best adaptations
    return adaptedQuestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, requestedCategories.length * questionsPerCategory);
  }

  /**
   * Adapt questions for a specific category
   */
  private static async adaptCategoryQuestions(
    category: string,
    count: number,
    context: AdaptationContext,
    companyId?: string
  ): Promise<AdaptedQuestion[]> {
    // Get available questions for the category
    const baseQuery: any = {
      category,
      is_active: true,
    };

    if (companyId) {
      baseQuery.$or = [
        { company_id: companyId },
        { company_id: { $exists: false } },
      ];
    }

    const availableQuestions = await QuestionBank.find(baseQuery)
      .sort({ 'metrics.insight_score': -1, 'metrics.usage_count': -1 })
      .lean();

    if (availableQuestions.length === 0) {
      return [];
    }

    const adaptedQuestions: AdaptedQuestion[] = [];
    const usedQuestionIds = new Set<string>();

    // Strategy 1: Use high-performing original questions
    const originalQuestions = await this.selectOriginalQuestions(
      availableQuestions,
      Math.ceil(count * 0.4), // 40% original
      context,
      usedQuestionIds
    );
    adaptedQuestions.push(...originalQuestions);

    // Strategy 2: Combine related questions
    const combinedQuestions = await this.combineQuestions(
      availableQuestions,
      Math.ceil(count * 0.3), // 30% combined
      context,
      usedQuestionIds
    );
    adaptedQuestions.push(...combinedQuestions);

    // Strategy 3: Reformulate questions for context
    const reformulatedQuestions = await this.reformulateQuestions(
      availableQuestions,
      Math.ceil(count * 0.2), // 20% reformulated
      context,
      usedQuestionIds
    );
    adaptedQuestions.push(...reformulatedQuestions);

    // Strategy 4: Generate new questions if needed
    const remainingCount = count - adaptedQuestions.length;
    if (remainingCount > 0) {
      const generatedQuestions = await this.generateNewQuestions(
        category,
        remainingCount,
        context,
        availableQuestions
      );
      adaptedQuestions.push(...generatedQuestions);
    }

    return adaptedQuestions.slice(0, count);
  }

  /**
   * Select and adapt original high-performing questions
   */
  private static async selectOriginalQuestions(
    availableQuestions: any[],
    count: number,
    context: AdaptationContext,
    usedQuestionIds: Set<string>
  ): Promise<AdaptedQuestion[]> {
    const selected: AdaptedQuestion[] = [];

    for (const question of availableQuestions) {
      if (selected.length >= count) break;
      if (usedQuestionIds.has(question._id.toString())) continue;

      // Calculate relevance score based on context
      const relevanceScore = this.calculateRelevanceScore(question, context);

      if (relevanceScore > 0.6) {
        // Threshold for original questions
        selected.push({
          originalQuestionId: question._id.toString(),
          text: question.text,
          type: question.type,
          category: question.category,
          subcategory: question.subcategory,
          options: question.options,
          scale_min: question.scale_min,
          scale_max: question.scale_max,
          scale_labels: question.scale_labels,
          tags: question.tags,
          adaptationType: 'original',
          adaptationReason: 'High-performing question relevant to context',
          confidence: relevanceScore,
        });

        usedQuestionIds.add(question._id.toString());
      }
    }

    return selected;
  }

  /**
   * Combine related questions into hybrid questions
   */
  private static async combineQuestions(
    availableQuestions: any[],
    count: number,
    context: AdaptationContext,
    usedQuestionIds: Set<string>
  ): Promise<AdaptedQuestion[]> {
    const combinations: AdaptedQuestion[] = [];
    const combinationPairs = this.findCombinationPairs(
      availableQuestions,
      context
    );

    for (const pair of combinationPairs) {
      if (combinations.length >= count) break;

      const primary = availableQuestions.find(
        (q) => q.id.toString() === pair.primaryQuestionId
      );
      const secondary = availableQuestions.find(
        (q) => q.id.toString() === pair.secondaryQuestionId
      );

      if (!primary || !secondary) continue;
      if (
        usedQuestionIds.has(primary._id.toString()) ||
        usedQuestionIds.has(secondary._id.toString())
      )
        continue;

      combinations.push({
        text: pair.combinedText,
        type: primary.type, // Use primary question's type
        category: primary.category,
        subcategory: primary.subcategory,
        scale_min: primary.scale_min,
        scale_max: primary.scale_max,
        scale_labels: primary.scale_labels,
        tags: [...new Set([...primary.tags, ...secondary.tags])],
        adaptationType: 'combined',
        adaptationReason: pair.combinationReason,
        confidence: pair.confidence,
        sourceQuestions: [pair.primaryQuestionId, pair.secondaryQuestionId],
      });

      usedQuestionIds.add(primary._id.toString());
      usedQuestionIds.add(secondary._id.toString());
    }

    return combinations;
  }

  /**
   * Reformulate questions based on demographic context
   */
  private static async reformulateQuestions(
    availableQuestions: any[],
    count: number,
    context: AdaptationContext,
    usedQuestionIds: Set<string>
  ): Promise<AdaptedQuestion[]> {
    const reformulated: AdaptedQuestion[] = [];

    for (const question of availableQuestions) {
      if (reformulated.length >= count) break;
      if (usedQuestionIds.has(question._id.toString())) continue;

      const reformulation = this.reformulateForContext(question, context);

      if (reformulation && reformulation.confidence > 0.5) {
        reformulated.push({
          originalQuestionId: question._id.toString(),
          text: reformulation.reformulatedText,
          type: question.type,
          category: question.category,
          subcategory: question.subcategory,
          options: question.options,
          scale_min: question.scale_min,
          scale_max: question.scale_max,
          scale_labels: question.scale_labels,
          tags: [...question.tags, 'reformulated'],
          adaptationType: 'reformulated',
          adaptationReason: reformulation.reformulationReason,
          confidence: reformulation.confidence,
          sourceQuestions: [question._id.toString()],
        });

        usedQuestionIds.add(question._id.toString());
      }
    }

    return reformulated;
  }

  /**
   * Generate new questions based on patterns and context
   */
  private static async generateNewQuestions(
    category: string,
    count: number,
    context: AdaptationContext,
    referenceQuestions: any[]
  ): Promise<AdaptedQuestion[]> {
    const generated: AdaptedQuestion[] = [];
    const templates = this.getQuestionTemplates(category, context);

    for (let i = 0; i < Math.min(count, templates.length); i++) {
      const template = templates[i];

      generated.push({
        text: template.text,
        type: template.type,
        category,
        subcategory: template.subcategory,
        options: template.options,
        scale_min: template.scale_min,
        scale_max: template.scale_max,
        scale_labels: template.scale_labels,
        tags: [...template.tags, 'ai-generated'],
        adaptationType: 'generated',
        adaptationReason: `Generated for ${context.department || 'general'} context`,
        confidence: template.confidence,
      });
    }

    return generated;
  }

  /**
   * Calculate relevance score for a question given the context
   */
  private static calculateRelevanceScore(
    question: any,
    context: AdaptationContext
  ): number {
    let score = 0.5; // Base score

    // Effectiveness bonus
    score += (question.metrics.insight_score / 10) * 0.3;

    // Usage bonus (but not too much to avoid overused questions)
    const usageScore = Math.min(question.metrics.usage_count / 20, 1);
    score += usageScore * 0.1;

    // Response rate bonus
    score += (question.metrics.response_rate / 100) * 0.1;

    // Context matching
    if (
      context.department &&
      question.tags.includes(context.department.toLowerCase())
    ) {
      score += 0.2;
    }

    if (context.role && question.tags.includes(context.role.toLowerCase())) {
      score += 0.15;
    }

    if (context.industry && question.industry === context.industry) {
      score += 0.1;
    }

    if (context.companySize && question.company_size === context.companySize) {
      score += 0.05;
    }

    return Math.min(score, 1);
  }

  /**
   * Find pairs of questions that can be effectively combined
   */
  private static findCombinationPairs(
    questions: any[],
    context: AdaptationContext
  ): QuestionCombination[] {
    const pairs: QuestionCombination[] = [];
    const combinationRules = this.getCombinationRules();

    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const q1 = questions[i];
        const q2 = questions[j];

        // Check if questions can be combined
        const rule = combinationRules.find((rule) =>
          this.matchesCombinationRule(q1, q2, rule)
        );

        if (rule) {
          const combinedText = this.combineQuestionTexts(
            q1.text,
            q2.text,
            rule
          );

          pairs.push({
            primaryQuestionId: q1._id.toString(),
            secondaryQuestionId: q2._id.toString(),
            combinedText,
            combinationReason: rule.reason,
            confidence: rule.confidence,
          });
        }
      }
    }

    return pairs.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Reformulate a question for specific context
   */
  private static reformulateForContext(
    question: any,
    context: AdaptationContext
  ): QuestionReformulation | null {
    const reformulations = this.getReformulationRules();

    for (const rule of reformulations) {
      if (this.matchesReformulationRule(question, context, rule)) {
        const reformulatedText = this.applyReformulationRule(
          question.text,
          rule,
          context
        );

        return {
          originalQuestionId: question._id.toString(),
          originalText: question.text,
          reformulatedText,
          reformulationReason: rule.reason,
          contextFactors: rule.contextFactors,
          confidence: rule.confidence,
        };
      }
    }

    return null;
  }

  /**
   * Get combination rules for different question types and categories
   */
  private static getCombinationRules() {
    return [
      {
        categories: ['Communication', 'Collaboration'],
        types: ['likert', 'likert'],
        reason: 'Communication and collaboration are closely related',
        confidence: 0.8,
        template: 'How effectively does your team {action1} and {action2}?',
      },
      {
        categories: ['Leadership', 'Management'],
        types: ['likert', 'likert'],
        reason: 'Leadership and management effectiveness often overlap',
        confidence: 0.75,
        template:
          "Rate your leadership team's ability to {action1} and {action2}",
      },
      {
        categories: ['Work Environment', 'Resources'],
        types: ['likert', 'likert'],
        reason: 'Work environment and resources impact each other',
        confidence: 0.7,
        template:
          'How well does your work environment support {aspect1} and {aspect2}?',
      },
    ];
  }

  /**
   * Get reformulation rules for different contexts
   */
  private static getReformulationRules() {
    return [
      {
        contextFactors: ['department'],
        departments: ['Engineering', 'Technology', 'IT'],
        reason: 'Technical terminology for engineering teams',
        confidence: 0.8,
        replacements: {
          team: 'development team',
          project: 'sprint/project',
          feedback: 'code review feedback',
        },
      },
      {
        contextFactors: ['department'],
        departments: ['Sales', 'Marketing'],
        reason: 'Customer-focused terminology for sales/marketing',
        confidence: 0.8,
        replacements: {
          goals: 'targets',
          performance: 'results',
          team: 'sales team',
        },
      },
      {
        contextFactors: ['role'],
        roles: ['Manager', 'Team Lead', 'Supervisor'],
        reason: 'Management-focused perspective',
        confidence: 0.75,
        replacements: {
          your: "your team's",
          'you feel': 'your team feels',
        },
      },
    ];
  }

  /**
   * Get question templates for generating new questions
   */
  private static getQuestionTemplates(
    category: string,
    context: AdaptationContext
  ) {
    const templates: any = {
      Communication: [
        {
          text: `How effectively does information flow within your ${context.department || 'department'}?`,
          type: 'likert',
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Very Ineffectively', max: 'Very Effectively' },
          tags: ['information-flow', 'department-specific'],
          confidence: 0.7,
        },
        {
          text: `Rate the quality of cross-functional communication in your ${context.department || 'area'}`,
          type: 'likert',
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Very Poor', max: 'Excellent' },
          tags: ['cross-functional', 'communication-quality'],
          confidence: 0.75,
        },
      ],
      Collaboration: [
        {
          text: `How well do teams collaborate on ${context.department || 'cross-departmental'} initiatives?`,
          type: 'likert',
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Very Poorly', max: 'Very Well' },
          tags: ['team-collaboration', 'initiatives'],
          confidence: 0.7,
        },
      ],
      Leadership: [
        {
          text: `How effectively does leadership support ${context.department || 'your department'}'s goals?`,
          type: 'likert',
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Very Ineffectively', max: 'Very Effectively' },
          tags: ['leadership-support', 'department-goals'],
          confidence: 0.8,
        },
      ],
    };

    return templates[category] || [];
  }

  // Helper methods for rule matching and text processing
  private static matchesCombinationRule(q1: any, q2: any, rule: any): boolean {
    return (
      rule.categories.includes(q1.category) &&
      rule.categories.includes(q2.category) &&
      rule.types.includes(q1.type) &&
      rule.types.includes(q2.type)
    );
  }

  private static matchesReformulationRule(
    question: any,
    context: AdaptationContext,
    rule: any
  ): boolean {
    if (rule.departments && context.department) {
      return rule.departments.includes(context.department);
    }
    if (rule.roles && context.role) {
      return rule.roles.includes(context.role);
    }
    return false;
  }

  private static combineQuestionTexts(
    text1: string,
    text2: string,
    rule: any
  ): string {
    // Simplified combination logic - in a real implementation, this would be more sophisticated
    const action1 = this.extractAction(text1);
    const action2 = this.extractAction(text2);

    return rule.template
      .replace('{action1}', action1)
      .replace('{action2}', action2);
  }

  private static applyReformulationRule(
    text: string,
    rule: any,
    context: AdaptationContext
  ): string {
    let reformulated = text;

    for (const [original, replacement] of Object.entries(rule.replacements)) {
      reformulated = reformulated.replace(
        new RegExp(original, 'gi'),
        replacement as string
      );
    }

    return reformulated;
  }

  private static extractAction(text: string): string {
    // Simplified action extraction - would be more sophisticated in real implementation
    const actionWords = text.match(
      /\b(communicate|collaborate|manage|support|provide|deliver|achieve)\w*/gi
    );
    return actionWords ? actionWords[0].toLowerCase() : 'work';
  }

  /**
   * Save adapted questions to the database for future use
   */
  static async saveAdaptedQuestions(
    adaptedQuestions: AdaptedQuestion[],
    surveyId: string,
    createdBy: string,
    companyId?: string
  ): Promise<string[]> {
    await connectDB();

    const savedQuestionIds: string[] = [];

    for (const adaptedQ of adaptedQuestions) {
      // Only save generated or significantly modified questions
      if (
        adaptedQ.adaptationType === 'generated' ||
        adaptedQ.adaptationType === 'combined' ||
        (adaptedQ.adaptationType === 'reformulated' &&
          adaptedQ.confidence > 0.8)
      ) {
        const questionData = {
          text: adaptedQ.text,
          type: adaptedQ.type,
          category: adaptedQ.category,
          subcategory: adaptedQ.subcategory,
          options: adaptedQ.options,
          scale_min: adaptedQ.scale_min,
          scale_max: adaptedQ.scale_max,
          scale_labels: adaptedQ.scale_labels,
          tags: adaptedQ.tags,
          is_ai_generated: true,
          created_by: createdBy,
          company_id: companyId,
          parent_question_id: adaptedQ.sourceQuestions?.[0],
          adaptation_metadata: {
            adaptation_type: adaptedQ.adaptationType,
            adaptation_reason: adaptedQ.adaptationReason,
            confidence: adaptedQ.confidence,
            source_questions: adaptedQ.sourceQuestions,
            survey_id: surveyId,
          },
        };

        const question = new QuestionBank(questionData);
        await question.save();
        savedQuestionIds.push(question._id.toString());
      }
    }

    return savedQuestionIds;
  }

  /**
   * Track adaptation effectiveness for continuous improvement
   */
  static async trackAdaptationEffectiveness(
    adaptedQuestionId: string,
    responseRate: number,
    insightScore: number,
    userFeedback?: any
  ): Promise<void> {
    await connectDB();

    await QuestionBank.findByIdAndUpdate(adaptedQuestionId, {
      $set: {
        'metrics.response_rate': responseRate,
        'metrics.insight_score': insightScore,
        'adaptation_metadata.effectiveness_tracked': true,
        'adaptation_metadata.user_feedback': userFeedback,
      },
      $inc: {
        'metrics.usage_count': 1,
      },
    });
  }
}
