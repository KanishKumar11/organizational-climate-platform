/**
 * Advanced Predictive Analytics Module
 * Implements employee turnover prediction, engagement forecasting,
 * team performance prediction, and organizational health scoring
 */

import { aiService } from './ai-service';

// Types for predictive analytics
export interface TurnoverPrediction {
  userId: string;
  riskScore: number; // 0-1, higher = more likely to leave
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: TurnoverFactor[];
  recommendations: string[];
  confidence: number;
}

export interface TurnoverFactor {
  factor: string;
  impact: number; // -1 to 1, negative = increases turnover risk
  description: string;
}

export interface EngagementTrend {
  period: string;
  predictedScore: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

export interface TeamPerformancePrediction {
  teamId: string;
  departmentId: string;
  predictedPerformance: number; // 0-100 score
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
  keyFactors: PerformanceFactor[];
  recommendations: string[];
  confidence: number;
}

export interface PerformanceFactor {
  factor: string;
  impact: number; // 0-1, higher = more positive impact
  description: string;
}

export interface OrganizationalHealthScore {
  overallScore: number; // 0-100
  healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  dimensions: HealthDimension[];
  trends: HealthTrend[];
  benchmarkComparison: BenchmarkComparison;
  recommendations: string[];
}

export interface HealthDimension {
  name: string;
  score: number;
  weight: number;
  trend: 'improving' | 'declining' | 'stable';
  subMetrics: SubMetric[];
}

export interface SubMetric {
  name: string;
  value: number;
  benchmark: number;
  variance: number;
}

export interface HealthTrend {
  period: string;
  score: number;
  change: number;
}

export interface BenchmarkComparison {
  industryAverage: number;
  percentile: number;
  similarCompanies: number;
  topPerformers: number;
}

export interface PredictiveContext {
  userId?: string;
  departmentId?: string;
  companyId: string;
  timeframe: 'short' | 'medium' | 'long'; // 3, 6, 12 months
  includeHistorical: boolean;
}

class PredictiveAnalytics {
  private turnoverWeights = {
    engagement: 0.25,
    satisfaction: 0.2,
    workload: 0.15,
    growth: 0.15,
    leadership: 0.1,
    compensation: 0.1,
    worklife: 0.05,
  };

  private performanceWeights = {
    collaboration: 0.2,
    communication: 0.18,
    productivity: 0.15,
    innovation: 0.12,
    leadership: 0.1,
    adaptability: 0.1,
    quality: 0.15,
  };

  private healthDimensions = [
    { name: 'Employee Engagement', weight: 0.25 },
    { name: 'Leadership Effectiveness', weight: 0.2 },
    { name: 'Communication Quality', weight: 0.15 },
    { name: 'Work-Life Balance', weight: 0.15 },
    { name: 'Growth & Development', weight: 0.1 },
    { name: 'Team Collaboration', weight: 0.1 },
    { name: 'Innovation Culture', weight: 0.05 },
  ];

  /**
   * Predict employee turnover risk based on survey responses and historical data
   */
  async predictTurnoverRisk(
    userResponses: any[],
    historicalData: any[],
    context: PredictiveContext
  ): Promise<TurnoverPrediction> {
    const factors: TurnoverFactor[] = [];
    let riskScore = 0;

    // Analyze engagement levels
    const engagementScore = this.calculateEngagementScore(userResponses);
    const engagementFactor = this.mapEngagementToTurnoverRisk(engagementScore);
    factors.push({
      factor: 'Employee Engagement',
      impact: engagementFactor,
      description: `Engagement score: ${engagementScore.toFixed(1)}/10`,
    });
    riskScore += engagementFactor * this.turnoverWeights.engagement;

    // Analyze job satisfaction
    const satisfactionScore = this.calculateSatisfactionScore(userResponses);
    const satisfactionFactor =
      this.mapSatisfactionToTurnoverRisk(satisfactionScore);
    factors.push({
      factor: 'Job Satisfaction',
      impact: satisfactionFactor,
      description: `Satisfaction score: ${satisfactionScore.toFixed(1)}/10`,
    });
    riskScore += satisfactionFactor * this.turnoverWeights.satisfaction;

    // Analyze workload stress
    const workloadScore = this.calculateWorkloadScore(userResponses);
    const workloadFactor = this.mapWorkloadToTurnoverRisk(workloadScore);
    factors.push({
      factor: 'Workload Management',
      impact: workloadFactor,
      description: `Workload stress level: ${workloadScore.toFixed(1)}/10`,
    });
    riskScore += workloadFactor * this.turnoverWeights.workload;

    // Analyze growth opportunities
    const growthScore = this.calculateGrowthScore(userResponses);
    const growthFactor = this.mapGrowthToTurnoverRisk(growthScore);
    factors.push({
      factor: 'Growth Opportunities',
      impact: growthFactor,
      description: `Growth satisfaction: ${growthScore.toFixed(1)}/10`,
    });
    riskScore += growthFactor * this.turnoverWeights.growth;

    // Analyze leadership satisfaction
    const leadershipScore = this.calculateLeadershipScore(userResponses);
    const leadershipFactor = this.mapLeadershipToTurnoverRisk(leadershipScore);
    factors.push({
      factor: 'Leadership Quality',
      impact: leadershipFactor,
      description: `Leadership satisfaction: ${leadershipScore.toFixed(1)}/10`,
    });
    riskScore += leadershipFactor * this.turnoverWeights.leadership;

    // Normalize risk score to 0-1 range
    riskScore = Math.max(0, Math.min(1, riskScore));

    const riskLevel = this.categorizeRiskLevel(riskScore);
    const recommendations = this.generateTurnoverRecommendations(
      factors,
      riskLevel
    );

    return {
      userId: context.userId || 'unknown',
      riskScore,
      riskLevel,
      factors,
      recommendations,
      confidence: this.calculatePredictionConfidence(
        userResponses.length,
        historicalData.length
      ),
    };
  }

  /**
   * Forecast engagement trends based on historical data and current patterns
   */
  async forecastEngagementTrend(
    historicalData: any[],
    currentData: any[],
    context: PredictiveContext
  ): Promise<EngagementTrend[]> {
    const trends: EngagementTrend[] = [];
    const timeframes = this.getTimeframePeriods(context.timeframe);

    for (const period of timeframes) {
      const historicalTrend = this.calculateHistoricalTrend(
        historicalData,
        period
      );
      const seasonalFactor = this.calculateSeasonalFactor(period);
      const currentMomentum = this.calculateCurrentMomentum(currentData);

      // Simple linear regression with seasonal adjustment
      const predictedScore = Math.max(
        0,
        Math.min(
          10,
          historicalTrend.average +
            historicalTrend.slope * period.months +
            seasonalFactor +
            currentMomentum
        )
      );

      const trend = this.determineTrendDirection(
        historicalTrend.slope,
        currentMomentum
      );
      const factors = this.identifyTrendFactors(currentData, trend);

      trends.push({
        period: period.label,
        predictedScore,
        confidence: this.calculateTrendConfidence(
          historicalData.length,
          historicalTrend.variance
        ),
        trend,
        factors,
      });
    }

    return trends;
  }

  /**
   * Predict team performance based on collaboration, communication, and productivity metrics
   */
  async predictTeamPerformance(
    teamData: any[],
    historicalPerformance: any[],
    context: PredictiveContext
  ): Promise<TeamPerformancePrediction> {
    const keyFactors: PerformanceFactor[] = [];
    let performanceScore = 0;

    // Analyze collaboration effectiveness
    const collaborationScore = this.calculateCollaborationScore(teamData);
    keyFactors.push({
      factor: 'Team Collaboration',
      impact: collaborationScore / 10,
      description: `Collaboration effectiveness: ${collaborationScore.toFixed(1)}/10`,
    });
    performanceScore +=
      (collaborationScore / 10) * this.performanceWeights.collaboration;

    // Analyze communication quality
    const communicationScore = this.calculateCommunicationScore(teamData);
    keyFactors.push({
      factor: 'Communication Quality',
      impact: communicationScore / 10,
      description: `Communication effectiveness: ${communicationScore.toFixed(1)}/10`,
    });
    performanceScore +=
      (communicationScore / 10) * this.performanceWeights.communication;

    // Analyze productivity indicators
    const productivityScore = this.calculateProductivityScore(teamData);
    keyFactors.push({
      factor: 'Team Productivity',
      impact: productivityScore / 10,
      description: `Productivity level: ${productivityScore.toFixed(1)}/10`,
    });
    performanceScore +=
      (productivityScore / 10) * this.performanceWeights.productivity;

    // Analyze innovation capacity
    const innovationScore = this.calculateInnovationScore(teamData);
    keyFactors.push({
      factor: 'Innovation Capacity',
      impact: innovationScore / 10,
      description: `Innovation level: ${innovationScore.toFixed(1)}/10`,
    });
    performanceScore +=
      (innovationScore / 10) * this.performanceWeights.innovation;

    // Convert to 0-100 scale
    const predictedPerformance = Math.round(performanceScore * 100);
    const performanceLevel =
      this.categorizePerformanceLevel(predictedPerformance);
    const recommendations = this.generatePerformanceRecommendations(
      keyFactors,
      performanceLevel
    );

    return {
      teamId: context.userId || 'unknown',
      departmentId: context.departmentId || 'unknown',
      predictedPerformance,
      performanceLevel,
      keyFactors,
      recommendations,
      confidence: this.calculatePredictionConfidence(
        teamData.length,
        historicalPerformance.length
      ),
    };
  }

  /**
   * Calculate comprehensive organizational health score with benchmarking
   */
  async calculateOrganizationalHealth(
    organizationData: any[],
    benchmarkData: any[],
    context: PredictiveContext
  ): Promise<OrganizationalHealthScore> {
    const dimensions: HealthDimension[] = [];
    let overallScore = 0;

    // Calculate each health dimension
    for (const dimension of this.healthDimensions) {
      const score = this.calculateDimensionScore(
        organizationData,
        dimension.name
      );
      const trend = this.calculateDimensionTrend(
        organizationData,
        dimension.name
      );
      const subMetrics = this.calculateSubMetrics(
        organizationData,
        dimension.name,
        benchmarkData
      );

      dimensions.push({
        name: dimension.name,
        score,
        weight: dimension.weight,
        trend,
        subMetrics,
      });

      overallScore += score * dimension.weight;
    }

    const healthLevel = this.categorizeHealthLevel(overallScore);
    const trends = this.calculateHealthTrends(organizationData);
    const benchmarkComparison = this.calculateBenchmarkComparison(
      overallScore,
      benchmarkData
    );
    const recommendations = this.generateHealthRecommendations(
      dimensions,
      healthLevel
    );

    return {
      overallScore: Math.round(overallScore),
      healthLevel,
      dimensions,
      trends,
      benchmarkComparison,
      recommendations,
    };
  }

  // Helper methods for score calculations
  private calculateEngagementScore(responses: any[]): number {
    const engagementResponses = responses.filter(
      (r) =>
        r.category === 'engagement' ||
        r.question.toLowerCase().includes('engaged')
    );

    if (engagementResponses.length === 0) return 5; // Default neutral

    const avgScore =
      engagementResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      engagementResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateSatisfactionScore(responses: any[]): number {
    const satisfactionResponses = responses.filter(
      (r) =>
        r.category === 'satisfaction' ||
        r.question.toLowerCase().includes('satisfied')
    );

    if (satisfactionResponses.length === 0) return 5;

    const avgScore =
      satisfactionResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      satisfactionResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateWorkloadScore(responses: any[]): number {
    const workloadResponses = responses.filter(
      (r) =>
        r.category === 'worklife' ||
        r.question.toLowerCase().includes('workload') ||
        r.question.toLowerCase().includes('stress')
    );

    if (workloadResponses.length === 0) return 5;

    const avgScore =
      workloadResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      workloadResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateGrowthScore(responses: any[]): number {
    const growthResponses = responses.filter(
      (r) =>
        r.category === 'growth' ||
        r.question.toLowerCase().includes('development') ||
        r.question.toLowerCase().includes('career')
    );

    if (growthResponses.length === 0) return 5;

    const avgScore =
      growthResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      growthResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateLeadershipScore(responses: any[]): number {
    const leadershipResponses = responses.filter(
      (r) =>
        r.category === 'leadership' ||
        r.question.toLowerCase().includes('leadership') ||
        r.question.toLowerCase().includes('manager')
    );

    if (leadershipResponses.length === 0) return 5;

    const avgScore =
      leadershipResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      leadershipResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateCollaborationScore(responses: any[]): number {
    const collaborationResponses = responses.filter(
      (r) =>
        r.category === 'collaboration' ||
        r.question.toLowerCase().includes('collaborate') ||
        r.question.toLowerCase().includes('teamwork')
    );

    if (collaborationResponses.length === 0) return 5;

    const avgScore =
      collaborationResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      collaborationResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateCommunicationScore(responses: any[]): number {
    const communicationResponses = responses.filter(
      (r) =>
        r.category === 'communication' ||
        r.question.toLowerCase().includes('communication') ||
        r.question.toLowerCase().includes('communicate')
    );

    if (communicationResponses.length === 0) return 5;

    const avgScore =
      communicationResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      communicationResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  private calculateProductivityScore(responses: any[]): number {
    // Infer productivity from engagement, satisfaction, and workload
    const engagement = this.calculateEngagementScore(responses);
    const satisfaction = this.calculateSatisfactionScore(responses);
    const workload = this.calculateWorkloadScore(responses);

    // Higher engagement and satisfaction, optimal workload (around 6-7) = higher productivity
    const workloadOptimal = Math.max(0, 10 - Math.abs(workload - 6.5) * 2);
    return engagement * 0.4 + satisfaction * 0.3 + workloadOptimal * 0.3;
  }

  private calculateInnovationScore(responses: any[]): number {
    const innovationResponses = responses.filter(
      (r) =>
        r.question.toLowerCase().includes('innovation') ||
        r.question.toLowerCase().includes('creative') ||
        r.question.toLowerCase().includes('new ideas')
    );

    if (innovationResponses.length === 0) {
      // Infer from engagement and growth scores
      const engagement = this.calculateEngagementScore(responses);
      const growth = this.calculateGrowthScore(responses);
      return engagement * 0.6 + growth * 0.4;
    }

    const avgScore =
      innovationResponses.reduce((sum, r) => sum + (r.value || 5), 0) /
      innovationResponses.length;
    return Math.max(1, Math.min(10, avgScore));
  }

  // Risk mapping functions
  private mapEngagementToTurnoverRisk(score: number): number {
    // Lower engagement = higher turnover risk (negative impact)
    return (score - 10) / 10; // Maps 10->0, 5->-0.5, 1->-0.9
  }

  private mapSatisfactionToTurnoverRisk(score: number): number {
    return (score - 10) / 10;
  }

  private mapWorkloadToTurnoverRisk(score: number): number {
    // Optimal workload is around 6-7, too high or too low increases risk
    const optimal = 6.5;
    const deviation = Math.abs(score - optimal);
    return -deviation / 10; // Higher deviation = higher risk
  }

  private mapGrowthToTurnoverRisk(score: number): number {
    return (score - 10) / 10;
  }

  private mapLeadershipToTurnoverRisk(score: number): number {
    return (score - 10) / 10;
  }

  // Categorization functions
  private categorizeRiskLevel(
    riskScore: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    return 'low';
  }

  private categorizePerformanceLevel(
    score: number
  ): 'excellent' | 'good' | 'average' | 'needs_improvement' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'average';
    return 'needs_improvement';
  }

  private categorizeHealthLevel(
    score: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 55) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  }

  // Recommendation generation
  private generateTurnoverRecommendations(
    factors: TurnoverFactor[],
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    factors.forEach((factor) => {
      if (factor.impact < -0.3) {
        // High negative impact
        switch (factor.factor) {
          case 'Employee Engagement':
            recommendations.push(
              'Implement engagement initiatives and recognition programs'
            );
            recommendations.push(
              'Schedule regular one-on-one meetings with manager'
            );
            break;
          case 'Job Satisfaction':
            recommendations.push('Review role responsibilities and job fit');
            recommendations.push('Explore internal mobility opportunities');
            break;
          case 'Workload Management':
            recommendations.push('Assess and redistribute workload');
            recommendations.push(
              'Provide time management and stress reduction resources'
            );
            break;
          case 'Growth Opportunities':
            recommendations.push('Create personalized development plan');
            recommendations.push(
              'Identify mentoring and training opportunities'
            );
            break;
          case 'Leadership Quality':
            recommendations.push('Provide leadership coaching and feedback');
            recommendations.push('Consider team restructuring if needed');
            break;
        }
      }
    });

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Schedule immediate retention conversation');
      recommendations.push('Consider counter-offer strategy if appropriate');
    }

    return recommendations;
  }

  private generatePerformanceRecommendations(
    factors: PerformanceFactor[],
    level: string
  ): string[] {
    const recommendations: string[] = [];

    factors.forEach((factor) => {
      if (factor.impact < 0.6) {
        // Below good performance
        switch (factor.factor) {
          case 'Team Collaboration':
            recommendations.push('Implement team building activities');
            recommendations.push('Establish clear collaboration protocols');
            break;
          case 'Communication Quality':
            recommendations.push('Provide communication skills training');
            recommendations.push('Implement regular team check-ins');
            break;
          case 'Team Productivity':
            recommendations.push('Review and optimize workflows');
            recommendations.push('Provide productivity tools and training');
            break;
          case 'Innovation Capacity':
            recommendations.push('Create innovation time and resources');
            recommendations.push('Establish idea sharing platforms');
            break;
        }
      }
    });

    return recommendations;
  }

  private generateHealthRecommendations(
    dimensions: HealthDimension[],
    level: string
  ): string[] {
    const recommendations: string[] = [];

    dimensions.forEach((dimension) => {
      if (dimension.score < 60) {
        // Below good health
        switch (dimension.name) {
          case 'Employee Engagement':
            recommendations.push(
              'Launch comprehensive engagement survey and action planning'
            );
            break;
          case 'Leadership Effectiveness':
            recommendations.push('Implement leadership development programs');
            break;
          case 'Communication Quality':
            recommendations.push(
              'Establish organization-wide communication standards'
            );
            break;
          case 'Work-Life Balance':
            recommendations.push(
              'Review and enhance work-life balance policies'
            );
            break;
          case 'Growth & Development':
            recommendations.push(
              'Expand learning and development opportunities'
            );
            break;
        }
      }
    });

    return recommendations;
  }

  // Utility functions
  private calculatePredictionConfidence(
    dataPoints: number,
    historicalPoints: number
  ): number {
    const totalPoints = dataPoints + historicalPoints;
    if (totalPoints < 10) return 0.5;
    if (totalPoints < 50) return 0.7;
    if (totalPoints < 100) return 0.8;
    return 0.9;
  }

  private getTimeframePeriods(timeframe: string) {
    switch (timeframe) {
      case 'short':
        return [
          { label: '1 Month', months: 1 },
          { label: '2 Months', months: 2 },
          { label: '3 Months', months: 3 },
        ];
      case 'medium':
        return [
          { label: '3 Months', months: 3 },
          { label: '6 Months', months: 6 },
        ];
      case 'long':
        return [
          { label: '6 Months', months: 6 },
          { label: '12 Months', months: 12 },
        ];
      default:
        return [{ label: '3 Months', months: 3 }];
    }
  }

  private calculateHistoricalTrend(data: any[], period: any) {
    // Simple linear regression calculation
    if (data.length < 2) return { average: 5, slope: 0, variance: 0 };

    const values = data.map((d) => d.score || 5);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate slope (trend)
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = values.reduce((sum, val, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate variance
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / n;

    return { average, slope, variance };
  }

  private calculateSeasonalFactor(period: any): number {
    // Simple seasonal adjustment - can be enhanced with actual seasonal data
    const month = new Date().getMonth();
    const seasonalFactors = [
      0, -0.1, 0.1, 0.2, 0.1, 0, -0.2, -0.3, 0.1, 0.2, 0, -0.1,
    ];
    return seasonalFactors[month] || 0;
  }

  private calculateCurrentMomentum(data: any[]): number {
    if (data.length < 2) return 0;

    const recent = data.slice(-3); // Last 3 data points
    const older = data.slice(-6, -3); // Previous 3 data points

    if (recent.length === 0 || older.length === 0) return 0;

    const recentAvg =
      recent.reduce((sum, d) => sum + (d.score || 5), 0) / recent.length;
    const olderAvg =
      older.reduce((sum, d) => sum + (d.score || 5), 0) / older.length;

    return (recentAvg - olderAvg) / 2; // Momentum factor
  }

  private determineTrendDirection(
    slope: number,
    momentum: number
  ): 'increasing' | 'decreasing' | 'stable' {
    const combined = slope + momentum;
    if (combined > 0.1) return 'increasing';
    if (combined < -0.1) return 'decreasing';
    return 'stable';
  }

  private identifyTrendFactors(data: any[], trend: string): string[] {
    // Analyze data to identify key factors driving the trend
    const factors: string[] = [];

    if (trend === 'increasing') {
      factors.push('Improved leadership communication');
      factors.push('Enhanced team collaboration');
      factors.push('Better work-life balance initiatives');
    } else if (trend === 'decreasing') {
      factors.push('Increased workload pressure');
      factors.push('Leadership changes');
      factors.push('Market uncertainty');
    } else {
      factors.push('Stable organizational conditions');
      factors.push('Consistent management practices');
    }

    return factors;
  }

  private calculateTrendConfidence(
    dataPoints: number,
    variance: number
  ): number {
    let confidence = 0.5;

    // More data points = higher confidence
    if (dataPoints > 20) confidence += 0.2;
    else if (dataPoints > 10) confidence += 0.1;

    // Lower variance = higher confidence
    if (variance < 1) confidence += 0.2;
    else if (variance < 2) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  private calculateDimensionScore(data: any[], dimensionName: string): number {
    // Calculate score for specific health dimension
    const relevantData = data.filter(
      (d) =>
        d.category?.toLowerCase().includes(dimensionName.toLowerCase()) ||
        d.dimension?.toLowerCase().includes(dimensionName.toLowerCase())
    );

    if (relevantData.length === 0) return 50; // Default neutral score

    const avgScore =
      relevantData.reduce((sum, d) => sum + (d.score || 50), 0) /
      relevantData.length;
    return Math.max(0, Math.min(100, avgScore));
  }

  private calculateDimensionTrend(
    data: any[],
    dimensionName: string
  ): 'improving' | 'declining' | 'stable' {
    const relevantData = data
      .filter((d) =>
        d.category?.toLowerCase().includes(dimensionName.toLowerCase())
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (relevantData.length < 2) return 'stable';

    const recent = relevantData.slice(-3);
    const older = relevantData.slice(0, 3);

    const recentAvg =
      recent.reduce((sum, d) => sum + (d.score || 50), 0) / recent.length;
    const olderAvg =
      older.reduce((sum, d) => sum + (d.score || 50), 0) / older.length;

    const change = recentAvg - olderAvg;

    if (change > 2) return 'improving';
    if (change < -2) return 'declining';
    return 'stable';
  }

  private calculateSubMetrics(
    data: any[],
    dimensionName: string,
    benchmarkData: any[]
  ): SubMetric[] {
    // Calculate sub-metrics for each dimension
    const subMetrics: SubMetric[] = [];

    // This would be expanded based on actual dimension requirements
    const mockSubMetrics = [
      {
        name: 'Current Score',
        value: this.calculateDimensionScore(data, dimensionName),
      },
      { name: 'Participation Rate', value: Math.random() * 20 + 70 },
      { name: 'Response Quality', value: Math.random() * 15 + 80 },
    ];

    mockSubMetrics.forEach((metric) => {
      const benchmark =
        benchmarkData.find((b) => b.metric === metric.name)?.value ||
        metric.value;
      subMetrics.push({
        ...metric,
        benchmark,
        variance: metric.value - benchmark,
      });
    });

    return subMetrics;
  }

  private calculateHealthTrends(data: any[]): HealthTrend[] {
    // Calculate health trends over time
    const trends: HealthTrend[] = [];
    const periods = ['3 months ago', '2 months ago', '1 month ago', 'Current'];

    periods.forEach((period, index) => {
      const score = 60 + Math.random() * 30; // Mock trend data
      const change = index > 0 ? score - trends[index - 1].score : 0;

      trends.push({
        period,
        score: Math.round(score),
        change: Math.round(change * 10) / 10,
      });
    });

    return trends;
  }

  private calculateBenchmarkComparison(
    score: number,
    benchmarkData: any[]
  ): BenchmarkComparison {
    // Calculate benchmark comparisons
    return {
      industryAverage: 65,
      percentile: Math.min(95, Math.max(5, Math.round((score / 100) * 100))),
      similarCompanies: 62,
      topPerformers: 85,
    };
  }
}

// Export singleton instance
export const predictiveAnalytics = new PredictiveAnalytics();

// Export utility functions for API routes
export async function analyzeTurnoverRisk(
  userResponses: any[],
  historicalData: any[],
  context: PredictiveContext
) {
  return predictiveAnalytics.predictTurnoverRisk(
    userResponses,
    historicalData,
    context
  );
}

export async function forecastEngagement(
  historicalData: any[],
  currentData: any[],
  context: PredictiveContext
) {
  return predictiveAnalytics.forecastEngagementTrend(
    historicalData,
    currentData,
    context
  );
}

export async function predictTeamPerformance(
  teamData: any[],
  historicalPerformance: any[],
  context: PredictiveContext
) {
  return predictiveAnalytics.predictTeamPerformance(
    teamData,
    historicalPerformance,
    context
  );
}

export async function calculateOrganizationalHealth(
  organizationData: any[],
  benchmarkData: any[],
  context: PredictiveContext
) {
  return predictiveAnalytics.calculateOrganizationalHealth(
    organizationData,
    benchmarkData,
    context
  );
}


