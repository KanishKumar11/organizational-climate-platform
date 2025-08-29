'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';

interface QualitativeObjective {
  id: string;
  description: string;
  success_criteria: string;
  current_status: string;
  completion_percentage: number;
}

interface QualitativeObjectiveEditorProps {
  objectives: QualitativeObjective[];
  onChange: (objectives: QualitativeObjective[]) => void;
}

export function QualitativeObjectiveEditor({
  objectives,
  onChange,
}: QualitativeObjectiveEditorProps) {
  const [editingObjective, setEditingObjective] = useState<string | null>(null);

  const addObjective = () => {
    const newObjective: QualitativeObjective = {
      id: crypto.randomUUID(),
      description: '',
      success_criteria: '',
      current_status: '',
      completion_percentage: 0,
    };
    onChange([...objectives, newObjective]);
    setEditingObjective(newObjective.id);
  };

  const updateObjective = (
    id: string,
    updates: Partial<QualitativeObjective>
  ) => {
    onChange(
      objectives.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const removeObjective = (id: string) => {
    onChange(objectives.filter((obj) => obj.id !== id));
    if (editingObjective === id) {
      setEditingObjective(null);
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-600';
    if (percentage >= 25) return 'bg-orange-600';
    return 'bg-gray-600';
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {objectives.map((objective) => (
          <motion.div
            key={objective.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {objective.completion_percentage >= 100 ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <h4 className="font-medium text-gray-900">
                    {objective.description || 'New Objective'}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${getCompletionColor(objective.completion_percentage)}`}
                  >
                    {objective.completion_percentage}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingObjective(
                        editingObjective === objective.id ? null : objective.id
                      )
                    }
                  >
                    {editingObjective === objective.id ? 'Done' : 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeObjective(objective.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {editingObjective === objective.id ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Objective Description{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      value={objective.description}
                      onChange={(e) =>
                        updateObjective(objective.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe what you want to achieve..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Success Criteria <span className="text-red-500">*</span>
                    </Label>
                    <textarea
                      value={objective.success_criteria}
                      onChange={(e) =>
                        updateObjective(objective.id, {
                          success_criteria: e.target.value,
                        })
                      }
                      placeholder="How will you know when this objective is achieved?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Current Status
                      </Label>
                      <textarea
                        value={objective.current_status}
                        onChange={(e) =>
                          updateObjective(objective.id, {
                            current_status: e.target.value,
                          })
                        }
                        placeholder="Current progress and status..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Completion Percentage
                      </Label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          value={objective.completion_percentage}
                          onChange={(e) =>
                            updateObjective(objective.id, {
                              completion_percentage: Math.max(
                                0,
                                Math.min(100, parseFloat(e.target.value) || 0)
                              ),
                            })
                          }
                          min="0"
                          max="100"
                          placeholder="0"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={objective.completion_percentage}
                          onChange={(e) =>
                            updateObjective(objective.id, {
                              completion_percentage: parseInt(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {objective.success_criteria && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Success Criteria:
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {objective.success_criteria}
                      </p>
                    </div>
                  )}

                  {objective.current_status && (
                    <div>
                      <span className="text-sm text-gray-500">
                        Current Status:
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {objective.current_status}
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{objective.completion_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(objective.completion_percentage)}`}
                        style={{ width: `${objective.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        onClick={addObjective}
        className="w-full border-dashed border-2 border-gray-300 hover:border-green-500 hover:text-green-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Qualitative Objective
      </Button>

      {objectives.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No qualitative objectives defined yet</p>
          <p className="text-sm">
            Add goals that are measured through observation and feedback
          </p>
        </div>
      )}
    </div>
  );
}
