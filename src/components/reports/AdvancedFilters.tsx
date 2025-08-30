'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  Plus,
  X,
  Calendar,
  Users,
  Building,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
  type?: string;
  category?: string;
  value?: string;
  label?: string;
  field?: string;
  values?: string[];
  count?: number;
}

interface AdvancedFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  filterOptions: {
    surveys?: FilterOption[];
    departments?: FilterOption[];
    survey_types?: FilterOption[];
    demographic_fields?: FilterOption[];
    benchmarks?: FilterOption[];
    date_ranges?: any[];
    chart_types?: FilterOption[];
    statistics?: any;
  };
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  filterOptions,
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    timeFilter: true,
    surveyFilter: false,
    departmentFilter: false,
    demographicFilter: false,
    benchmarkFilter: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleTimeFilterChange = (
    field: 'start_date' | 'end_date',
    value: string
  ) => {
    onFiltersChange({
      ...filters,
      time_filter: {
        ...filters.time_filter,
        [field]: new Date(value),
      },
    });
  };

  const handleQuickDateRange = (range: any) => {
    onFiltersChange({
      ...filters,
      time_filter: {
        start_date: range.start_date,
        end_date: range.end_date,
      },
    });
  };

  const handleSurveyTypeToggle = (surveyType: string) => {
    const currentTypes = filters.survey_types || [];
    const newTypes = currentTypes.includes(surveyType)
      ? currentTypes.filter((type: string) => type !== surveyType)
      : [...currentTypes, surveyType];

    onFiltersChange({
      ...filters,
      survey_types: newTypes,
    });
  };

  const handleSurveyToggle = (surveyId: string) => {
    const currentSurveys = filters.survey_ids || [];
    const newSurveys = currentSurveys.includes(surveyId)
      ? currentSurveys.filter((id: string) => id !== surveyId)
      : [...currentSurveys, surveyId];

    onFiltersChange({
      ...filters,
      survey_ids: newSurveys,
    });
  };

  const handleDepartmentToggle = (departmentId: string) => {
    const currentDepartments = filters.department_filter?.department_ids || [];
    const newDepartments = currentDepartments.includes(departmentId)
      ? currentDepartments.filter((id: string) => id !== departmentId)
      : [...currentDepartments, departmentId];

    onFiltersChange({
      ...filters,
      department_filter: {
        ...filters.department_filter,
        department_ids: newDepartments,
      },
    });
  };

  const addDemographicFilter = () => {
    onFiltersChange({
      ...filters,
      demographic_filters: [
        ...(filters.demographic_filters || []),
        { field: '', values: [] },
      ],
    });
  };

  const updateDemographicFilter = (
    index: number,
    field: string,
    values: string[]
  ) => {
    const newFilters = [...(filters.demographic_filters || [])];
    newFilters[index] = { field, values };
    onFiltersChange({
      ...filters,
      demographic_filters: newFilters,
    });
  };

  const removeDemographicFilter = (index: number) => {
    onFiltersChange({
      ...filters,
      demographic_filters: filters.demographic_filters?.filter(
        (_: any, i: number) => i !== index
      ),
    });
  };

  const handleBenchmarkToggle = (benchmarkId: string) => {
    const currentBenchmarks = filters.benchmark_ids || [];
    const newBenchmarks = currentBenchmarks.includes(benchmarkId)
      ? currentBenchmarks.filter((id: string) => id !== benchmarkId)
      : [...currentBenchmarks, benchmarkId];

    onFiltersChange({
      ...filters,
      benchmark_ids: newBenchmarks,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.time_filter) count++;
    if (filters.survey_types?.length) count++;
    if (filters.survey_ids?.length) count++;
    if (filters.department_filter?.department_ids?.length) count++;
    if (filters.demographic_filters?.length) count++;
    if (filters.benchmark_ids?.length) count++;
    return count;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="font-semibold">Advanced Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </div>
        {getActiveFilterCount() > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Statistics Summary */}
      {filterOptions.statistics && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {filterOptions.statistics.total_responses.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Total Responses</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {filterOptions.statistics.unique_users.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Unique Users</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {filterOptions.departments?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Departments</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Time Filter */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('timeFilter')}
          >
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium">Date Range</span>
              {filters.time_filter && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </div>
            {expandedSections.timeFilter ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.timeFilter && (
            <div className="ml-6 space-y-3">
              {/* Quick Date Ranges */}
              {filterOptions.date_ranges && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quick Ranges
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.date_ranges.map((range, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDateRange(range)}
                        className="text-xs"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={
                        filters.time_filter?.start_date
                          ?.toISOString()
                          .split('T')[0] || ''
                      }
                      onChange={(e) =>
                        handleTimeFilterChange('start_date', e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={
                        filters.time_filter?.end_date
                          ?.toISOString()
                          .split('T')[0] || ''
                      }
                      onChange={(e) =>
                        handleTimeFilterChange('end_date', e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Survey Filter */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('surveyFilter')}
          >
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="font-medium">Surveys</span>
              {(filters.survey_types?.length || filters.survey_ids?.length) && (
                <Badge variant="secondary" className="ml-2">
                  {(filters.survey_types?.length || 0) +
                    (filters.survey_ids?.length || 0)}{' '}
                  selected
                </Badge>
              )}
            </div>
            {expandedSections.surveyFilter ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.surveyFilter && (
            <div className="ml-6 space-y-3">
              {/* Survey Types */}
              {filterOptions.survey_types && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Survey Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.survey_types.map((type) => (
                      <Button
                        key={type.value}
                        variant={
                          filters.survey_types?.includes(type.value)
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => handleSurveyTypeToggle(type.value)}
                        className="text-xs"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Surveys */}
              {filterOptions.surveys && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Specific Surveys
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filterOptions.surveys.map((survey) => (
                      <label
                        key={survey.id}
                        className="flex items-center text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={
                            filters.survey_ids?.includes(survey.id) || false
                          }
                          onChange={() => handleSurveyToggle(survey.id)}
                          className="mr-2"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{survey.name}</div>
                          <div className="text-xs text-gray-500">
                            {survey.type}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Department Filter */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('departmentFilter')}
          >
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              <span className="font-medium">Departments</span>
              {filters.department_filter?.department_ids?.length && (
                <Badge variant="secondary" className="ml-2">
                  {filters.department_filter.department_ids.length} selected
                </Badge>
              )}
            </div>
            {expandedSections.departmentFilter ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.departmentFilter && (
            <div className="ml-6">
              {filterOptions.departments && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filterOptions.departments.map((dept) => (
                    <label key={dept.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={
                          filters.department_filter?.department_ids?.includes(
                            dept.id
                          ) || false
                        }
                        onChange={() => handleDepartmentToggle(dept.id)}
                        className="mr-2"
                      />
                      <span>{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <label className="flex items-center mt-2 text-sm">
                <input
                  type="checkbox"
                  checked={
                    filters.department_filter?.include_subdepartments || false
                  }
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      department_filter: {
                        ...filters.department_filter,
                        include_subdepartments: e.target.checked,
                      },
                    })
                  }
                  className="mr-2"
                />
                <span>Include subdepartments</span>
              </label>
            </div>
          )}
        </div>

        {/* Demographic Filter */}
        <div>
          <div
            className="flex items-center justify-between cursor-pointer py-2"
            onClick={() => toggleSection('demographicFilter')}
          >
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">Demographics</span>
              {filters.demographic_filters?.length && (
                <Badge variant="secondary" className="ml-2">
                  {filters.demographic_filters.length} filters
                </Badge>
              )}
            </div>
            {expandedSections.demographicFilter ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>

          {expandedSections.demographicFilter && (
            <div className="ml-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Demographic Filters</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDemographicFilter}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Filter
                </Button>
              </div>

              {filters.demographic_filters?.map(
                (filter: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateDemographicFilter(
                          index,
                          e.target.value,
                          filter.values
                        )
                      }
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select field</option>
                      {filterOptions.demographic_fields?.map((field) => (
                        <option key={field.field} value={field.field}>
                          {field.label} ({field.count} responses)
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDemographicFilter(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Benchmark Filter */}
        {filterOptions.benchmarks && (
          <div>
            <div
              className="flex items-center justify-between cursor-pointer py-2"
              onClick={() => toggleSection('benchmarkFilter')}
            >
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="font-medium">Benchmarks</span>
                {filters.benchmark_ids?.length && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.benchmark_ids.length} selected
                  </Badge>
                )}
              </div>
              {expandedSections.benchmarkFilter ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>

            {expandedSections.benchmarkFilter && (
              <div className="ml-6">
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filterOptions.benchmarks.map((benchmark) => (
                    <label
                      key={benchmark.id}
                      className="flex items-center text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.benchmark_ids?.includes(benchmark.id) || false
                        }
                        onChange={() => handleBenchmarkToggle(benchmark.id)}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{benchmark.name}</div>
                        <div className="text-xs text-gray-500">
                          {benchmark.type} - {benchmark.category}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
