/**
 * AI Fallback Service
 * Provides fallback functionality when AI services are unavailable
 */

import { IAIInsight } from '../models/AIInsight';
import { ISurvey } from '../models/Survey';
import { IResponse, IQuestionResponse } from '../models/Response';
import { IMicroclimate } from '../models/Microclimate';

export interface FallbackInsight {
  type: 'pattern' | 'risk' | 'recommendation' | 'prediction';
  category: string;
  title: string;
  description: string;
  confidence_score: number;
  affected_segments: string[];
  recommended_actions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  fallback: true;
}

export interface FallbackAnalysis {
  insights: FallbackInsight[];
  summary: string;
  recommendations: string[];
  confidence_note: string;
  fallback_reason: string;
}

export class AIFallbackService {
  private static instance: AIFallbackService;

  private constructor() {}

  public static getInstance(): AIFallbackService {
    if (!AIFallbackService.instance) {
      AIFallbackService.instance = new AIFallbackService();
    }
    return AIFallbackService.instance;
  }

  public async generateFallbackInsights(
    surveyId: string,
    responses: IResponse[],
    survey: ISurvey
  ): Promise<FallbackAnalysis> {
    console.log('AI service unavailable, generating fallback insights...');

    const insights: FallbackInsight[] = [];
    const responseCount = responses.length;
    const questionCount = survey.questions?.length || 0;

    // Basic participation analysis
    if (responseCount > 0) {
      insights.push({
        type: 'pattern',
        category: 'Participation',
        title: 'Survey Participation Analysis',
        description: `Received ${responseCount} responses across ${questionCount} questions. ${this.getParticipationInsight(responseCount)}`,
        confidence_score: 0.7,
        affected_segments: ['All Participants'],
        recommended_actions: [
          'Review participation patterns',
          'Consider follow-up communications for non-participants',
          'Analyze response quality and completeness',
        ],
        priority: responseCount < 10 ? 'high' : 'medium',
        fallback: true,
      });
    }

    // Basic response pattern analysis
    const allQuestionResponses = responses.flatMap(r => r.responses);
    const likertResponses = allQuestionResponses.filter(
      (r) =>
        survey.questions?.find(
          (q) => q.id.toString() === r.question_id.toString()
        )?.type === 'likert'
    );

    if (likertResponses.length > 0) {
      const averageScore = this.calculateAverageLikertScore(likertResponses);
      insights.push({
        type: 'pattern',
        category: 'Satisfaction',
        title: 'Overall Satisfaction Trend',
        description: `Average satisfaction score: ${averageScore.toFixed(1)}/5. ${this.getSatisfactionInsight(averageScore)}`,
        confidence_score: 0.6,
        affected_segments: ['All Participants'],
        recommended_actions: this.getSatisfactionRecommendations(averageScore),
        priority:
          averageScore < 3 ? 'high' : averageScore < 4 ? 'medium' : 'low',
        fallback: true,
      });
    }

    // Open-ended response analysis (basic)
    const openEndedResponses = allQuestionResponses.filter(
      (r) =>
        survey.questions?.find(
          (q) => q.id.toString() === r.question_id.toString()
        )?.type === 'open_ended'
    );

    if (openEndedResponses.length > 0) {
      const textAnalysis = this.basicTextAnalysis(openEndedResponses);
      insights.push({
        type: 'pattern',
        category: 'Feedback',
        title: 'Open-ended Feedback Summary',
        description: `Analyzed ${openEndedResponses.length} text responses. ${textAnalysis.summary}`,
        confidence_score: 0.5,
        affected_segments: ['All Participants'],
        recommended_actions: textAnalysis.recommendations,
        priority: 'medium',
        fallback: true,
      });
    }

    // Risk assessment based on basic patterns
    if (responseCount < 5) {
      insights.push({
        type: 'risk',
        category: 'Data Quality',
        title: 'Low Response Rate Risk',
        description:
          'Very low response rate may indicate engagement issues or survey accessibility problems.',
        confidence_score: 0.8,
        affected_segments: ['All Participants'],
        recommended_actions: [
          'Investigate barriers to participation',
          'Consider extending survey period',
          'Review survey accessibility and communication',
          'Follow up with non-participants',
        ],
        priority: 'critical',
        fallback: true,
      });
    }

    // Generate basic recommendations
    const recommendations = this.generateBasicRecommendations(
      insights,
      responseCount,
      survey
    );

    return {
      insights,
      summary: this.generateSummary(insights, responseCount),
      recommendations,
      confidence_note:
        'These insights are generated using basic analysis methods due to AI service unavailability. For more detailed analysis, please try again when AI services are restored.',
      fallback_reason: 'AI analysis service temporarily unavailable',
    };
  }

  public async generateFallbackMicroclimateInsights(
    microclimateId: string,
    responses: any[],
    microclimate: IMicroclimate
  ): Promise<FallbackAnalysis> {
    console.log(
      'AI service unavailable, generating fallback microclimate insights...'
    );

    const insights: FallbackInsight[] = [];
    const responseCount = responses.length;

    // Real-time participation analysis
    insights.push({
      type: 'pattern',
      category: 'Engagement',
      title: 'Real-time Participation',
      description: `${responseCount} participants engaged in the microclimate session. ${this.getEngagementInsight(responseCount)}`,
      confidence_score: 0.7,
      affected_segments: ['Session Participants'],
      recommended_actions: [
        'Monitor participation trends',
        'Encourage continued engagement',
        'Follow up with insights from session',
      ],
      priority: responseCount < 5 ? 'high' : 'medium',
      fallback: true,
    });

    // Basic sentiment analysis (simplified)
    if (responses.length > 0) {
      const sentimentAnalysis = this.basicSentimentAnalysis(responses);
      insights.push({
        type: 'pattern',
        category: 'Sentiment',
        title: 'Session Sentiment Overview',
        description: sentimentAnalysis.description,
        confidence_score: 0.5,
        affected_segments: ['Session Participants'],
        recommended_actions: sentimentAnalysis.recommendations,
        priority: sentimentAnalysis.priority,
        fallback: true,
      });
    }

    return {
      insights,
      summary: `Microclimate session completed with ${responseCount} participants. Basic analysis indicates ${this.getMicroclimateStatus(responseCount)}.`,
      recommendations: [
        'Review session feedback for immediate actions',
        'Plan follow-up activities based on participation',
        'Consider scheduling additional sessions if engagement was high',
      ],
      confidence_note:
        'Real-time insights generated using basic analysis. Full AI analysis will be available when services are restored.',
      fallback_reason: 'AI analysis service temporarily unavailable',
    };
  }

  private calculateAverageLikertScore(responses: IQuestionResponse[]): number {
    const scores = responses
      .map((r) =>
        typeof r.response_value === 'number'
          ? r.response_value
          : parseInt(r.response_value as string)
      )
      .filter((score) => !isNaN(score));

    return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
  }

  private getParticipationInsight(responseCount: number): string {
    if (responseCount < 5) {
      return 'Low participation rate may indicate engagement or accessibility issues.';
    } else if (responseCount < 20) {
      return 'Moderate participation provides some insights but may benefit from broader engagement.';
    } else {
      return 'Good participation rate provides reliable data for analysis.';
    }
  }

  private getSatisfactionInsight(averageScore: number): string {
    if (averageScore < 2.5) {
      return 'Scores indicate significant dissatisfaction requiring immediate attention.';
    } else if (averageScore < 3.5) {
      return 'Scores suggest room for improvement in satisfaction levels.';
    } else if (averageScore < 4.5) {
      return 'Scores show generally positive satisfaction with some areas for enhancement.';
    } else {
      return 'Scores indicate high satisfaction levels across responses.';
    }
  }

  private getSatisfactionRecommendations(averageScore: number): string[] {
    if (averageScore < 2.5) {
      return [
        'Conduct immediate investigation into dissatisfaction causes',
        'Implement urgent improvement measures',
        'Schedule follow-up sessions to track progress',
        'Consider leadership intervention',
      ];
    } else if (averageScore < 3.5) {
      return [
        'Identify specific areas for improvement',
        'Develop targeted action plans',
        'Increase communication and feedback loops',
        'Monitor progress regularly',
      ];
    } else if (averageScore < 4.5) {
      return [
        'Build on existing positive aspects',
        'Address minor improvement areas',
        'Maintain current positive practices',
        'Seek feedback on enhancement opportunities',
      ];
    } else {
      return [
        'Maintain current high standards',
        'Share best practices with other teams',
        'Continue regular check-ins',
        'Explore opportunities for innovation',
      ];
    }
  }

  private basicTextAnalysis(responses: IQuestionResponse[]): {
    summary: string;
    recommendations: string[];
  } {
    const textResponses = responses
      .map((r) => r.response_text || (typeof r.response_value === 'string' ? r.response_value : ''))
      .filter(
        (text) => typeof text === 'string' && text.length > 0
      ) as string[];

    if (textResponses.length === 0) {
      return {
        summary: 'No text responses to analyze.',
        recommendations: ['Encourage more detailed feedback in future surveys'],
      };
    }

    // Basic keyword analysis
    const allText = textResponses.join(' ').toLowerCase();
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'positive',
      'happy',
      'satisfied',
      'love',
      'like',
    ];
    const negativeWords = [
      'bad',
      'poor',
      'terrible',
      'negative',
      'unhappy',
      'dissatisfied',
      'hate',
      'dislike',
    ];
    const concernWords = [
      'concern',
      'issue',
      'problem',
      'worry',
      'difficult',
      'challenge',
    ];

    const positiveCount = positiveWords.filter((word) =>
      allText.includes(word)
    ).length;
    const negativeCount = negativeWords.filter((word) =>
      allText.includes(word)
    ).length;
    const concernCount = concernWords.filter((word) =>
      allText.includes(word)
    ).length;

    let summary = `Common themes identified from text responses. `;
    let recommendations: string[] = [];

    if (positiveCount > negativeCount) {
      summary += 'Generally positive sentiment detected.';
      recommendations.push('Build on positive feedback areas');
    } else if (negativeCount > positiveCount) {
      summary += 'Some negative sentiment detected requiring attention.';
      recommendations.push('Address concerns raised in feedback');
    } else {
      summary += 'Mixed sentiment detected.';
      recommendations.push(
        'Balance addressing concerns with building on positives'
      );
    }

    if (concernCount > 0) {
      recommendations.push('Investigate specific concerns mentioned');
      recommendations.push('Develop action plans for identified issues');
    }

    recommendations.push(
      'Follow up with respondents for clarification if needed'
    );

    return { summary, recommendations };
  }

  private getEngagementInsight(responseCount: number): string {
    if (responseCount < 3) {
      return 'Low engagement may indicate timing or accessibility issues.';
    } else if (responseCount < 10) {
      return 'Moderate engagement provides some real-time insights.';
    } else {
      return 'Good engagement level for real-time feedback collection.';
    }
  }

  private basicSentimentAnalysis(responses: any[]): {
    description: string;
    recommendations: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Very basic sentiment analysis based on response patterns
    const textResponses = responses
      .filter((r) => r.response_text || typeof r.response_value === 'string')
      .map((r) => (r.response_text || r.response_value).toLowerCase());

    if (textResponses.length === 0) {
      return {
        description: 'Limited text data for sentiment analysis.',
        recommendations: ['Encourage more detailed feedback'],
        priority: 'low',
      };
    }

    const positiveIndicators = textResponses.filter(
      (text) =>
        text.includes('good') ||
        text.includes('great') ||
        text.includes('positive') ||
        text.includes('happy')
    ).length;

    const negativeIndicators = textResponses.filter(
      (text) =>
        text.includes('bad') ||
        text.includes('poor') ||
        text.includes('negative') ||
        text.includes('unhappy')
    ).length;

    if (positiveIndicators > negativeIndicators) {
      return {
        description:
          'Generally positive sentiment detected in session responses.',
        recommendations: [
          'Capitalize on positive momentum',
          'Share positive feedback with team',
          'Continue current practices',
        ],
        priority: 'low',
      };
    } else if (negativeIndicators > positiveIndicators) {
      return {
        description: 'Some negative sentiment detected requiring attention.',
        recommendations: [
          'Address concerns immediately',
          'Follow up with participants',
          'Develop improvement action plan',
        ],
        priority: 'high',
      };
    } else {
      return {
        description: 'Mixed sentiment detected in session responses.',
        recommendations: [
          'Investigate specific concerns',
          'Balance addressing issues with building positives',
          'Seek clarification from participants',
        ],
        priority: 'medium',
      };
    }
  }

  private getMicroclimateStatus(responseCount: number): string {
    if (responseCount < 3) {
      return 'limited engagement requiring follow-up';
    } else if (responseCount < 10) {
      return 'moderate engagement with actionable insights';
    } else {
      return 'strong engagement with valuable real-time feedback';
    }
  }

  private generateBasicRecommendations(
    insights: FallbackInsight[],
    responseCount: number,
    survey: ISurvey
  ): string[] {
    const recommendations: string[] = [];

    // Response rate recommendations
    if (responseCount < 10) {
      recommendations.push(
        'Improve survey participation through better communication and accessibility'
      );
    }

    // Priority-based recommendations
    const criticalInsights = insights.filter((i) => i.priority === 'critical');
    const highInsights = insights.filter((i) => i.priority === 'high');

    if (criticalInsights.length > 0) {
      recommendations.push(
        'Address critical issues identified in the analysis immediately'
      );
    }

    if (highInsights.length > 0) {
      recommendations.push(
        'Develop action plans for high-priority areas within the next week'
      );
    }

    // General recommendations
    recommendations.push(
      'Schedule follow-up analysis when AI services are available for deeper insights'
    );
    recommendations.push(
      'Consider conducting additional targeted surveys based on initial findings'
    );
    recommendations.push(
      'Share results with relevant stakeholders and gather their input'
    );

    return recommendations;
  }

  private generateSummary(
    insights: FallbackInsight[],
    responseCount: number
  ): string {
    const criticalCount = insights.filter(
      (i) => i.priority === 'critical'
    ).length;
    const highCount = insights.filter((i) => i.priority === 'high').length;

    let summary = `Analysis of ${responseCount} responses identified ${insights.length} key insights. `;

    if (criticalCount > 0) {
      summary += `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} require immediate attention. `;
    }

    if (highCount > 0) {
      summary += `${highCount} high-priority area${highCount > 1 ? 's' : ''} need focused action. `;
    }

    summary +=
      'This basic analysis provides initial guidance while full AI analysis is unavailable.';

    return summary;
  }

  public isAIServiceAvailable(): boolean {
    // This would check the actual AI service status
    // For now, we'll simulate based on circuit breaker or health check
    return false; // Simulating AI service unavailable for fallback testing
  }

  public async healthCheck(): Promise<{
    available: boolean;
    fallback_ready: boolean;
  }> {
    return {
      available: this.isAIServiceAvailable(),
      fallback_ready: true,
    };
  }
}

export default AIFallbackService;
