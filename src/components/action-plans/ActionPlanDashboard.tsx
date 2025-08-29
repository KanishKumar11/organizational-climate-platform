'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  status: string;
  priority: string;
  due_date: string;
  assigned_to: Array<{ name: string; email: string }>;
  kpis: any[];
  qualitative_objectives: any[];
  progress_updates: any[];
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
  const [activeView, setActiveView] = useState<
    'kanban' | 'timeline' | 'progress' | 'create'
  >('kanban');
  const [selectedActionPlan, setSelectedActionPlan] =
    useState<ActionPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const handleActionPlanClick = (actionPlan: ActionPlan) => {
    setSelectedActionPlan(actionPlan);
    setActiveView('progress');
  };

  const handleActionPlanCreated = (actionPlan: ActionPlan) => {
    setActiveView('kanban');
    // Optionally refresh the data or add to local state
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Action Plans</h1>
          <p className="text-gray-600 mt-1">
            Track progress and manage organizational improvements
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {canCreate && (
            <Button
              onClick={() => setActiveView('create')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Action Plan
            </Button>
          )}

          <Button variant="outline" className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* View Navigation and Filters */}
      {activeView !== 'create' && activeView !== 'progress' && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            {viewOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.id}
                  variant={activeView === option.id ? 'default' : 'outline'}
                  onClick={() =>
                    setActiveView(option.id as 'kanban' | 'timeline')
                  }
                  className="flex items-center"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {option.label}
                </Button>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search action plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Back Button for Progress View */}
      {activeView === 'progress' && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setActiveView('kanban')}
            className="flex items-center"
          >
            ← Back to Dashboard
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
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
                onProgressUpdated={handleProgressUpdated}
              />
            )}

            {activeView === 'create' && (
              <ActionPlanCreator
                onSuccess={handleActionPlanCreated}
                onCancel={() => setActiveView('kanban')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      {activeView !== 'create' && activeView !== 'progress' && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Active Plans</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-gray-600">Due This Week</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">2</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
        </div>
      )}
    </div>
  );
}
