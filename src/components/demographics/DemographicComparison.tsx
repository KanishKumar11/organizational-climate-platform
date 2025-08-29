'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  UserCheck,
  AlertTriangle,
  Info,
  ArrowRight,
} from 'lucide-react';
import {
  IDemographicSnapshot,
  DemographicChange,
} from '../../models/DemographicSnapshot';

interface DemographicImpactAnalysis {
  affected_users: number;
  affected_departments: string[];
  affected_roles: string[];
  changes_summary: {
    additions: number;
    modifications: number;
    removals: number;
  };
  impact_score: number;
}

interface DemographicComparisonResult {
  changes: DemographicChange[];
  impact_analysis: DemographicImpactAnalysis;
  recommendations: string[];
}

interface DemographicComparisonProps {
  surveyId: string;
  snapshots: IDemographicSnapshot[];
  onCompare?: (result: DemographicComparisonResult) => void;
}

export default function DemographicComparison({
  surveyId,
  snapshots,
  onCompare,
}: DemographicComparisonProps) {
  const [selectedSnapshot1, setSelectedSnapshot1] = useState<string>('');
  const [selectedSnapshot2, setSelectedSnapshot2] = useState<string>('');
  const [comparison, setComparison] =
    useState<DemographicComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-select latest two snapshots if available
  useEffect(() => {
    if (snapshots.length >= 2) {
      setSelectedSnapshot1(snapshots[0]._id.toString());
      setSelectedSnapshot2(snapshots[1]._id.toString());
    }
  }, [snapshots]);

  const handleCompare = async () => {
    if (!selectedSnapshot1 || !selectedSnapshot2) {
      setError('Please select two snapshots to compare');
      return;
    }

    if (selectedSnapshot1 === selectedSnapshot2) {
      setError('Please select different snapshots to compare');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/demographics/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshot1_id: selectedSnapshot1,
          snapshot2_id: selectedSnapshot2,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compare snapshots');
      }

      const data = await response.json();
      setComparison(data.data);
      onCompare?.(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to compare snapshots'
      );
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getImpactLabel = (score: number) => {
    if (score >= 70) return 'High Impact';
    if (score >= 40) return 'Medium Impact';
    return 'Low Impact';
  };

  const formatChangeValue = (value: any) => {
    if (value === null) return 'None';
    if (typeof value === 'object') {
      return `${value.department || 'N/A'} - ${value.role || 'N/A'}`;
    }
    return String(value);
  };

  const getChangeIcon = (change: DemographicChange) => {
    if (change.old_value === null)
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change.new_value === null)
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowRight className="h-4 w-4 text-blue-600" />;
  };

  const getChangeType = (change: DemographicChange) => {
    if (change.old_value === null) return 'Addition';
    if (change.new_value === null) return 'Removal';
    return 'Modification';
  };

  const getChangeColor = (change: DemographicChange) => {
    if (change.old_value === null) return 'bg-green-50 border-green-200';
    if (change.new_value === null) return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  };

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demographic Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              At least two demographic snapshots are required for comparison.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demographic Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                First Snapshot
              </label>
              <Select
                value={selectedSnapshot1}
                onValueChange={setSelectedSnapshot1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select first snapshot" />
                </SelectTrigger>
                <SelectContent>
                  {snapshots.map((snapshot) => (
                    <SelectItem
                      key={snapshot._id.toString()}
                      value={snapshot._id.toString()}
                    >
                      Version {snapshot.version} -{' '}
                      {new Date(snapshot.timestamp).toLocaleDateString()}
                      {snapshot.version ===
                        Math.max(...snapshots.map((s) => s.version)) && (
                        <Badge variant="secondary" className="ml-2">
                          Latest
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Second Snapshot
              </label>
              <Select
                value={selectedSnapshot2}
                onValueChange={setSelectedSnapshot2}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second snapshot" />
                </SelectTrigger>
                <SelectContent>
                  {snapshots.map((snapshot) => (
                    <SelectItem
                      key={snapshot._id.toString()}
                      value={snapshot._id.toString()}
                    >
                      Version {snapshot.version} -{' '}
                      {new Date(snapshot.timestamp).toLocaleDateString()}
                      {snapshot.version ===
                        Math.max(...snapshots.map((s) => s.version)) && (
                        <Badge variant="secondary" className="ml-2">
                          Latest
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCompare}
            disabled={loading || !selectedSnapshot1 || !selectedSnapshot2}
            className="w-full"
          >
            {loading ? 'Comparing...' : 'Compare Snapshots'}
          </Button>
        </CardContent>
      </Card>

      {comparison && (
        <div className="space-y-6">
          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Impact Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(comparison.impact_analysis.impact_score)}`}
                  >
                    {getImpactLabel(comparison.impact_analysis.impact_score)}
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {comparison.impact_analysis.impact_score}%
                  </p>
                  <p className="text-sm text-gray-600">Impact Score</p>
                </div>

                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {comparison.impact_analysis.affected_users}
                  </p>
                  <p className="text-sm text-gray-600">Affected Users</p>
                </div>

                <div className="text-center">
                  <Building2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {comparison.impact_analysis.affected_departments.length}
                  </p>
                  <p className="text-sm text-gray-600">Departments</p>
                </div>

                <div className="text-center">
                  <UserCheck className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold">
                    {comparison.impact_analysis.affected_roles.length}
                  </p>
                  <p className="text-sm text-gray-600">Roles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Additions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {comparison.impact_analysis.changes_summary.additions}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Modifications
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {comparison.impact_analysis.changes_summary.modifications}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Removals</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {comparison.impact_analysis.changes_summary.removals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Changes and Recommendations */}
          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="changes">Detailed Changes</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="changes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Change Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparison.changes.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No changes detected between snapshots.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comparison.changes.map((change, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${getChangeColor(change)}`}
                        >
                          <div className="flex items-start gap-3">
                            {getChangeIcon(change)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {getChangeType(change)}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {new Date(change.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="font-medium mb-1">{change.field}</p>
                              {change.reason && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {change.reason}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">From:</span>
                                  <span className="ml-2 font-mono">
                                    {formatChangeValue(change.old_value)}
                                  </span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <div>
                                  <span className="text-gray-500">To:</span>
                                  <span className="ml-2 font-mono">
                                    {formatChangeValue(change.new_value)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparison.recommendations.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No specific recommendations at this time.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comparison.recommendations.map(
                        (recommendation, index) => (
                          <Alert key={index}>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              {recommendation}
                            </AlertDescription>
                          </Alert>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
