'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AnimatedBarChart from '@/components/charts/AnimatedBarChart';
import AnimatedPieChart from '@/components/charts/AnimatedPieChart';
import HeatMap from '@/components/charts/HeatMap';
import { Download, Users, Clock, TrendingUp, Eye } from 'lucide-react';

interface SurveyResultsProps {
  surveyId: string;
}

interface SurveyResults {
  survey: {
    id: string;
    title: string;
    type: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  statistics: {
    total_responses: number;
    response_rate: number | null;
    completion_rate: number;
    target_audience: number | null;
  };
  question_analytics: QuestionAnalytics[];
  demographic_breakdowns: DemographicBreakdown[] | null;
  completion_time_stats: TimeStats | null;
  response_timeline: TimelineData[];
  generated_at: string;
}

interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: string;
  response_count: number;
  response_rate: number;
  average?: number;
  distribution?: DistributionItem[];
  ranking_averages?: RankingItem[];
  text_responses?: string[];
  text_response_count?: number;
}

interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

interface RankingItem {
  option: string;
  average_rank: number;
  response_count: number;
}

interface DemographicBreakdown {
  group: string;
  count: number;
  percentage: number;
  question_averages: {
    question_id: string;
    question_text: string;
    average: number | null;
    response_count: number;
  }[];
}

interface TimeStats {
  average_seconds: number;
  median_seconds: number;
  min_seconds: number;
  max_seconds: number;
}

interface TimelineData {
  date: string;
  count: number;
}

export default function SurveyResults({ surveyId }: SurveyResultsProps) {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemographic] = useState<string | null>(null);
  const [showOpenText, setShowOpenText] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDemographic)
        params.append('demographic', selectedDemographic);
      if (showOpenText) params.append('include_open_text', 'true');

      const response = await fetch(
        `/api/surveys/${surveyId}/results?${params}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [surveyId, selectedDemographic, showOpenText]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.append('format', format);
      if (showOpenText) params.append('include_open_text', 'true');

      const response = await fetch(`/api/surveys/${surveyId}/export?${params}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading results: {error}</p>
          <Button onClick={fetchResults} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>No results available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {results.survey.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(results.survey.status)}>
              {results.survey.status}
            </Badge>
            <span className="text-sm text-gray-600">
              {new Date(results.survey.start_date).toLocaleDateString()} -{' '}
              {new Date(results.survey.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowOpenText(!showOpenText)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showOpenText ? 'Hide' : 'Show'} Open Text
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </motion.div>

      {/* Statistics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.statistics.total_responses}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.statistics.response_rate
                  ? `${results.statistics.response_rate.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.statistics.completion_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        {results.completion_time_stats && (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(
                    Math.round(results.completion_time_stats.average_seconds)
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Response Timeline */}
      {results.response_timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Response Timeline</h3>
            <AnimatedBarChart
              data={results.response_timeline.map((item) => ({
                name: new Date(item.date).toLocaleDateString(),
                value: item.count,
              }))}
              height={300}
              color="#3B82F6"
            />
          </Card>
        </motion.div>
      )}

      {/* Question Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-900">
          Question Analytics
        </h2>

        {results.question_analytics.map((question, index) => (
          <Card key={question.question_id} className="p-6">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {question.question_text}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Type: {question.question_type}</span>
                <span>Responses: {question.response_count}</span>
                <span>Response Rate: {question.response_rate.toFixed(1)}%</span>
                {question.average && (
                  <span>Average: {question.average.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Render different visualizations based on question type */}
            {question.distribution && (
              <div className="mt-4">
                {question.question_type === 'multiple_choice' ||
                question.question_type === 'yes_no' ? (
                  <AnimatedPieChart
                    data={question.distribution.map((item) => ({
                      name: item.label,
                      value: item.count,
                    }))}
                    height={300}
                    showLegend={true}
                  />
                ) : (
                  <AnimatedBarChart
                    data={question.distribution.map((item) => ({
                      name: item.label,
                      value: item.count,
                    }))}
                    height={300}
                    color="#10B981"
                  />
                )}
              </div>
            )}

            {question.ranking_averages && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Average Rankings</h5>
                <AnimatedBarChart
                  data={question.ranking_averages.map((item) => ({
                    name: item.option,
                    value: item.average_rank,
                  }))}
                  height={300}
                  color="#8B5CF6"
                />
              </div>
            )}

            {question.text_responses && showOpenText && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">
                  Text Responses ({question.text_response_count})
                </h5>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {question.text_responses.slice(0, 10).map((response, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      {response}
                    </div>
                  ))}
                  {question.text_responses.length > 10 && (
                    <p className="text-sm text-gray-600 italic">
                      And {question.text_responses.length - 10} more
                      responses...
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </motion.div>

      {/* Demographic Breakdowns */}
      {results.demographic_breakdowns && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demographic Analysis</h3>

            {/* Demographic distribution */}
            <div className="mb-6">
              <AnimatedPieChart
                data={results.demographic_breakdowns.map((item) => ({
                  name: item.group,
                  value: item.count,
                }))}
                title="Response Distribution by Demographics"
                height={300}
                showLegend={true}
              />
            </div>

            {/* Heatmap for question averages by demographic */}
            {results.demographic_breakdowns.length > 0 &&
              results.demographic_breakdowns[0].question_averages.length >
                0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-4">
                    Question Averages by Demographic Group
                  </h4>
                  <HeatMap
                    data={results.demographic_breakdowns.flatMap((group) =>
                      group.question_averages
                        .filter((qa) => qa.average !== null)
                        .map((qa) => ({
                          x: group.group,
                          y: qa.question_text.substring(0, 30) + '...',
                          value: qa.average!,
                        }))
                    )}
                    height={400}
                  />
                </div>
              )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
