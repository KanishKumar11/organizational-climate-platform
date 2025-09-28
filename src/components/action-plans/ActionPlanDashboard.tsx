'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionPlanKanban } from './ActionPlanKanban';
import { ActionPlanTimeline } from './ActionPlanTimeline';
import { ProgressTracker } from './ProgressTracker';
import { ActionPlanCreator } from './ActionPlanCreator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  TrendingUp,
  Plus,
  Filter,
  Search,
  Download,
  Settings,
} from 'lucide-react';

interface ActionPlan {
  _id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  assigned_to?: Array<{ name: string; email: string }>;
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
    update_date: string;
    updated_by: { name: string };
  }>;
  created_at?: string;
}

interface ActionPlanDashboardProps {
  companyId?: string;
  departmentId?: string;
  assignedTo?: string;
  canCreate?: boolean;
}

export function ActionPlanDashboard({
  companyId,
  departmentId,
  assignedTo,
  canCreate = true,
}: ActionPlanDashboardProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<
    'kanban' | 'timeline' | 'progress' | 'create'
  >('kanban');
  const [selectedActionPlan, setSelectedActionPlan] =
    useState<ActionPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const handleActionPlanClick = (actionPlan: ActionPlan) => {
    // Navigate to the individual action plan page
    router.push(`/action-plans/${actionPlan._id}`);
  };

  const handleCreateActionPlan = () => {
    // Navigate to the create action plan page
    router.push('/action-plans/create');
  };

  const handleProgressUpdated = (actionPlan: ActionPlan) => {
    // Update local state or refresh data
    setSelectedActionPlan(actionPlan);
  };

  const viewOptions = [
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: LayoutGrid,
      description: 'Visual board with status columns',
    },
    {
      id: 'timeline',
      label: 'Timeline View',
      icon: Calendar,
      description: 'Calendar-based timeline',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Action Plans</h1>
              <p className="text-orange-100 text-lg">
                Track progress and manage organizational improvements
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canCreate && (
                <Button
                  onClick={handleCreateActionPlan}
                  className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Action Plan
                </Button>
              )}
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
                placeholder="Search action plans by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 w-full sm:w-80 text-base border-0 bg-white/80 backdrop-blur shadow-sm focus:shadow-md transition-shadow"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-12 border-gray-200 bg-white/80 backdrop-blur">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 h-12 border-gray-200 bg-white/80 backdrop-blur">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced View Tabs */}
      <div className="flex items-center gap-2">
        {viewOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Button
              key={option.id}
              variant={activeView === option.id ? 'default' : 'outline'}
              onClick={() =>
                setActiveView(
                  option.id as 'kanban' | 'timeline' | 'progress' | 'create'
                )
              }
              className={`flex items-center gap-2 h-12 px-6 ${
                activeView === option.id
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg'
                  : 'border-gray-200 bg-white/80 backdrop-blur hover:bg-white'
              }`}
            >
              <IconComponent className="h-5 w-5" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeView === 'kanban' && (
              <ActionPlanKanban
                companyId={companyId}
                departmentId={departmentId}
                assignedTo={assignedTo}
                onActionPlanClick={handleActionPlanClick}
              />
            )}

            {activeView === 'timeline' && (
              <ActionPlanTimeline
                companyId={companyId}
                departmentId={departmentId}
                assignedTo={assignedTo}
                onActionPlanClick={handleActionPlanClick}
              />
            )}

            {activeView === 'progress' && selectedActionPlan && (
              <ProgressTracker
                actionPlanId={selectedActionPlan._id}
                onProgressUpdated={(actionPlan) =>
                  setSelectedActionPlan(actionPlan)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Back Button for Progress View */}
      {activeView === 'progress' && (
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => setActiveView('kanban')}
            className="flex items-center"
          >
            ← Back to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
