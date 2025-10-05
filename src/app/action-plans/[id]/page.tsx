'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProgressTracker } from '@/components/action-plans/ProgressTracker';
import { ActionPlanNavbar } from '@/components/layout/Navbar';
import { ActionPlanExportButtons } from '@/components/exports/export-buttons';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

interface ActionPlan {
  _id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  created_at?: string;
  assigned_to?: Array<{ _id: string; name: string; email: string }>;
  created_by?: { _id: string; name: string; email: string };
  kpis?: Array<{
    id: string;
    name: string;
    current_value: number;
    target_value: number;
    unit: string;
  }>;
  qualitative_objectives?: Array<{
    id: string;
    description: string;
    completion_percentage: number;
  }>;
  progress_updates?: Array<{
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
  }>;
  tags?: string[];
}

export default function ActionPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, canCreateActionPlans } = useAuth();
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actionPlanId = params.id as string;

  useEffect(() => {
    if (!canCreateActionPlans) {
      router.push('/dashboard');
      return;
    }

    fetchActionPlan();
  }, [actionPlanId, canCreateActionPlans, router]);

  const fetchActionPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/action-plans/${actionPlanId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Action plan not found');
        } else if (response.status === 403) {
          setError('You do not have permission to view this action plan');
        } else {
          setError('Failed to load action plan');
        }
        return;
      }

      const data = await response.json();
      setActionPlan(data.action_plan);
    } catch (err) {
      console.error('Error fetching action plan:', err);
      setError('Failed to load action plan');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdated = (updatedActionPlan: ActionPlan) => {
    setActionPlan(updatedActionPlan);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">
            The action plan you're looking for might have been moved or deleted.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/action-plans">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Action Plans
              </Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!actionPlan) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/action-plans">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Action Plans
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(actionPlan.status)}
                <h1 className="text-2xl font-bold text-gray-900">
                  {actionPlan.title}
                </h1>
              </div>
              <p className="text-gray-600 mb-3">{actionPlan.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(actionPlan.status)}>
                  {actionPlan.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {actionPlan.priority && (
                  <Badge className={getPriorityColor(actionPlan.priority)}>
                    {actionPlan.priority.toUpperCase()} PRIORITY
                  </Badge>
                )}
                {actionPlan.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <ActionPlanExportButtons
                actionPlanId={actionPlanId}
                actionPlanTitle={actionPlan.title}
              />
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Due Date</p>
                <p className="text-sm font-bold text-gray-900">
                  {actionPlan.due_date
                    ? new Date(actionPlan.due_date).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned To</p>
                <p className="text-sm font-bold text-gray-900">
                  {actionPlan.assigned_to?.length || 0} people
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">KPIs</p>
                <p className="text-sm font-bold text-gray-900">
                  {actionPlan.kpis?.length || 0} metrics
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Updates</p>
                <p className="text-sm font-bold text-gray-900">
                  {actionPlan.progress_updates?.length || 0} entries
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content - Progress Tracker */}
        <div className="flex-1 overflow-hidden">
          <ProgressTracker
            actionPlanId={actionPlan._id}
            onProgressUpdated={handleProgressUpdated}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
