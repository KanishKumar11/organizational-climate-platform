'use client';

import React, { useState } from 'react';
import { ActionPlanCreator } from '@/components/action-plans/ActionPlanCreator';
import { BulkActionPlanCreator } from '@/components/action-plans/BulkActionPlanCreator';
import { ActionPlanDashboard } from '@/components/action-plans/ActionPlanDashboard';
import { AlertsPanel } from '@/components/action-plans/AlertsPanel';
import { CommitmentTracker } from '@/components/action-plans/CommitmentTracker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import {
  Plus,
  Zap,
  Target,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

// Mock data for demonstration
const mockInsights = [
  {
    id: '1',
    title: 'Low Team Collaboration Score',
    description:
      'Teams are reporting difficulties in cross-functional collaboration, particularly in project coordination and knowledge sharing.',
    priority: 'high' as const,
    recommended_actions: [
      'Implement weekly cross-team standup meetings',
      'Create shared project documentation system',
      'Establish collaboration metrics and tracking',
    ],
    affected_departments: ['engineering', 'design', 'product'],
    confidence_score: 0.87,
  },
  {
    id: '2',
    title: 'Communication Gaps in Remote Work',
    description:
      'Remote employees feel disconnected from team decisions and company updates.',
    priority: 'medium' as const,
    recommended_actions: [
      'Increase frequency of all-hands meetings',
      'Implement async communication protocols',
      'Create virtual coffee chat sessions',
    ],
    affected_departments: ['all'],
    confidence_score: 0.73,
  },
  {
    id: '3',
    title: 'Manager Support Concerns',
    description:
      'Employees report needing more support and guidance from their direct managers.',
    priority: 'critical' as const,
    recommended_actions: [
      'Provide manager training on coaching skills',
      'Implement regular 1-on-1 meeting structure',
      'Create manager effectiveness feedback loop',
    ],
    affected_departments: ['all'],
    confidence_score: 0.92,
  },
];

const mockSurvey = {
  id: 'survey-123',
  title: 'Q4 2024 Employee Engagement Survey',
  type: 'general_climate',
};

export default function ActionPlansDemo() {
  const [activeView, setActiveView] = useState<
    'dashboard' | 'single' | 'bulk' | 'list' | 'alerts' | 'commitments'
  >('dashboard');
  const [createdPlans, setCreatedPlans] = useState<any[]>([]);

  const handleActionPlanCreated = (actionPlan: any) => {
    setCreatedPlans((prev) => [...prev, actionPlan]);
    setActiveView('list');
  };

  const handleBulkActionPlansCreated = (actionPlans: unknown[]) => {
    setCreatedPlans((prev) => [...prev, ...actionPlans]);
    setActiveView('list');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Action Plan Management Demo
          </h1>
          <p className="text-gray-600">
            Demonstration of action plan creation and assignment functionality
          </p>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mb-8">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
            className="flex items-center"
          >
            <Target className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={activeView === 'single' ? 'default' : 'outline'}
            onClick={() => setActiveView('single')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Single
          </Button>
          <Button
            variant={activeView === 'bulk' ? 'default' : 'outline'}
            onClick={() => setActiveView('bulk')}
            className="flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Bulk Create
          </Button>
          <Button
            variant={activeView === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveView('list')}
            className="flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Created Plans ({createdPlans.length})
          </Button>
          <Button
            variant={activeView === 'alerts' ? 'default' : 'outline'}
            onClick={() => setActiveView('alerts')}
            className="flex items-center"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Alerts
          </Button>
          <Button
            variant={activeView === 'commitments' ? 'default' : 'outline'}
            onClick={() => setActiveView('commitments')}
            className="flex items-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Commitments
          </Button>
        </div>

        {/* Content */}
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'dashboard' && (
            <ActionPlanDashboard companyId="demo-company" canCreate={true} />
          )}

          {activeView === 'single' && (
            <ActionPlanCreator
              onSuccess={handleActionPlanCreated}
              onCancel={() => setActiveView('list')}
              sourceInsight={mockInsights[0]}
              sourceSurvey={mockSurvey}
            />
          )}

          {activeView === 'bulk' && (
            <BulkActionPlanCreator
              insights={mockInsights}
              surveyId={mockSurvey.id}
              onSuccess={handleBulkActionPlansCreated}
              onCancel={() => setActiveView('list')}
            />
          )}

          {activeView === 'list' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Created Action Plans
                </h2>

                {createdPlans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No action plans created yet</p>
                    <p className="text-sm">
                      Use the buttons above to create your first action plan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {createdPlans.map((plan, index) => (
                      <Card
                        key={index}
                        className="p-4 border-l-4 border-l-orange-500"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {plan.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {plan.description}
                            </p>
                          </div>
                          <Badge
                            className={`
                            ${plan.priority === 'critical' ? 'bg-red-100 text-red-800' : ''}
                            ${plan.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                            ${plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${plan.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                          `}
                          >
                            {plan.priority}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            {plan.assigned_to?.length || 0} assigned
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            Due: {new Date(plan.due_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Target className="w-4 h-4 mr-2" />
                            {plan.kpis?.length || 0} KPIs,{' '}
                            {plan.qualitative_objectives?.length || 0}{' '}
                            objectives
                          </div>
                        </div>

                        {plan.ai_recommendations &&
                          plan.ai_recommendations.length > 0 && (
                            <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                              <h4 className="text-sm font-medium text-violet-900 mb-2">
                                AI Recommendations:
                              </h4>
                              <ul className="text-sm text-violet-800 space-y-1">
                                {plan.ai_recommendations
                                  .slice(0, 2)
                                  .map((rec: string, i: number) => (
                                    <li key={i} className="flex items-start">
                                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                {plan.ai_recommendations.length > 2 && (
                                  <li className="text-violet-600">
                                    +{plan.ai_recommendations.length - 2} more
                                    recommendations
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              {/* Mock Insights for Reference */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Available AI Insights
                </h2>
                <p className="text-gray-600 mb-4">
                  These are the mock insights available for creating action
                  plans:
                </p>
                <div className="space-y-3">
                  {mockInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 bg-violet-50 border border-violet-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-violet-900">
                          {insight.title}
                        </h4>
                        <Badge
                          className={`
                          ${insight.priority === 'critical' ? 'bg-red-100 text-red-800' : ''}
                          ${insight.priority === 'high' ? 'bg-orange-100 text-orange-800' : ''}
                          ${insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${insight.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                        `}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-violet-800 mb-2">
                        {insight.description}
                      </p>
                      <div className="text-xs text-violet-600">
                        {Math.round(insight.confidence_score * 100)}% confidence
                        •{insight.affected_departments.length} departments
                        affected
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeView === 'alerts' && (
            <AlertsPanel
              companyId="demo-company"
              onActionPlanClick={(actionPlanId) => {
                console.log('Navigate to action plan:', actionPlanId);
                setActiveView('dashboard');
              }}
              onAlertDismiss={(alertId) => {
                console.log('Alert dismissed:', alertId);
              }}
            />
          )}

          {activeView === 'commitments' && (
            <CommitmentTracker
              companyId="demo-company"
              onActionPlanClick={(actionPlanId) => {
                console.log('Navigate to action plan:', actionPlanId);
                setActiveView('dashboard');
              }}
              onSendNudge={(commitment, nudgeType, message) => {
                console.log('Nudge sent:', { commitment, nudgeType, message });
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
