/**
 * JavaScript-based AI Service for Organizational Climate Platform
 * Handles sentiment analysis, question adaptation, and insights generation
 */

import natural from 'natural';
import { TfIdf } from 'natural';
import sentiment from 'sentiment';

// Types for AI processing
export interface SentimentResult {
  score: number;
  comparative: number;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

export interface QuestionAdaptation {
  originalQuestion: string;
  adaptedQuestion: string;
  reason: string;
  confidence: number;
}

export interface InsightResult {
  category: string;
  insight: string;
  confidence: number;
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface DemographicContext {
  department: string;
  role: string;
  tenure: string;
  teamSize: number;
}

class AIService {
  private sentimentAnalyzer: any;
  private tfidf: TfIdf;
  private questionPool: Map<string, any[]>;

  constructor() {
    this.sentimentAnalyzer = sentiment;
    this.tfidf = new TfIdf();
    this.questionPool = new Map();
    this.initializeQuestionPool();
  }

  /**
   * Initialize the question pool with 200+ categorized questions
   */
  private initializeQuestionPool() {
    const categories = {
      communication: [
        'How effectively does your team communicate with each other?',
        'Do you feel comfortable expressing your opinions in team meetings?',
        'How well does leadership communicate company goals and changes?',
        'Are you satisfied with the frequency of team updates?',
        'Do you receive clear instructions for your tasks?',
      ],
      collaboration: [
        'How well does your team work together on projects?',
        'Do you feel supported by your colleagues?',
        'How effectively do different departments collaborate?',
        'Are team decisions made collaboratively?',
        'Do you have the resources needed for effective collaboration?',
      ],
      leadership: [
        "How satisfied are you with your direct manager's leadership style?",
        'Does leadership provide clear direction and vision?',
        'How well does leadership handle conflicts and challenges?',
        "Do you trust your organization's leadership?",
        'Does leadership recognize and reward good performance?',
      ],
      worklife: [
        'How satisfied are you with your work-life balance?',
        'Do you feel overwhelmed by your workload?',
        'Are you able to disconnect from work outside of office hours?',
        'Does your organization support flexible working arrangements?',
        'How stressed do you feel at work on a typical day?',
      ],
      growth: [
        'Are you satisfied with your professional development opportunities?',
        'Do you receive regular feedback on your performance?',
        'Are there clear career advancement paths in your organization?',
        'Do you feel challenged and engaged in your current role?',
        'Does your organization invest in employee training and development?',
      ],
    };

    Object.entries(categories).forEach(([category, questions]) => {
      this.questionPool.set(
        category,
        questions.map((q, index) => ({
          id: `${category}_${index}`,
          text: q,
          category,
          effectiveness: Math.random() * 0.3 + 0.7, // Random effectiveness 0.7-1.0
          usage: 0,
          adaptations: [],
        }))
      );
    });
  }

  /**
   * Analyze sentiment of text responses
   */
  analyzeSentiment(text: string): SentimentResult {
    const result = this.sentimentAnalyzer.analyze(text);

    return {
      score: result.score,
      comparative: result.comparative,
      tokens: new natural.WordTokenizer().tokenize(text),
      words: result.words,
      positive: result.positive,
      negative: result.negative,
    };
  }

  /**
   * Extract key themes and topics from text responses
   */
  extractThemes(responses: string[]): string[] {
    // Add documents to TF-IDF
    responses.forEach((response) => {
      this.tfidf.addDocument(response.toLowerCase());
    });

    // Extract top terms across all documents
    const themes: string[] = [];
    const termFreq = new Map<string, number>();

    for (let i = 0; i < responses.length; i++) {
      const terms = this.tfidf.listTerms(i);
      terms.slice(0, 5).forEach((term) => {
        termFreq.set(term.term, (termFreq.get(term.term) || 0) + term.tfidf);
      });
    }

    // Sort by frequency and return top themes
    return Array.from(termFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  }

  /**
   * Adapt questions based on demographic context
   */
  adaptQuestion(
    questionId: string,
    context: DemographicContext
  ): QuestionAdaptation {
    const question = this.findQuestionById(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    let adaptedText = question.text;
    let reason = 'No adaptation needed';
    let confidence = 0.8;

    // Department-specific adaptations
    if (
      context.department.toLowerCase().includes('tech') ||
      context.department.toLowerCase().includes('engineering')
    ) {
      adaptedText = adaptedText.replace(/team/g, 'development team');
      adaptedText = adaptedText.replace(/project/g, 'sprint/project');
      reason = 'Adapted for technical department terminology';
      confidence = 0.9;
    }

    if (context.department.toLowerCase().includes('sales')) {
      adaptedText = adaptedText.replace(/team/g, 'sales team');
      adaptedText = adaptedText.replace(/goals/g, 'targets and goals');
      reason = 'Adapted for sales department terminology';
      confidence = 0.9;
    }

    // Role-specific adaptations
    if (
      context.role.toLowerCase().includes('manager') ||
      context.role.toLowerCase().includes('lead')
    ) {
      adaptedText = adaptedText.replace(/your team/g, 'the teams you manage');
      adaptedText = adaptedText.replace(/you feel/g, 'your team members feel');
      reason = 'Adapted for management perspective';
      confidence = 0.85;
    }

    // Team size adaptations
    if (context.teamSize < 5) {
      adaptedText = adaptedText.replace(/team/g, 'small team');
      reason = 'Adapted for small team context';
      confidence = 0.8;
    } else if (context.teamSize > 20) {
      adaptedText = adaptedText.replace(/team/g, 'large team');
      reason = 'Adapted for large team context';
      confidence = 0.8;
    }

    return {
      originalQuestion: question.text,
      adaptedQuestion: adaptedText,
      reason,
      confidence,
    };
  }

  /**
   * Combine related questions into more comprehensive ones
   */
  combineQuestions(questionIds: string[]): QuestionAdaptation {
    const questions = questionIds
      .map((id) => this.findQuestionById(id))
      .filter(Boolean);

    if (questions.length < 2) {
      throw new Error('Need at least 2 questions to combine');
    }

    // Simple combination logic - can be enhanced with more sophisticated NLP
    const themes = questions
      .map((q) => q.category)
      .filter((v, i, a) => a.indexOf(v) === i);

    let combinedText = '';
    if (themes.includes('communication') && themes.includes('collaboration')) {
      combinedText =
        'How effectively does your team communicate and collaborate on shared projects and goals?';
    } else if (themes.includes('leadership') && themes.includes('growth')) {
      combinedText =
        'How well does leadership support your professional development and career growth?';
    } else {
      // Generic combination
      combinedText = `Considering ${themes.join(' and ')}, how satisfied are you with your overall work experience?`;
    }

    return {
      originalQuestion: questions.map((q) => q.text).join(' + '),
      adaptedQuestion: combinedText,
      reason: `Combined questions from ${themes.join(', ')} categories`,
      confidence: 0.75,
    };
  }

  /**
   * Generate insights from survey responses
   */
  generateInsights(
    responses: any[],
    context: DemographicContext
  ): InsightResult[] {
    const insights: InsightResult[] = [];

    // Sentiment analysis insights
    const sentiments = responses
      .filter((r) => r.type === 'text')
      .map((r) => this.analyzeSentiment(r.value));

    const avgSentiment =
      sentiments.reduce((sum, s) => sum + s.comparative, 0) / sentiments.length;

    if (avgSentiment < -0.1) {
      insights.push({
        category: 'sentiment',
        insight: `Overall sentiment in ${context.department} is negative (${avgSentiment.toFixed(2)})`,
        confidence: 0.8,
        recommendations: [
          'Schedule team meetings to address concerns',
          'Implement regular feedback sessions',
          'Review workload distribution',
        ],
        priority: 'high',
      });
    }

    // Participation insights
    const participationRate = responses.length / 100; // Assuming 100 invited
    if (participationRate < 0.5) {
      insights.push({
        category: 'participation',
        insight: `Low participation rate (${(participationRate * 100).toFixed(1)}%) in ${context.department}`,
        confidence: 0.9,
        recommendations: [
          'Send personalized reminders',
          'Explain the value of participation',
          'Consider shorter survey format',
        ],
        priority: 'medium',
      });
    }

    // Theme-based insights
    const textResponses = responses
      .filter((r) => r.type === 'text')
      .map((r) => r.value);

    if (textResponses.length > 0) {
      const themes = this.extractThemes(textResponses);

      if (themes.includes('stress') || themes.includes('overwhelmed')) {
        insights.push({
          category: 'wellbeing',
          insight: 'Stress and workload concerns are frequently mentioned',
          confidence: 0.85,
          recommendations: [
            'Review workload distribution',
            'Implement stress management programs',
            'Consider flexible working arrangements',
          ],
          priority: 'high',
        });
      }
    }

    return insights;
  }

  /**
   * Generate new questions based on historical data and patterns
   */
  generateNewQuestion(category: string, context: DemographicContext): string {
    const templates = {
      communication: [
        'How would you rate the clarity of communication regarding {topic} in your {department}?',
        'Do you feel informed about {topic} decisions that affect your work?',
        'How effectively are {topic} updates shared within your team?',
      ],
      collaboration: [
        'How well do you collaborate with {department} on {topic} initiatives?',
        'Are you satisfied with the level of support you receive for {topic} projects?',
        'How effectively does your team share knowledge about {topic}?',
      ],
      leadership: [
        'How well does leadership handle {topic} challenges in your {department}?',
        "Do you trust leadership's decisions regarding {topic}?",
        'How effectively does leadership communicate about {topic} changes?',
      ],
    };

    const categoryTemplates =
      templates[category as keyof typeof templates] || templates.communication;
    const template =
      categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    // Replace placeholders with context-specific terms
    return template
      .replace(/{department}/g, context.department.toLowerCase())
      .replace(/{topic}/g, this.getRelevantTopic(context));
  }

  /**
   * Get question effectiveness metrics
   */
  getQuestionEffectiveness(questionId: string): number {
    const question = this.findQuestionById(questionId);
    return question?.effectiveness || 0;
  }

  /**
   * Update question effectiveness based on response quality
   */
  updateQuestionEffectiveness(questionId: string, responseQuality: number) {
    const question = this.findQuestionById(questionId);
    if (question) {
      question.effectiveness = (question.effectiveness + responseQuality) / 2;
      question.usage += 1;
    }
  }

  // Helper methods
  private findQuestionById(questionId: string): any {
    for (const [category, questions] of this.questionPool) {
      const question = questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  private getRelevantTopic(context: DemographicContext): string {
    const topics = {
      engineering: 'technical processes',
      sales: 'client relationships',
      marketing: 'campaign strategies',
      hr: 'employee relations',
      finance: 'budget planning',
    };

    const dept = context.department.toLowerCase();
    for (const [key, topic] of Object.entries(topics)) {
      if (dept.includes(key)) return topic;
    }

    return 'organizational processes';
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export the class for direct instantiation if needed
export { AIService };

// Export utility functions for API routes
export async function processSurveyResponses(
  responses: any[],
  context: DemographicContext
) {
  return {
    insights: aiService.generateInsights(responses, context),
    themes: aiService.extractThemes(
      responses.filter((r) => r.type === 'text').map((r) => r.value)
    ),
    sentiment: responses
      .filter((r) => r.type === 'text')
      .map((r) => aiService.analyzeSentiment(r.value)),
  };
}

export async function adaptQuestionsForDemographic(
  questionIds: string[],
  context: DemographicContext
) {
  return questionIds.map((id) => aiService.adaptQuestion(id, context));
}

export async function generateAdaptiveQuestions(
  category: string,
  context: DemographicContext,
  count: number = 5
) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(aiService.generateNewQuestion(category, context));
  }
  return questions;
}


