'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import GapAnalysisReport from './GapAnalysisReport';

interface Survey {
  _id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  total_responses?: number;
}

interface Benchmark {
  _id: string;
  name: string;
  description: string;
  type: 'internal' | 'industry';
  category: string;
  industry?: string;
  company_size?: string;
  quality_score: number;
  validation_status: string;
  metrics: Array<{
    metric_name: string;
    value: number;
    unit: string;
  }>;
}

interface BenchmarkComparisonProps {
  onClose?: () => void;
}

export default function BenchmarkComparison({
  onClose,
}: BenchmarkComparisonProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [filteredBenchmarks, setFilteredBenchmarks] = useState<Benchmark[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    industry: '',
    search: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [benchmarks, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load surveys
      const surveysResponse = await fetch('/api/surveys');
      if (surveysResponse.ok) {
        const surveysData = await surveysResponse.json();
        setSurveys(
          surveysData.surveys?.filter(
            (s: Survey) => s.status === 'completed'
          ) || []
        );
      }

      // Load benchmarks
      const benchmarksResponse = await fetch(
        '/api/benchmarks?validation_status=validated'
      );
      if (benchmarksResponse.ok) {
        const benchmarksData = await benchmarksResponse.json();
        setBenchmarks(benchmarksData.benchmarks || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = benchmarks;

    if (filters.type) {
      filtered = filtered.filter((b) => b.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter((b) =>
        b.category.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    if (filters.industry) {
      filtered = filtered.filter((b) =>
        b.industry?.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBenchmarks(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompare = () => {
    if (selectedSurvey && selectedBenchmark) {
      setShowReport(true);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (showReport && selectedSurvey && selectedBenchmark) {
    return (
      <GapAnalysisReport
        surveyId={selectedSurvey}
        benchmarkId={selectedBenchmark}
        onClose={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Benchmark Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare your survey results against industry or internal benchmarks
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        )}
      </div>

      {/* Survey Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          1. Select Survey to Compare
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey) => (
            <div
              key={survey._id}
              onClick={() => setSelectedSurvey(survey._id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSurvey === survey._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium">{survey.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="outline">{survey.type}</Badge>
                <span className="text-sm text-gray-500">
                  {survey.total_responses || 0} responses
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(survey.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {surveys.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No completed surveys available for comparison
          </p>
        )}
      </Card>

      {/* Benchmark Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">2. Select Benchmark</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search</Label>
            <Input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search benchmarks..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="industry">Industry</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Input
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Filter by category..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Industry</Label>
            <Input
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              placeholder="Filter by industry..."
            />
          </div>
        </div>

        {/* Benchmark List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBenchmarks.map((benchmark) => (
            <div
              key={benchmark._id}
              onClick={() => setSelectedBenchmark(benchmark._id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedBenchmark === benchmark._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{benchmark.name}</h3>
                <span
                  className={`text-sm font-medium ${getQualityScoreColor(benchmark.quality_score)}`}
                >
                  {benchmark.quality_score}%
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {benchmark.description}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Badge
                    variant={
                      benchmark.type === 'industry' ? 'default' : 'secondary'
                    }
                  >
                    {benchmark.type}
                  </Badge>
                  <Badge variant="outline">{benchmark.category}</Badge>
                </div>
                <span className="text-sm text-gray-500">
                  {benchmark.metrics.length} metrics
                </span>
              </div>

              {benchmark.industry && (
                <p className="text-sm text-gray-500 mt-2">
                  Industry: {benchmark.industry}
                </p>
              )}
            </div>
          ))}
        </div>

        {filteredBenchmarks.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No benchmarks found matching your criteria
          </p>
        )}
      </Card>

      {/* Compare Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleCompare}
          disabled={!selectedSurvey || !selectedBenchmark}
          size="lg"
        >
          Generate Gap Analysis Report
        </Button>
      </div>

      {/* Selection Summary */}
      {(selectedSurvey || selectedBenchmark) && (
        <Card className="p-4 bg-blue-50">
          <h3 className="font-medium mb-2">Selection Summary</h3>
          <div className="space-y-1 text-sm">
            {selectedSurvey && (
              <p>
                <span className="font-medium">Survey:</span>{' '}
                {surveys.find((s) => s._id === selectedSurvey)?.title ||
                  'Selected'}
              </p>
            )}
            {selectedBenchmark && (
              <p>
                <span className="font-medium">Benchmark:</span>{' '}
                {benchmarks.find((b) => b._id === selectedBenchmark)?.name ||
                  'Selected'}
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
