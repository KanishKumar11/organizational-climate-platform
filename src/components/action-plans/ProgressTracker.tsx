'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Save,
  History,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  measurement_frequency: string;
}

interface QualitativeObjective {
  id: string;
  description: string;
  success_criteria: string;
  current_status: string;
  completion_percentage: number;
}

interface ProgressUpdate {
  id: string;
  update_date: string;
  kpi_updates: Array<{
    kpi_id: string;
    new_value: number;
    notes?: string;
  }>;
  qualitative_updates: Array<{
    objective_id: string;
    status_update: string;
    completion_percentage: number;
    notes?: string;
  }>;
  overall_notes: string;
  updated_by: {
    name: string;
    email: string;
  };
}

interface ActionPlan {
  _id: string;
  title: string;
  description: string;
  status: string;
  kpis: KPI[];
  qualitative_objectives: QualitativeObjective[];
  progress_updates: ProgressUpdate[];
}

interface ProgressTrackerProps {
  actionPlanId: string;
  onProgressUpdated?: (actionPlan: ActionPlan) => void;
}

export function ProgressTracker({
  actionPlanId,
  onProgressUpdated,
}: ProgressTrackerProps) {
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [kpiUpdates, setKpiUpdates] = useState<
    Record<string, { value: number; notes: string }>
  >({});
  const [qualitativeUpdates, setQualitativeUpdates] = useState<
    Record<
      string,
      {
        status: string;
        percentage: number;
        notes: string;
      }
    >
  >({});
  const [overallNotes, setOverallNotes] = useState('');

  useEffect(() => {
    fetchActionPlan();
  }, [actionPlanId]);

  const fetchActionPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/action-plans/${actionPlanId}/progress`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch action plan');
      }

      const data = await response.json();
      setActionPlan(data.action_plan);

      // Initialize update forms with current values
      const kpiInit: Record<string, { value: number; notes: string }> = {};
      data.action_plan.kpis.forEach((kpi: KPI) => {
        kpiInit[kpi.id] = { value: kpi.current_value, notes: '' };
      });
      setKpiUpdates(kpiInit);

      const qualInit: Record<
        string,
        { status: string; percentage: number; notes: string }
      > = {};
      data.action_plan.qualitative_objectives.forEach(
        (obj: QualitativeObjective) => {
          qualInit[obj.id] = {
            status: obj.current_status,
            percentage: obj.completion_percentage,
            notes: '',
          };
        }
      );
      setQualitativeUpdates(qualInit);
    } catch (error) {
      console.error('Error fetching action plan:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch action plan'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!actionPlan) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare KPI updates (only include changed values)
      const kpiUpdateArray = Object.entries(kpiUpdates)
        .filter(([kpiId, update]) => {
          const originalKpi = actionPlan.kpis.find((k) => k.id === kpiId);
          return originalKpi && originalKpi.current_value !== update.value;
        })
        .map(([kpiId, update]) => ({
          kpi_id: kpiId,
          new_value: update.value,
          notes: update.notes,
        }));

      // Prepare qualitative updates (only include changed values)
      const qualitativeUpdateArray = Object.entries(qualitativeUpdates)
        .filter(([objId, update]) => {
          const originalObj = actionPlan.qualitative_objectives.find(
            (o) => o.id === objId
          );
          return (
            originalObj &&
            (originalObj.current_status !== update.status ||
              originalObj.completion_percentage !== update.percentage)
          );
        })
        .map(([objId, update]) => ({
          objective_id: objId,
          status_update: update.status,
          completion_percentage: update.percentage,
          notes: update.notes,
        }));

      // Only save if there are actual updates
      if (
        kpiUpdateArray.length === 0 &&
        qualitativeUpdateArray.length === 0 &&
        !overallNotes.trim()
      ) {
        setError('No changes to save');
        return;
      }

      const response = await fetch(
        `/api/action-plans/${actionPlanId}/progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kpi_updates: kpiUpdateArray,
            qualitative_updates: qualitativeUpdateArray,
            overall_notes: overallNotes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save progress');
      }

      const data = await response.json();
      setActionPlan(data.action_plan);
      setOverallNotes('');

      // Reset notes but keep values
      const resetKpiUpdates = { ...kpiUpdates };
      Object.keys(resetKpiUpdates).forEach((key) => {
        resetKpiUpdates[key].notes = '';
      });
      setKpiUpdates(resetKpiUpdates);

      const resetQualUpdates = { ...qualitativeUpdates };
      Object.keys(resetQualUpdates).forEach((key) => {
        resetQualUpdates[key].notes = '';
      });
      setQualitativeUpdates(resetQualUpdates);

      onProgressUpdated?.(data.action_plan);
    } catch (error) {
      console.error('Error saving progress:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to save progress'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateKPI = (
    kpiId: string,
    field: 'value' | 'notes',
    value: number | string
  ) => {
    setKpiUpdates((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [field]: value,
      },
    }));
  };

  const updateQualitative = (
    objId: string,
    field: 'status' | 'percentage' | 'notes',
    value: string | number
  ) => {
    setQualitativeUpdates((prev) => ({
      ...prev,
      [objId]: {
        ...prev[objId],
        [field]: value,
      },
    }));
  };

  const calculateKPIProgress = (kpi: KPI, currentValue: number) => {
    return kpi.target_value > 0
      ? Math.min(100, (currentValue / kpi.target_value) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  if (error && !actionPlan) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchActionPlan} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!actionPlan) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {actionPlan.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Track progress and update metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Badge
            variant="outline"
            className={`${
              actionPlan.status === 'completed'
                ? 'border-green-500 text-green-700'
                : actionPlan.status === 'in_progress'
                  ? 'border-blue-500 text-blue-700'
                  : actionPlan.status === 'overdue'
                    ? 'border-red-500 text-red-700'
                    : 'border-gray-500 text-gray-700'
            }`}
          >
            {actionPlan.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* KPI Updates */}
      {actionPlan.kpis.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Target className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Key Performance Indicators
            </h3>
          </div>

          <div className="space-y-4">
            {actionPlan.kpis.map((kpi) => {
              const currentValue =
                kpiUpdates[kpi.id]?.value ?? kpi.current_value;
              const progress = calculateKPIProgress(kpi, currentValue);
              const hasChanged = currentValue !== kpi.current_value;

              return (
                <div
                  key={kpi.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {kpi.name}
                      </h4>
                      <div className="text-sm text-gray-600">
                        Target: {kpi.target_value} {kpi.unit} • Frequency:{' '}
                        {kpi.measurement_frequency}
                      </div>
                    </div>
                    {hasChanged && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        Changed
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <FormField label="Current Value">
                      <Input
                        type="number"
                        value={currentValue}
                        onChange={(e) =>
                          updateKPI(
                            kpi.id,
                            'value',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.01"
                      />
                    </FormField>

                    <FormField label="Notes (Optional)">
                      <Input
                        value={kpiUpdates[kpi.id]?.notes ?? ''}
                        onChange={(e) =>
                          updateKPI(kpi.id, 'notes', e.target.value)
                        }
                        placeholder="Add notes about this update..."
                      />
                    </FormField>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Qualitative Objectives */}
      {actionPlan.qualitative_objectives.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              Qualitative Objectives
            </h3>
          </div>

          <div className="space-y-4">
            {actionPlan.qualitative_objectives.map((objective) => {
              const currentStatus =
                qualitativeUpdates[objective.id]?.status ??
                objective.current_status;
              const currentPercentage =
                qualitativeUpdates[objective.id]?.percentage ??
                objective.completion_percentage;
              const hasChanged =
                currentStatus !== objective.current_status ||
                currentPercentage !== objective.completion_percentage;

              return (
                <div
                  key={objective.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {objective.description}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {objective.success_criteria}
                      </p>
                    </div>
                    {hasChanged && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Changed
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <FormField label="Current Status">
                      <textarea
                        value={currentStatus}
                        onChange={(e) =>
                          updateQualitative(
                            objective.id,
                            'status',
                            e.target.value
                          )
                        }
                        placeholder="Describe the current status..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Completion Percentage">
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={currentPercentage}
                            onChange={(e) =>
                              updateQualitative(
                                objective.id,
                                'percentage',
                                Math.max(
                                  0,
                                  Math.min(100, parseInt(e.target.value) || 0)
                                )
                              )
                            }
                            min="0"
                            max="100"
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentPercentage}
                            onChange={(e) =>
                              updateQualitative(
                                objective.id,
                                'percentage',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </FormField>

                      <FormField label="Notes (Optional)">
                        <Input
                          value={qualitativeUpdates[objective.id]?.notes ?? ''}
                          onChange={(e) =>
                            updateQualitative(
                              objective.id,
                              'notes',
                              e.target.value
                            )
                          }
                          placeholder="Add notes about this update..."
                        />
                      </FormField>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{currentPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            currentPercentage >= 100
                              ? 'bg-green-600'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${currentPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Overall Notes */}
      <Card className="p-6">
        <FormField label="Overall Progress Notes">
          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Add any general notes about progress, challenges, or achievements..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveProgress}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? <Loading size="sm" /> : <Save className="w-4 h-4 mr-2" />}
          Save Progress Update
        </Button>
      </div>

      {/* Progress History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Progress History
              </h3>

              {actionPlan.progress_updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No progress updates yet</p>
                  <p className="text-sm">
                    Updates will appear here as you track progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actionPlan.progress_updates
                    .sort(
                      (a, b) =>
                        new Date(b.update_date).getTime() -
                        new Date(a.update_date).getTime()
                    )
                    .map((update) => (
                      <div
                        key={update.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="font-medium text-gray-900">
                              {new Date(
                                update.update_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-1" />
                            {update.updated_by.name}
                          </div>
                        </div>

                        {update.kpi_updates.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              KPI Updates:
                            </h5>
                            <div className="space-y-1">
                              {update.kpi_updates.map((kpiUpdate, index) => {
                                const kpi = actionPlan.kpis.find(
                                  (k) => k.id === kpiUpdate.kpi_id
                                );
                                return (
                                  <div
                                    key={index}
                                    className="text-sm text-gray-600"
                                  >
                                    <span className="font-medium">
                                      {kpi?.name}:
                                    </span>{' '}
                                    {kpiUpdate.new_value} {kpi?.unit}
                                    {kpiUpdate.notes && (
                                      <span className="text-gray-500">
                                        {' '}
                                        - {kpiUpdate.notes}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {update.qualitative_updates.length > 0 && (
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Objective Updates:
                            </h5>
                            <div className="space-y-1">
                              {update.qualitative_updates.map(
                                (qualUpdate, index) => {
                                  const objective =
                                    actionPlan.qualitative_objectives.find(
                                      (o) => o.id === qualUpdate.objective_id
                                    );
                                  return (
                                    <div
                                      key={index}
                                      className="text-sm text-gray-600"
                                    >
                                      <span className="font-medium">
                                        {objective?.description}:
                                      </span>{' '}
                                      {qualUpdate.completion_percentage}%
                                      {qualUpdate.notes && (
                                        <span className="text-gray-500">
                                          {' '}
                                          - {qualUpdate.notes}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}

                        {update.overall_notes && (
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-sm text-gray-700">
                              {update.overall_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
