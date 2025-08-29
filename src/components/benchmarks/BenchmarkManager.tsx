'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import BenchmarkCreator from './BenchmarkCreator';

interface Benchmark {
  _id: string;
  name: string;
  description: string;
  type: 'internal' | 'industry';
  category: string;
  source: string;
  industry?: string;
  company_size?: string;
  region?: string;
  validation_status: 'pending' | 'validated' | 'rejected';
  quality_score: number;
  metrics: Array<{
    metric_name: string;
    value: number;
    unit: string;
    sample_size?: number;
  }>;
  created_at: string;
  is_active: boolean;
}

interface BenchmarkManagerProps {
  userRole: string;
}

export default function BenchmarkManager({ userRole }: BenchmarkManagerProps) {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [filteredBenchmarks, setFilteredBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    validation_status: '',
    search: '',
  });

  useEffect(() => {
    loadBenchmarks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [benchmarks, filters]);

  const loadBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/benchmarks');

      if (!response.ok) {
        throw new Error('Failed to load benchmarks');
      }

      const data = await response.json();
      setBenchmarks(data.benchmarks || []);
    } catch (error) {
      console.error('Error loading benchmarks:', error);
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

    if (filters.validation_status) {
      filtered = filtered.filter(
        (b) => b.validation_status === filters.validation_status
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.description.toLowerCase().includes(searchLower) ||
          b.source.toLowerCase().includes(searchLower)
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

  const handleValidateBenchmark = async (
    benchmarkId: string,
    status: 'validated' | 'rejected'
  ) => {
    try {
      const response = await fetch('/api/benchmarks/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmark_id: benchmarkId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate benchmark');
      }

      // Reload benchmarks to reflect changes
      await loadBenchmarks();
    } catch (error) {
      console.error('Error validating benchmark:', error);
      alert('Failed to validate benchmark');
    }
  };

  const handleDeleteBenchmark = async (benchmarkId: string) => {
    if (!confirm('Are you sure you want to delete this benchmark?')) {
      return;
    }

    try {
      const response = await fetch(`/api/benchmarks/${benchmarkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete benchmark');
      }

      // Reload benchmarks to reflect changes
      await loadBenchmarks();
    } catch (error) {
      console.error('Error deleting benchmark:', error);
      alert('Failed to delete benchmark');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'validated':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <Loading message="Loading benchmarks..." />;
  }

  if (showCreator) {
    return (
      <BenchmarkCreator
        onBenchmarkCreated={(benchmark) => {
          setBenchmarks((prev) => [benchmark, ...prev]);
          setShowCreator(false);
        }}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Benchmark Management</h1>
        {(userRole === 'super_admin' || userRole === 'company_admin') && (
          <Button onClick={() => setShowCreator(true)}>
            Create New Benchmark
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Input
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search benchmarks..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
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

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Input
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder="Filter by category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.validation_status}
              onChange={(e) =>
                handleFilterChange('validation_status', e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="validated">Validated</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Benchmarks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBenchmarks.map((benchmark) => (
          <Card key={benchmark._id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{benchmark.name}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {benchmark.description}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge
                  variant={getStatusBadgeVariant(benchmark.validation_status)}
                >
                  {benchmark.validation_status}
                </Badge>
                <span
                  className={`text-sm font-medium ${getQualityScoreColor(benchmark.quality_score)}`}
                >
                  Quality: {benchmark.quality_score}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Type:</span>
                <p className="capitalize">{benchmark.type}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Category:
                </span>
                <p>{benchmark.category}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Source:
                </span>
                <p className="text-sm">{benchmark.source}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Metrics:
                </span>
                <p>{benchmark.metrics.length} metrics</p>
              </div>
            </div>

            {benchmark.industry && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">
                  Industry:
                </span>
                <p>{benchmark.industry}</p>
              </div>
            )}

            {/* Sample Metrics */}
            {benchmark.metrics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Sample Metrics:
                </h4>
                <div className="space-y-1">
                  {benchmark.metrics.slice(0, 3).map((metric, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{metric.metric_name}:</span>{' '}
                      {metric.value} {metric.unit}
                      {metric.sample_size && (
                        <span className="text-gray-500 ml-2">
                          (n={metric.sample_size})
                        </span>
                      )}
                    </div>
                  ))}
                  {benchmark.metrics.length > 3 && (
                    <p className="text-sm text-gray-500">
                      +{benchmark.metrics.length - 3} more metrics
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-500">
                Created: {new Date(benchmark.created_at).toLocaleDateString()}
              </span>

              <div className="flex space-x-2">
                {userRole === 'super_admin' &&
                  benchmark.validation_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleValidateBenchmark(benchmark._id, 'validated')
                        }
                        className="text-green-600 hover:text-green-800"
                      >
                        Validate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleValidateBenchmark(benchmark._id, 'rejected')
                        }
                        className="text-red-600 hover:text-red-800"
                      >
                        Reject
                      </Button>
                    </>
                  )}

                {(userRole === 'super_admin' ||
                  userRole === 'company_admin') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBenchmark(benchmark._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBenchmarks.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            No benchmarks found matching your criteria.
          </p>
          {(userRole === 'super_admin' || userRole === 'company_admin') && (
            <Button onClick={() => setShowCreator(true)} className="mt-4">
              Create Your First Benchmark
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
