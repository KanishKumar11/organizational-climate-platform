'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface QuestionRecommendation {
  _id: string;
  text: string;
  type: string;
  category: string;
  subcategory?: string;
  tags: string[];
  metrics: {
    usage_count: number;
    response_rate: number;
    insight_score: number;
  };
  recommendation_reason: string;
  recommendation_score: number;
  strategy: string;
}

interface QuestionRecommendationsProps {
  category?: string;
  surveyType?: string;
  industry?: string;
  companySize?: string;
  department?: string;
  onQuestionSelect?: (question: QuestionRecommendation) => void;
  onAddToSurvey?: (questions: QuestionRecommendation[]) => void;
}

export default function QuestionRecommendations({
  category,
  surveyType,
  industry,
  companySize,
  department,
  onQuestionSelect,
  onAddToSurvey,
}: QuestionRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    QuestionRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [context, setContext] = useState<any>({});

  useEffect(() => {
    fetchRecommendations();
  }, [category, surveyType, industry, companySize, department]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (category) params.append('category', category);
      if (surveyType) params.append('survey_type', surveyType);
      if (industry) params.append('industry', industry);
      if (companySize) params.append('company_size', companySize);
      if (department) params.append('department', department);
      params.append('limit', '15');

      const response = await fetch(
        `/api/question-bank/recommendations?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
        setContext(data.context);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'top_performers':
        return <TrendingUp className="w-4 h-4" />;
      case 'industry_specific':
        return <Target className="w-4 h-4" />;
      case 'survey_type_optimized':
        return <Zap className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'ai_generated':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'top_performers':
        return 'bg-green-100 text-green-800';
      case 'industry_specific':
        return 'bg-blue-100 text-blue-800';
      case 'survey_type_optimized':
        return 'bg-purple-100 text-purple-800';
      case 'trending':
        return 'bg-orange-100 text-orange-800';
      case 'ai_generated':
        return 'bg-violet-100 text-violet-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAddSelected = () => {
    const selectedQuestionObjects = recommendations.filter((q) =>
      selectedQuestions.has(q._id)
    );
    if (onAddToSurvey) {
      onAddToSurvey(selectedQuestionObjects);
    }
    setSelectedQuestions(new Set());
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI Question Recommendations
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Personalized question suggestions based on your context and
            performance data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRecommendations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {selectedQuestions.size > 0 && onAddToSurvey && (
            <Button
              onClick={handleAddSelected}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Selected ({selectedQuestions.size})
            </Button>
          )}
        </div>
      </div>

      {/* Context Display */}
      {Object.keys(context).some((key) => context[key]) && (
        <Card className="p-4 bg-violet-50 border-violet-200">
          <h3 className="font-medium text-violet-900 mb-2">
            Recommendation Context
          </h3>
          <div className="flex flex-wrap gap-2">
            {context.category && (
              <Badge
                variant="outline"
                className="text-violet-700 border-violet-300"
              >
                Category: {context.category}
              </Badge>
            )}
            {context.surveyType && (
              <Badge
                variant="outline"
                className="text-violet-700 border-violet-300"
              >
                Survey Type: {context.surveyType}
              </Badge>
            )}
            {context.industry && (
              <Badge
                variant="outline"
                className="text-violet-700 border-violet-300"
              >
                Industry: {context.industry}
              </Badge>
            )}
            {context.companySize && (
              <Badge
                variant="outline"
                className="text-violet-700 border-violet-300"
              >
                Company Size: {context.companySize}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((question) => (
          <Card
            key={question._id}
            className={`p-6 transition-all cursor-pointer hover:shadow-md ${
              selectedQuestions.has(question._id)
                ? 'ring-2 ring-violet-500 bg-violet-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              if (onQuestionSelect) {
                onQuestionSelect(question);
              } else {
                toggleQuestionSelection(question._id);
              }
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Badge className={getStrategyColor(question.strategy)}>
                  {getStrategyIcon(question.strategy)}
                  <span className="ml-1 capitalize">
                    {question.strategy.replace('_', ' ')}
                  </span>
                </Badge>
                <Badge variant="outline">{question.category}</Badge>
                {question.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {question.subcategory}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${getScoreColor(question.recommendation_score)}`}
                >
                  Score: {question.recommendation_score}
                </span>
                {onAddToSurvey && (
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(question._id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleQuestionSelection(question._id);
                    }}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                )}
              </div>
            </div>

            <p className="text-gray-900 font-medium mb-3">{question.text}</p>

            <div className="bg-violet-50 p-3 rounded-lg mb-3">
              <p className="text-violet-800 text-sm font-medium">
                💡 {question.recommendation_reason}
              </p>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex gap-4">
                <span>Usage: {question.metrics.usage_count}</span>
                <span>Response Rate: {question.metrics.response_rate}%</span>
                <span className={getScoreColor(question.metrics.insight_score)}>
                  Effectiveness: {question.metrics.insight_score.toFixed(1)}/10
                </span>
              </div>
              <div className="flex gap-1">
                {question.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {recommendations.length === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No recommendations available</p>
          <p className="text-gray-400 text-sm">
            Try adjusting your context parameters or add more questions to the
            bank
          </p>
        </Card>
      )}

      {/* Strategy Legend */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">
          Recommendation Strategies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>
              <strong>Top Performers:</strong> High effectiveness in category
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span>
              <strong>Industry Specific:</strong> Optimized for your industry
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <span>
              <strong>Survey Optimized:</strong> Best for survey type
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span>
              <strong>Trending:</strong> Recently high-performing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>
              <strong>AI Generated:</strong> Created for your context
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
