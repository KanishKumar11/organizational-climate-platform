'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAI } from '@/hooks/useAI';
import { motion, AnimatePresence } from 'framer-motion';

interface AIInsightsPanelProps {
  responses?: any[];
  context?: {
    department: string;
    role: string;
    tenure: string;
    teamSize: number;
  };
}

export function AIInsightsPanel({
  responses = [],
  context,
}: AIInsightsPanelProps) {
  const { loading, error, analyzeResponses, analyzeSentiment } = useAI();
  const [insights, setInsights] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [themes, setThemes] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!context || responses.length === 0) return;

    // Analyze responses for insights
    const analysisResult = await analyzeResponses(responses, context);
    if (analysisResult) {
      setInsights(analysisResult.insights);
      setThemes(analysisResult.themes);
    }

    // Analyze sentiment for text responses
    const textResponses = responses
      .filter((r) => r.type === 'text' && r.value)
      .map((r) => r.value);

    if (textResponses.length > 0) {
      const sentimentResult = await analyzeSentiment(textResponses);
      if (sentimentResult) {
        setSentimentData(sentimentResult);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !context || responses.length === 0}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">Error: {error}</p>
        </Card>
      )}

      {/* Sentiment Overview */}
      {sentimentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${getSentimentColor(sentimentData.overall.sentiment)}`}
                >
                  {sentimentData.overall.sentiment.toUpperCase()}
                </div>
                <p className="text-sm text-gray-600">Overall Sentiment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {sentimentData.overall.score.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600">Sentiment Score</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {sentimentData.results.length}
                </div>
                <p className="text-sm text-gray-600">Responses Analyzed</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Key Themes */}
      {themes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Key Themes</h3>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Insights */}
      <AnimatePresence>
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(insight.priority)}>
                    {insight.priority.toUpperCase()}
                  </Badge>
                  <Badge className="bg-violet-100 text-violet-800 border-violet-200">
                    {insight.category}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-2">
                {insight.insight}
              </h4>

              {insight.recommendations &&
                insight.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Recommendations:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {insight.recommendations.map(
                        (rec: string, recIndex: number) => (
                          <li key={recIndex} className="text-sm text-gray-600">
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {!loading && insights.length === 0 && responses.length > 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            Click "Generate Insights" to analyze the survey responses with AI
          </p>
        </Card>
      )}
    </div>
  );
}
