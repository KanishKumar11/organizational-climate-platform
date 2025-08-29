'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Target } from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  measurement_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

interface KPIEditorProps {
  kpis: KPI[];
  onChange: (kpis: KPI[]) => void;
}

export function KPIEditor({ kpis, onChange }: KPIEditorProps) {
  const [editingKPI, setEditingKPI] = useState<string | null>(null);

  const addKPI = () => {
    const newKPI: KPI = {
      id: crypto.randomUUID(),
      name: '',
      target_value: 0,
      current_value: 0,
      unit: '',
      measurement_frequency: 'monthly',
    };
    onChange([...kpis, newKPI]);
    setEditingKPI(newKPI.id);
  };

  const updateKPI = (id: string, updates: Partial<KPI>) => {
    onChange(kpis.map((kpi) => (kpi.id === id ? { ...kpi, ...updates } : kpi)));
  };

  const removeKPI = (id: string) => {
    onChange(kpis.filter((kpi) => kpi.id !== id));
    if (editingKPI === id) {
      setEditingKPI(null);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Target className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-900">
                    {kpi.name || 'New KPI'}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingKPI(editingKPI === kpi.id ? null : kpi.id)
                    }
                  >
                    {editingKPI === kpi.id ? 'Done' : 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKPI(kpi.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {editingKPI === kpi.id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="KPI Name" required>
                    <Input
                      value={kpi.name}
                      onChange={(e) =>
                        updateKPI(kpi.id, { name: e.target.value })
                      }
                      placeholder="e.g., Employee Satisfaction Score"
                    />
                  </FormField>

                  <FormField label="Unit">
                    <Input
                      value={kpi.unit}
                      onChange={(e) =>
                        updateKPI(kpi.id, { unit: e.target.value })
                      }
                      placeholder="e.g., %, points, hours"
                    />
                  </FormField>

                  <FormField label="Target Value" required>
                    <Input
                      type="number"
                      value={kpi.target_value}
                      onChange={(e) =>
                        updateKPI(kpi.id, {
                          target_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField label="Current Value">
                    <Input
                      type="number"
                      value={kpi.current_value}
                      onChange={(e) =>
                        updateKPI(kpi.id, {
                          current_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                      step="0.01"
                    />
                  </FormField>

                  <FormField
                    label="Measurement Frequency"
                    className="md:col-span-2"
                  >
                    <select
                      value={kpi.measurement_frequency}
                      onChange={(e) =>
                        updateKPI(kpi.id, {
                          measurement_frequency: e.target
                            .value as KPI['measurement_frequency'],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {frequencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Target:</span>
                    <p className="font-medium">
                      {kpi.target_value} {kpi.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Current:</span>
                    <p className="font-medium">
                      {kpi.current_value} {kpi.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <p className="font-medium">
                      {kpi.target_value > 0
                        ? Math.round(
                            (kpi.current_value / kpi.target_value) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <p className="font-medium capitalize">
                      {kpi.measurement_frequency}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {!editingKPI || editingKPI !== kpi.id ? (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {kpi.target_value > 0
                        ? Math.round(
                            (kpi.current_value / kpi.target_value) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          kpi.target_value > 0
                            ? (kpi.current_value / kpi.target_value) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        type="button"
        variant="outline"
        onClick={addKPI}
        className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add KPI
      </Button>

      {kpis.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No KPIs defined yet</p>
          <p className="text-sm">Add measurable goals to track progress</p>
        </div>
      )}
    </div>
  );
}
