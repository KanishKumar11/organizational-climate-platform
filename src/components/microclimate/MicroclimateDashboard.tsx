'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Play,
  Pause,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';

interface Microclimate {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  scheduling: {
    start_time: string;
    duration_minutes: number;
  };
  targeting: {
    department_ids: string[];
  };
  created_by: {
    name: string;
    email: string;
  };
  created_at: string;
  live_results?: {
    sentiment_score: number;
    engagement_level: 'low' | 'medium' | 'high';
  };
}

interface Department {
  _id: string;
  name: string;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ENGAGEMENT_COLORS = {
  low: 'text-red-600',
  medium: 'text-yellow-600',
  high: 'text-green-600',
};

export default function MicroclimateDashboard() {
  const router = useRouter();
  const [microclimates, setMicroclimates] = useState<Microclimate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMicroclimates();
    fetchDepartments();
  }, [statusFilter, departmentFilter]);

  const fetchMicroclimates = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter !== 'all')
        params.append('department_id', departmentFilter);

      const response = await fetch(`/api/microclimates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMicroclimates(data.microclimates || []);
      }
    } catch (error) {
      console.error('Error fetching microclimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleActivate = async (microclimateId: string) => {
    try {
      const response = await fetch(
        `/api/microclimates/${microclimateId}/activate`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        fetchMicroclimates(); // Refresh the list
        router.push(`/microclimates/${microclimateId}/live`);
      } else {
        const error = await response.json();
        console.error('Error activating microclimate:', error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error activating microclimate:', error);
    }
  };

  const handleDelete = async (microclimateId: string) => {
    if (!confirm('Are you sure you want to delete this microclimate?')) {
      return;
    }

    try {
      const response = await fetch(`/api/microclimates/${microclimateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMicroclimates(); // Refresh the list
      } else {
        const error = await response.json();
        console.error('Error deleting microclimate:', error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error deleting microclimate:', error);
    }
  };

  const filteredMicroclimates = microclimates.filter(
    (microclimate) =>
      microclimate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      microclimate.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => (
    <Badge className={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );

  const getEngagementIndicator = (microclimate: Microclimate) => {
    if (!microclimate.live_results) return null;

    const { engagement_level } = microclimate.live_results;
    return (
      <div
        className={`flex items-center space-x-1 ${ENGAGEMENT_COLORS[engagement_level]}`}
      >
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium capitalize">
          {engagement_level}
        </span>
      </div>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (startTime: string, durationMinutes: number) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();

    if (now < start) {
      const diff = start.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${minutes}m`;
    } else if (now < end) {
      const diff = end.getTime() - now.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m remaining`;
    } else {
      return 'Ended';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Microclimates</h1>
          <p className="text-gray-600">Manage real-time feedback sessions</p>
        </div>
        <Button
          onClick={() => router.push('/microclimates/create')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Microclimate
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search microclimates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </Button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Microclimates Grid */}
      {filteredMicroclimates.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No microclimates found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first microclimate to get started'}
          </p>
          {!searchTerm &&
            statusFilter === 'all' &&
            departmentFilter === 'all' && (
              <Button
                onClick={() => router.push('/microclimates/create')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Microclimate
              </Button>
            )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMicroclimates.map((microclimate) => (
            <motion.div
              key={microclimate._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {microclimate.title}
                    </h3>
                    {microclimate.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {microclimate.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(microclimate.status)}
                    <div className="relative">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Timing Info */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDateTime(microclimate.scheduling.start_time)}
                    </span>
                  </div>

                  {microclimate.status === 'active' && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {getTimeRemaining(
                          microclimate.scheduling.start_time,
                          microclimate.scheduling.duration_minutes
                        )}
                      </span>
                    </div>
                  )}

                  {/* Participation Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {microclimate.response_count}/
                        {microclimate.target_participant_count} responses
                      </span>
                    </div>
                    {microclimate.participation_rate > 0 && (
                      <span className="text-sm font-medium text-green-600">
                        {microclimate.participation_rate}%
                      </span>
                    )}
                  </div>

                  {/* Engagement Level */}
                  {getEngagementIndicator(microclimate)}

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${microclimate.participation_rate}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    {microclimate.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/microclimates/${microclimate._id}/edit`
                            )
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleActivate(microclimate._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Launch
                        </Button>
                      </>
                    )}

                    {microclimate.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/microclimates/${microclimate._id}`)
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleActivate(microclimate._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start Now
                        </Button>
                      </>
                    )}

                    {microclimate.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/microclimates/${microclimate._id}/live`)
                        }
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Live
                      </Button>
                    )}

                    {(microclimate.status === 'completed' ||
                      microclimate.status === 'cancelled') && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/microclimates/${microclimate._id}/results`
                            )
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Results
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(microclimate._id)}
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Creator Info */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created by {microclimate.created_by.name} •{' '}
                    {new Date(microclimate.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
