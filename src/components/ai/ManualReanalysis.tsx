'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/Progress';
import {
  Zap,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Lightbulb,
} from 'lucide-react';

interface ReanalysisResult {
  survey_id: string;
  triggered_by: string;
  trigger_reason: string;
  impact_score: number;
  affected_segments: string[];
  new_insights: any[];
  updated_insights: any[];
  processing_time_ms: number;
  incremental: boolean;
}

interface ManualReanalysisProps {
  surveyId: string;
  companyId: string;
  onReanalysisComplete?: (result: ReanalysisResult) => void;
}

export default function ManualReanalysis({
  surveyId,
  companyId,
  onReanalysisComplete,
}: ManualReanalysisProps) {
  const [reason, setReason] = useState('');
  const [incrementalOnly, setIncrementalOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReanalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleTriggerReanalysis = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for triggering re-analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch('/api/ai/reanalysis/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          company_id: companyId,
          reason: reason.trim(),
          incremental_only: incrementalOnly,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger re-analysis');
      }

      const data = await response.json();
      setResult(data.data);
      setProgress(100);
      onReanalysisComplete?.(data.data);

      // Clear form
      setReason('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to trigger re-analysis'
      );
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Manual AI Re-analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Manually trigger AI re-analysis to generate new insights based on
            current demographic data and survey responses. This is useful when
            you want to refresh insights without waiting for automatic triggers.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason for Re-analysis
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., New survey responses received, demographic changes applied, quarterly review"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Incremental Processing</h4>
                <p className="text-sm text-gray-600">
                  Only analyze segments with recent changes for faster
                  processing
                </p>
              </div>
              <Switch
                checked={incrementalOnly}
                onCheckedChange={setIncrementalOnly}
                disabled={loading}
              />
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing re-analysis...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleTriggerReanalysis}
              disabled={loading || !reason.trim()}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : 'Trigger Re-analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Re-analysis Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                AI re-analysis completed successfully in{' '}
                {formatProcessingTime(result.processing_time_ms)}
              </AlertDescription>
            </Alert>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {result.impact_score}%
                </p>
                <p className="text-sm text-gray-600">Impact Score</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Lightbulb className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {result.new_insights.length}
                </p>
                <p className="text-sm text-gray-600">New Insights</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-600">
                  {result.affected_segments.length}
                </p>
                <p className="text-sm text-gray-600">Affected Segments</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {formatProcessingTime(result.processing_time_ms)}
                </p>
                <p className="text-sm text-gray-600">Processing Time</p>
              </div>
            </div>

            {/* Processing Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={result.incremental ? 'default' : 'secondary'}>
                  {result.incremental ? 'Incremental' : 'Full'} Processing
                </Badge>
                <span className="text-sm text-gray-600">
                  Triggered: {result.trigger_reason}
                </span>
              </div>

              {result.affected_segments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Affected Segments</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.affected_segments.map((segment, index) => (
                      <Badge key={index} variant="outline">
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.updated_insights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Updated Insights</h4>
                  <p className="text-sm text-gray-600">
                    {result.updated_insights.length} existing insights were
                    updated or marked as outdated
                  </p>
                </div>
              )}
            </div>

            {/* New Insights Preview */}
            {result.new_insights.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">New Insights Generated</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.new_insights.slice(0, 5).map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {insight.category}
                        </Badge>
                        <Badge
                          variant={
                            insight.priority === 'high'
                              ? 'destructive'
                              : insight.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {insight.description}
                      </p>
                    </div>
                  ))}
                  {result.new_insights.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      And {result.new_insights.length - 5} more insights...
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
