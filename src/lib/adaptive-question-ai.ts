import {
  QuestionPool,
  QuestionCombination,
  QuestionGeneration,
  IQuestionPool,
} from '@/models/QuestionPool';
import { connectToDatabase } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export interface AdaptiveQuestionRequest {
  companyId: string;
  departmentId?: string;
  surveyType: string;
  demographicContext: Record<string, unknown>;
  previousResponses?: Record<string, unknown>;
  targetQuestionCount: number;
  adaptationPreferences?: {
    allowCombinations: boolean;
    allowReformulations: boolean;
    allowGeneration: boolean;
    preferredCategories: string[];
  };
}

export interface AdaptedQuestion {
  id: string;
  text: string;
  type: string;
  options?: string[];
  adaptationType: 'original' | 'combined' | 'reformulated' | 'generated';
  sourceQuestionIds: string[];
  effectivenessScore: number;
  confidence: number;
  reasoning: string;
}

export class AdaptiveQuestionAI {
  private static instance: AdaptiveQuestionAI;
  private questionCache: Map<string, IQuestionPool[]> = new Map();
  private adaptationCache: Map<string, AdaptedQuestion[]> = new Map();

  public static getInstance(): AdaptiveQuestionAI {
    if (!AdaptiveQuestionAI.instance) {
      AdaptiveQuestionAI.instance = new AdaptiveQuestionAI();
    }
    return AdaptiveQuestionAI.instance;
  }

  /**
   * Generate adaptive questions based on context and requirements
   */
  async generateAdaptiveQuestions(
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    await connectToDatabase();

    const cacheKey = this.generateCacheKey(request);
    if (this.adaptationCache.has(cacheKey)) {
      return this.adaptationCache.get(cacheKey)!;
    }

    try {
      // Get base question pool
      const baseQuestions = await this.getRelevantQuestions(request);

      // Apply AI-driven adaptations
      const adaptedQuestions: AdaptedQuestion[] = [];

      // 1. Select high-effectiveness original questions
      const originalQuestions = await this.selectOriginalQuestions(
        baseQuestions,
        request
      );
      adaptedQuestions.push(...originalQuestions);

      // 2. Generate combined questions if enabled
      if (request.adaptationPreferences?.allowCombinations) {
        const combinedQuestions = await this.generateCombinedQuestions(
          baseQuestions,
          request
        );
        adaptedQuestions.push(...combinedQuestions);
      }

      // 3. Generate reformulated questions if enabled
      if (request.adaptationPreferences?.allowReformulations) {
        const reformulatedQuestions = await this.generateReformulatedQuestions(
          baseQuestions,
          request
        );
        adaptedQuestions.push(...reformulatedQuestions);
      }

      // 4. Generate new questions if enabled
      if (request.adaptationPreferences?.allowGeneration) {
        const generatedQuestions = await this.generateNewQuestions(
          baseQuestions,
          request
        );
        adaptedQuestions.push(...generatedQuestions);
      }

      // 5. Rank and select best questions
      const finalQuestions = await this.rankAndSelectQuestions(
        adaptedQuestions,
        request
      );

      // Cache results
      this.adaptationCache.set(cacheKey, finalQuestions);

      return finalQuestions;
    } catch (error) {
      console.error('Error generating adaptive questions:', error);
      throw new Error('Failed to generate adaptive questions');
    }
  }

  /**
   * Get relevant questions from the pool based on context
   */
  private async getRelevantQuestions(
    request: AdaptiveQuestionRequest
  ): Promise<IQuestionPool[]> {
    const cacheKey = `questions_${request.companyId}_${request.surveyType}`;

    if (this.questionCache.has(cacheKey)) {
      return this.questionCache.get(cacheKey)!;
    }

    const query: any = {
      isActive: true,
      $or: [
        { 'demographicContext.department': request.departmentId },
        { demographicContext: { $size: 0 } }, // Universal questions
      ],
    };

    // Add category filters if specified
    if (request.adaptationPreferences?.preferredCategories?.length) {
      query.category = {
        $in: request.adaptationPreferences.preferredCategories,
      };
    }

    const questions = await (QuestionPool as any).find(query)
      .sort({ effectivenessScore: -1, usageCount: -1 })
      .limit(500) // Get top 500 questions for processing
      .lean();

    this.questionCache.set(cacheKey, questions);
    return questions;
  }

  /**
   * Select high-effectiveness original questions
   */
  private async selectOriginalQuestions(
    questions: IQuestionPool[],
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    const selectedQuestions: AdaptedQuestion[] = [];
    const targetCount = Math.floor(request.targetQuestionCount * 0.6); // 60% original questions

    // Filter and score questions based on context
    const scoredQuestions = questions.map((q) => ({
      question: q,
      contextScore: this.calculateContextScore(q, request),
      effectivenessScore: q.effectivenessScore || 0,
    }));

    // Sort by combined score
    scoredQuestions.sort(
      (a, b) =>
        b.contextScore * 0.4 +
        b.effectivenessScore * 0.6 -
        (a.contextScore * 0.4 + a.effectivenessScore * 0.6)
    );

    // Select top questions
    for (let i = 0; i < Math.min(targetCount, scoredQuestions.length); i++) {
      const { question, contextScore, effectivenessScore } = scoredQuestions[i];

      selectedQuestions.push({
        id: question.id,
        text: question.originalText,
        type: question.questionType,
        options: question.options,
        adaptationType: 'original',
        sourceQuestionIds: [question.id],
        effectivenessScore: effectivenessScore,
        confidence: (contextScore + effectivenessScore) / 2,
        reasoning: `High-effectiveness original question (${effectivenessScore}% effective) with good context match (${contextScore}% relevance)`,
      });
    }

    return selectedQuestions;
  }

  /**
   * Generate combined questions by merging related questions
   */
  private async generateCombinedQuestions(
    questions: IQuestionPool[],
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    const combinedQuestions: AdaptedQuestion[] = [];
    const targetCount = Math.floor(request.targetQuestionCount * 0.2); // 20% combined questions

    // Find questions with combination potential
    const combinableQuestions = questions.filter(
      (q) => q.combinationPotential && q.combinationPotential.length > 0
    );

    // Check existing successful combinations
    const existingCombinations = await (QuestionCombination as any).find({
      companyContexts: request.companyId,
      isActive: true,
    })
      .sort({ effectivenessScore: -1 })
      .limit(targetCount);

    // Use existing successful combinations first
    for (const combo of existingCombinations) {
      if (combinedQuestions.length >= targetCount) break;

      combinedQuestions.push({
        id: combo.id,
        text: combo.combinedText,
        type: 'likert', // Most combinations are Likert scale
        adaptationType: 'combined',
        sourceQuestionIds: combo.sourceQuestionIds,
        effectivenessScore: combo.effectivenessScore,
        confidence: Math.min(combo.effectivenessScore, 85),
        reasoning: `Proven combination with ${combo.effectivenessScore}% effectiveness across ${combo.usageCount} uses`,
      });
    }

    // Generate new combinations if needed
    const remainingSlots = targetCount - combinedQuestions.length;
    if (remainingSlots > 0) {
      const newCombinations = await this.createNewCombinations(
        combinableQuestions,
        request,
        remainingSlots
      );
      combinedQuestions.push(...newCombinations);
    }

    return combinedQuestions;
  }

  /**
   * Create new question combinations
   */
  private async createNewCombinations(
    questions: IQuestionPool[],
    request: AdaptiveQuestionRequest,
    count: number
  ): Promise<AdaptedQuestion[]> {
    const combinations: AdaptedQuestion[] = [];

    // Define combination patterns
    const combinationPatterns = [
      { categories: ['collaboration', 'communication'], weight: 0.9 },
      { categories: ['leadership', 'trust'], weight: 0.85 },
      { categories: ['innovation', 'creativity'], weight: 0.8 },
      { categories: ['work-life-balance', 'stress'], weight: 0.75 },
      { categories: ['recognition', 'motivation'], weight: 0.8 },
    ];

    for (const pattern of combinationPatterns) {
      if (combinations.length >= count) break;

      const categoryQuestions = questions.filter((q) =>
        pattern.categories.includes(q.category.toLowerCase())
      );

      if (categoryQuestions.length >= 2) {
        // Select best questions from each category
        const q1 = categoryQuestions.find(
          (q) => q.category.toLowerCase() === pattern.categories[0]
        );
        const q2 = categoryQuestions.find(
          (q) => q.category.toLowerCase() === pattern.categories[1]
        );

        if (q1 && q2) {
          const combinedText = this.combineQuestionTexts(
            q1.originalText,
            q2.originalText,
            pattern.categories
          );
          const combinationId = uuidv4();

          // Save combination for future use
          const newCombination = new QuestionCombination({
            id: combinationId,
            sourceQuestionIds: [q1.id, q2.id],
            combinedText,
            combinationType: 'hybrid',
            effectivenessScore:
              ((q1.effectivenessScore + q2.effectivenessScore) / 2) *
              pattern.weight,
            companyContexts: [request.companyId],
            departmentContexts: request.departmentId
              ? [request.departmentId]
              : [],
          });

          await newCombination.save();

          combinations.push({
            id: combinationId,
            text: combinedText,
            type: 'likert',
            adaptationType: 'combined',
            sourceQuestionIds: [q1.id, q2.id],
            effectivenessScore: newCombination.effectivenessScore,
            confidence: pattern.weight * 100,
            reasoning: `AI-generated combination of ${pattern.categories.join(' and ')} questions`,
          });
        }
      }
    }

    return combinations;
  }

  /**
   * Generate reformulated questions based on demographic context
   */
  private async generateReformulatedQuestions(
    questions: IQuestionPool[],
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    const reformulatedQuestions: AdaptedQuestion[] = [];
    const targetCount = Math.floor(request.targetQuestionCount * 0.15); // 15% reformulated questions

    // Select questions that would benefit from reformulation
    const candidateQuestions = questions
      .filter((q) => q.effectivenessScore > 60 && q.usageCount > 10)
      .slice(0, targetCount * 2); // Get more candidates than needed

    for (const question of candidateQuestions) {
      if (reformulatedQuestions.length >= targetCount) break;

      const reformulatedText = await this.reformulateQuestionText(
        question.originalText,
        request.demographicContext,
        request.departmentId
      );

      if (reformulatedText && reformulatedText !== question.originalText) {
        const adaptationId = uuidv4();

        reformulatedQuestions.push({
          id: adaptationId,
          text: reformulatedText,
          type: question.questionType,
          options: question.options,
          adaptationType: 'reformulated',
          sourceQuestionIds: [question.id],
          effectivenessScore: question.effectivenessScore * 0.9, // Slight reduction for new adaptation
          confidence: 75,
          reasoning: `Reformulated for ${request.departmentId || 'organizational'} context to improve relevance`,
        });
      }
    }

    return reformulatedQuestions;
  }

  /**
   * Generate entirely new questions based on historical data
   */
  private async generateNewQuestions(
    questions: IQuestionPool[],
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    const generatedQuestions: AdaptedQuestion[] = [];
    const targetCount = Math.floor(request.targetQuestionCount * 0.05); // 5% generated questions

    // Analyze patterns in high-performing questions
    const highPerformingQuestions = questions.filter(
      (q) => q.effectivenessScore > 80
    );

    if (highPerformingQuestions.length < 3) {
      return generatedQuestions; // Need sufficient data for generation
    }

    // Generate questions based on successful patterns
    const generationPrompts = this.createGenerationPrompts(
      highPerformingQuestions,
      request
    );

    for (let i = 0; i < Math.min(targetCount, generationPrompts.length); i++) {
      const prompt = generationPrompts[i];
      const generatedText = await this.generateQuestionFromPrompt(
        prompt,
        request
      );

      if (generatedText) {
        const generationId = uuidv4();

        // Save generation record
        const newGeneration = new QuestionGeneration({
          id: generationId,
          generationType: 'ai_generated',
          sourceData: {
            historicalQuestions: prompt.sourceQuestionIds,
            contextualData: request.demographicContext,
          },
          generatedText,
          validationScore: 70, // Initial score, will be updated based on performance
          approvalStatus: 'pending',
        });

        await newGeneration.save();

        generatedQuestions.push({
          id: generationId,
          text: generatedText,
          type: 'likert',
          adaptationType: 'generated',
          sourceQuestionIds: prompt.sourceQuestionIds,
          effectivenessScore: 70, // Conservative initial score
          confidence: 60,
          reasoning: `AI-generated question based on successful patterns in ${prompt.category} category`,
        });
      }
    }

    return generatedQuestions;
  }

  /**
   * Rank and select the best questions for the final set
   */
  private async rankAndSelectQuestions(
    questions: AdaptedQuestion[],
    request: AdaptiveQuestionRequest
  ): Promise<AdaptedQuestion[]> {
    // Calculate final scores considering multiple factors
    const scoredQuestions = questions.map((q) => ({
      ...q,
      finalScore: this.calculateFinalScore(q, request),
    }));

    // Sort by final score
    scoredQuestions.sort((a, b) => b.finalScore - a.finalScore);

    // Select top questions ensuring diversity
    const selectedQuestions: AdaptedQuestion[] = [];
    const maxPerType = Math.ceil(request.targetQuestionCount / 4);
    const typeCount = new Map<string, number>();

    for (const question of scoredQuestions) {
      if (selectedQuestions.length >= request.targetQuestionCount) break;

      const currentTypeCount = typeCount.get(question.adaptationType) || 0;
      if (currentTypeCount >= maxPerType) continue;

      selectedQuestions.push(question);
      typeCount.set(question.adaptationType, currentTypeCount + 1);
    }

    // Fill remaining slots if needed
    while (
      selectedQuestions.length < request.targetQuestionCount &&
      selectedQuestions.length < scoredQuestions.length
    ) {
      const remaining = scoredQuestions.filter(
        (q) => !selectedQuestions.includes(q)
      );
      if (remaining.length === 0) break;
      selectedQuestions.push(remaining[0]);
    }

    return selectedQuestions;
  }

  /**
   * Calculate context relevance score for a question
   */
  private calculateContextScore(
    question: IQuestionPool,
    request: AdaptiveQuestionRequest
  ): number {
    let score = 50; // Base score

    // Department relevance
    if (request.departmentId && question.demographicContext) {
      const departmentMatch = question.demographicContext.some(
        (ctx) =>
          ctx.department.toLowerCase() === request.departmentId?.toLowerCase()
      );
      if (departmentMatch) score += 20;
    }

    // Survey type relevance
    if (question.metadata?.surveyTypes?.includes(request.surveyType)) {
      score += 15;
    }

    // Category preference
    if (
      request.adaptationPreferences?.preferredCategories?.includes(
        question.category
      )
    ) {
      score += 10;
    }

    // Usage history
    if (question.usageCount > 50) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Combine two question texts intelligently
   */
  private combineQuestionTexts(
    text1: string,
    text2: string,
    categories: string[]
  ): string {
    // Simple combination logic - in production, this would use more sophisticated NLP
    const category1 = categories[0];
    const category2 = categories[1];

    // Extract key concepts from each question
    const concept1 = this.extractKeyConcept(text1, category1);
    const concept2 = this.extractKeyConcept(text2, category2);

    return `How effectively does your team demonstrate ${concept1} and ${concept2} in daily work activities?`;
  }

  /**
   * Extract key concept from question text
   */
  private extractKeyConcept(text: string, category: string): string {
    // Simple concept extraction - in production, this would use NLP
    const conceptMap: Record<string, string> = {
      collaboration: 'collaborative teamwork',
      communication: 'clear communication',
      leadership: 'strong leadership',
      trust: 'mutual trust',
      innovation: 'innovative thinking',
      creativity: 'creative problem-solving',
      'work-life-balance': 'work-life balance',
      stress: 'stress management',
      recognition: 'recognition and appreciation',
      motivation: 'motivation and engagement',
    };

    return conceptMap[category.toLowerCase()] || category;
  }

  /**
   * Reformulate question text for specific demographic context
   */
  private async reformulateQuestionText(
    originalText: string,
    demographicContext: Record<string, any>,
    departmentId?: string
  ): Promise<string> {
    // Simple reformulation logic - in production, this would use advanced NLP
    let reformulated = originalText;

    // Department-specific terminology
    if (departmentId) {
      const departmentTerms: Record<string, Record<string, string>> = {
        engineering: {
          team: 'development team',
          project: 'sprint',
          work: 'code development',
        },
        sales: {
          team: 'sales team',
          project: 'sales campaign',
          work: 'client engagement',
        },
        marketing: {
          team: 'marketing team',
          project: 'campaign',
          work: 'marketing activities',
        },
      };

      const terms = departmentTerms[departmentId.toLowerCase()];
      if (terms) {
        Object.entries(terms).forEach(([generic, specific]) => {
          reformulated = reformulated.replace(
            new RegExp(generic, 'gi'),
            specific
          );
        });
      }
    }

    return reformulated;
  }

  /**
   * Create generation prompts based on successful patterns
   */
  private createGenerationPrompts(
    questions: IQuestionPool[],
    _request: AdaptiveQuestionRequest
  ): Array<{ category: string; sourceQuestionIds: string[]; pattern: string }> {
    const prompts: Array<{
      category: string;
      sourceQuestionIds: string[];
      pattern: string;
    }> = [];

    // Group questions by category
    const categoryGroups = questions.reduce(
      (groups, q) => {
        if (!groups[q.category]) groups[q.category] = [];
        groups[q.category].push(q);
        return groups;
      },
      {} as Record<string, IQuestionPool[]>
    );

    // Create prompts for each category with sufficient questions
    Object.entries(categoryGroups).forEach(([category, categoryQuestions]) => {
      if (categoryQuestions.length >= 2) {
        prompts.push({
          category,
          sourceQuestionIds: categoryQuestions.slice(0, 3).map((q) => q.id),
          pattern: `Generate a question about ${category} that builds on successful patterns`,
        });
      }
    });

    return prompts;
  }

  /**
   * Generate question from prompt (simplified version)
   */
  private async generateQuestionFromPrompt(
    prompt: { category: string; sourceQuestionIds: string[]; pattern: string },
    _request: AdaptiveQuestionRequest
  ): Promise<string> {
    // Simple generation logic - in production, this would use advanced AI
    const templates = [
      `How would you rate the ${prompt.category} within your team?`,
      `To what extent does your organization demonstrate effective ${prompt.category}?`,
      `How satisfied are you with the current level of ${prompt.category} in your workplace?`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Calculate final score for question ranking
   */
  private calculateFinalScore(
    question: AdaptedQuestion,
    _request: AdaptiveQuestionRequest
  ): number {
    let score = question.effectivenessScore * 0.4; // 40% effectiveness
    score += question.confidence * 0.3; // 30% confidence

    // Adaptation type bonus
    const typeBonus: Record<string, number> = {
      original: 0.2,
      combined: 0.25,
      reformulated: 0.15,
      generated: 0.1,
    };
    score += (typeBonus[question.adaptationType] || 0) * 100;

    // Diversity bonus (prefer different types)
    score += Math.random() * 5; // Small randomization for diversity

    return score;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AdaptiveQuestionRequest): string {
    return `adaptive_${request.companyId}_${request.departmentId || 'all'}_${request.surveyType}_${request.targetQuestionCount}`;
  }

  /**
   * Clear caches (useful for testing and updates)
   */
  public clearCaches(): void {
    this.questionCache.clear();
    this.adaptationCache.clear();
  }
}

export const adaptiveQuestionAI = AdaptiveQuestionAI.getInstance();
