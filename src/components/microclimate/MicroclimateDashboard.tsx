/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Activity,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { formatUTCDateForDisplay, getUserTimezone } from '@/lib/datetime-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui';

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
  const t = useTranslations('microclimates');
  const common = useTranslations('common');
  const [microclimates, setMicroclimates] = useState<Microclimate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const fetchMicroclimates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter !== 'all')
        params.append('department_id', departmentFilter);

      const response = await fetch(`/api/microclimates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // DEFENSIVE: Ensure microclimates is always an array
        const microclimatesData = data?.microclimates || data || [];
        setMicroclimates(
          Array.isArray(microclimatesData) ? microclimatesData : []
        );
      } else {
        console.error('Failed to fetch microclimates:', response.status);
        setMicroclimates([]); // Fallback to empty array
      }
    } catch (error) {
      console.error('Error fetching microclimates:', error);
      setMicroclimates([]); // Prevent crash - always use array
    } finally {
      setLoading(false);
    }
  }, [statusFilter, departmentFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchMicroclimates();
    fetchDepartments();
  }, [fetchMicroclimates, fetchDepartments]);

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

  const handleAnalytics = (microclimateId: string) => {
    router.push(`/microclimates/${microclimateId}/analytics`);
  };

  const handleMenuAction = (microclimateId: string, action: string) => {
    switch (action) {
      case 'view':
        router.push(`/microclimates/${microclimateId}`);
        break;
      case 'edit':
        router.push(`/microclimates/${microclimateId}/edit`);
        break;
      case 'analytics':
        handleAnalytics(microclimateId);
        break;
      case 'duplicate':
        // TODO: Implement duplicate functionality
        console.log('Duplicate microclimate:', microclimateId);
        break;
      case 'delete':
        handleDelete(microclimateId);
        break;
      default:
        console.log('Unknown action:', action);
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
    // Use the timezone-aware formatting function
    return formatUTCDateForDisplay(dateString, getUserTimezone());
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
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
              <p className="text-teal-100 text-lg">
                {t('manageFeedbackSessions')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/microclimates/analytics')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {common('analytics')}
              </Button>
              <Button
                onClick={() => router.push('/microclimates/create')}
                className="bg-white text-teal-600 hover:bg-teal-50 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('createMicroclimate')}
              </Button>
            </div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('searchMicroclimates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 w-full sm:w-80 text-base border-0 bg-white/80 backdrop-blur shadow-sm focus:shadow-md transition-shadow"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-12 border-gray-200 bg-white/80 backdrop-blur">
                  <SelectValue placeholder={t('allStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatus')}</SelectItem>
                  <SelectItem value="draft">{common('draft')}</SelectItem>
                  <SelectItem value="scheduled">
                    {common('scheduled')}
                  </SelectItem>
                  <SelectItem value="active">{common('active')}</SelectItem>
                  <SelectItem value="completed">
                    {common('completed')}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {common('cancelled')}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-40 h-12 border-gray-200 bg-white/80 backdrop-blur">
                  <SelectValue placeholder={t('allDepartments')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allDepartments')}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Microclimates Grid */}
      {filteredMicroclimates.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Target className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No microclimates found
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {searchTerm ||
              statusFilter !== 'all' ||
              departmentFilter !== 'all'
                ? "Try adjusting your search or filters to find what you're looking for"
                : 'Create your first microclimate to start gathering real-time feedback from your team'}
            </p>
            {!searchTerm &&
              statusFilter === 'all' &&
              departmentFilter === 'all' && (
                <Button
                  onClick={() => router.push('/microclimates/create')}
                  className="bg-teal-600 hover:bg-teal-700 h-12 px-8 shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Microclimate
                </Button>
              )}
          </div>
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
              <Card className="p-6 hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                      {microclimate.title}
                    </h3>
                    {microclimate.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {microclimate.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(microclimate.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-gray-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            handleMenuAction(microclimate._id, 'view')
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleMenuAction(microclimate._id, 'analytics')
                          }
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        {microclimate.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMenuAction(microclimate._id, 'edit')
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleMenuAction(microclimate._id, 'duplicate')
                          }
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {(microclimate.status === 'draft' ||
                          microclimate.status === 'completed') && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMenuAction(microclimate._id, 'delete')
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/microclimates/${microclimate._id}/live`
                            )
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Live
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/microclimates/${microclimate._id}/respond`
                            )
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Respond
                        </Button>
                      </>
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
