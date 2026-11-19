'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/contexts/TranslationContext';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Play,
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
  CircleAlertIcon,
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
  draft: 'bg-gray-50 text-gray-600 border border-gray-100',
  scheduled: 'bg-blue-50 text-blue-600 border border-blue-100',
  active: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  completed: 'bg-purple-50 text-purple-600 border border-purple-100',
  cancelled: 'bg-red-50 text-red-600 border border-red-100',
};

const ENGAGEMENT_COLORS = {
  low: 'text-red-600 bg-red-50 border border-red-100',
  medium: 'text-amber-600 bg-amber-50 border border-amber-100',
  high: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
};

export default function MicroclimateDashboard() {
  const router = useRouter();
  const t = useTranslations('microclimates');
  const common = useTranslations('common');
  const [microclimates, setMicroclimates] = useState<Microclimate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [microclimateToDelete, setMicroclimateToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const deleteInputId = useId();

  const fetchMicroclimates = useCallback(async () => {
    // Show main loading only on initial load, filter loading for subsequent filter changes
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setFilterLoading(true);
    }

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
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      } else {
        setFilterLoading(false);
      }
    }
  }, [statusFilter, departmentFilter, isInitialLoad]);

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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
        toast.success(t('microclimateActivatedSuccessfully'));
        router.push(`/microclimates/${microclimateId}/live`);
      } else {
        const error = await response.json();
        console.error('Error activating microclimate:', error);

        if (error.error === 'One or more departments not found') {
          toast.error(t('departmentsNotFoundError'), {
            description: t('departmentsNotFoundDescription'),
            duration: 8000,
          });
        } else {
          toast.error(t('failedToActivateMicroclimate'), {
            description:
              error.details || error.error || t('checkConnectionAndTryAgain'),
          });
        }
      }
    } catch (error) {
      console.error('Error activating microclimate:', error);
      toast.error(t('failedToActivateMicroclimate'), {
        description: t('checkConnectionAndTryAgain'),
      });
    }
  };

  const handleDelete = (microclimateId: string, microclimateTitle: string) => {
    setMicroclimateToDelete({ id: microclimateId, title: microclimateTitle });
    setDeleteConfirmationInput('');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!microclimateToDelete) return;

    try {
      const response = await fetch(
        `/api/microclimates/${microclimateToDelete.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        fetchMicroclimates(); // Refresh the list
        setDeleteDialogOpen(false);
        setMicroclimateToDelete(null);
        setDeleteConfirmationInput('');
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

  const handleMenuAction = (
    microclimateId: string,
    action: string,
    microclimateTitle?: string
  ) => {
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
        handleDelete(microclimateId, microclimateTitle || 'Unknown');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const filteredMicroclimates = microclimates.filter(
    (microclimate) =>
      microclimate.title
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      microclimate.description
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${ENGAGEMENT_COLORS[engagement_level]}`}
      >
        <TrendingUp className="w-3 h-3" />
        <span className="capitalize">{engagement_level} engagement</span>
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

  if (loading && isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-emerald-50/30">
      {/* Modern Clean Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('dashboardTitle')}</h1>
              <p className="text-emerald-100 text-lg">
                {t('manageFeedbackSessions')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/microclimates/analytics')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {common('analytics')}
              </Button>
              <Button
                onClick={() => router.push('/microclimates/create')}
                className="bg-white text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('createMicroclimate')}
              </Button>
            </div>
          </div>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Clean Search and Filters */}
      <Card className="!border-none shadow-none bg-white/70 backdrop-blur-sm rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('searchMicroclimates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 w-full sm:w-[500px] text-base !border-none bg-white/90 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all duration-200 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-3">
              {filterLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-emerald-500 rounded-full" />
              ) : (
                <Filter className="w-5 h-5 text-gray-500" />
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-12 border !border-gray-300 bg-white focus:border-emerald-200 focus:ring-2 focus:ring-emerald-50">
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
                <SelectTrigger className="w-60 h-12 border !border-gray-300 bg-white focus:border-emerald-200 focus:ring-2 focus:ring-emerald-50">
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
        <Card className="p-12 text-center border shadow-none !border-gray-200 bg-gradient-to-br from-gray-50/50 to-white">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-emerald-50 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Target className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t('noMicroclimates')}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {debouncedSearchTerm ||
              statusFilter !== 'all' ||
              departmentFilter !== 'all'
                ? t('tryAdjustingFilters')
                : t('createFirstMicroclimate')}
            </p>
            {!debouncedSearchTerm &&
              statusFilter === 'all' &&
              departmentFilter === 'all' && (
                <Button
                  onClick={() => router.push('/microclimates/create')}
                  className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('createYourFirstMicroclimate')}
                </Button>
              )}
          </div>
        </Card>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${filterLoading ? 'opacity-60' : 'opacity-100'}`}
        >
          {filteredMicroclimates.map((microclimate) => (
            <motion.div
              key={microclimate._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group relative border shadow-none overflow-hidden border !border-gray-200 bg-white hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-300">
                <CardContent className="p-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                          {microclimate.title}
                        </h3>
                        {getStatusBadge(microclimate.status)}
                      </div>
                      {microclimate.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {microclimate.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
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
                          {t('viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleMenuAction(microclimate._id, 'analytics')
                          }
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          {t('analytics')}
                        </DropdownMenuItem>
                        {microclimate.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMenuAction(microclimate._id, 'edit')
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleMenuAction(microclimate._id, 'duplicate')
                          }
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          {t('duplicate')}
                        </DropdownMenuItem>
                        {(microclimate.status === 'draft' ||
                          microclimate.status === 'completed') && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleMenuAction(
                                microclimate._id,
                                'delete',
                                microclimate.title
                              )
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3 mb-4">
                    {/* Timing Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">
                        {formatDateTime(microclimate.scheduling.start_time)}
                      </span>
                    </div>

                    {microclimate.status === 'active' && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">
                          {getTimeRemaining(
                            microclimate.scheduling.start_time,
                            microclimate.scheduling.duration_minutes
                          )}
                        </span>
                      </div>
                    )}

                    {/* Participation Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {microclimate.response_count}/
                          {microclimate.target_participant_count}
                        </span>
                      </div>
                      {microclimate.participation_rate > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-emerald-600">
                            {microclimate.participation_rate}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Engagement Level */}
                    {getEngagementIndicator(microclimate)}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${microclimate.participation_rate}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-2 pt-3 border-t !border-gray-200">
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
                          className="flex-1 border-gray-50 hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {t('edit')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleActivate(microclimate._id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {t('launch')}
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
                          className="flex-1 border-gray-50 hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {common('view')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleActivate(microclimate._id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {t('startNow')}
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
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('viewLive')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/microclimates/${microclimate._id}/respond`
                            )
                          }
                          variant="outline"
                          className="flex-1 border-gray-50 hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {t('respond')}
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
                          className="flex-1 border-gray-50 hover:border-emerald-200 hover:bg-emerald-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('results')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleDelete(microclimate._id, microclimate.title)
                          }
                          variant="outline"
                          className="border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t !border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-medium">{t('createdBy')}</span>
                      <span>{microclimate.created_by.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(microclimate.created_at).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <CircleAlertIcon className="opacity-80" size={16} />
            </div>
            <DialogHeader>
              <DialogTitle className="sm:text-center">
                {t('finalConfirmation')}
              </DialogTitle>
              <DialogDescription className="sm:text-center">
                {t('deleteConfirmationMessage')}{' '}
                <span className="text-foreground font-medium">
                  {microclimateToDelete?.title}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
          </div>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="*:not-first:mt-2">
              <Label htmlFor={deleteInputId}>{t('microclimateTitle')}</Label>
              <Input
                id={deleteInputId}
                type="text"
                placeholder={t('typeToConfirm', {
                  title: microclimateToDelete?.title || '',
                })}
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  {common('cancel')}
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={
                  deleteConfirmationInput !== microclimateToDelete?.title
                }
                onClick={confirmDelete}
              >
                {common('delete')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
