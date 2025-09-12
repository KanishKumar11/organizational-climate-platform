'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import {
  ArrowRight,
  Clock,
  Lightbulb,
  Navigation,
  Zap,
  HelpCircle,
  X,
  ChevronRight,
  Target,
  TrendingUp,
} from 'lucide-react';

interface NavigationSuggestion {
  type: 'next_step' | 'alternative' | 'shortcut' | 'help';
  title: string;
  description: string;
  path: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimated_time_minutes: number;
}

interface WorkflowState {
  active_journey?: {
    journey_id: string;
    current_step: string;
    completed_steps: string[];
    completion_percentage: number;
    estimated_remaining_time: number;
  };
  available_journeys: Array<{
    id: string;
    name: string;
    description: string;
    steps: Array<{ id: string; title: string; estimated_time_minutes: number }>;
  }>;
  suggestions: NavigationSuggestion[];
}

const NavigationSuggestions: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchNavigationSuggestions();
    }
  }, [session, pathname]);

  const fetchNavigationSuggestions = async () => {
    try {
      const response = await fetch(
        `/api/navigation/suggestions?current_path=${encodeURIComponent(pathname)}`
      );
      const data = await response.json();

      if (data.success) {
        setWorkflowState(data.data.workflow_state);
      }
    } catch (error) {
      console.error('Error fetching navigation suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion: NavigationSuggestion) => {
    // Track suggestion click
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'navigation_suggestion_clicked',
          properties: {
            suggestion_type: suggestion.type,
            suggestion_title: suggestion.title,
            current_path: pathname,
            target_path: suggestion.path,
          },
        }),
      });
    } catch (error) {
      console.error('Error tracking suggestion click:', error);
    }

    router.push(suggestion.path);
  };

  const handleStartJourney = async (journeyId: string) => {
    try {
      const response = await fetch('/api/navigation/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journeyId,
          action: 'start_journey',
        }),
      });

      if (response.ok) {
        fetchNavigationSuggestions();
      }
    } catch (error) {
      console.error('Error starting journey:', error);
    }
  };

  const handleStepComplete = async (stepId: string) => {
    if (!workflowState?.active_journey) return;

    try {
      const response = await fetch('/api/navigation/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: workflowState.active_journey.journey_id,
          step_id: stepId,
          action: 'update_progress',
          progress_action: 'completed',
        }),
      });

      if (response.ok) {
        fetchNavigationSuggestions();
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'next_step':
        return <ArrowRight className="w-4 h-4" />;
      case 'alternative':
        return <Navigation className="w-4 h-4" />;
      case 'shortcut':
        return <Zap className="w-4 h-4" />;
      case 'help':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (
    !workflowState ||
    (!workflowState.active_journey && workflowState.suggestions.length === 0)
  ) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50 max-w-md"
    >
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Navigation Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 p-0"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
          {workflowState.active_journey && !collapsed && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Current Journey Progress</span>
                <span>
                  {Math.round(
                    workflowState.active_journey.completion_percentage
                  )}
                  %
                </span>
              </div>
              <Progress
                value={workflowState.active_journey.completion_percentage}
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>
                  {workflowState.active_journey.completed_steps.length} steps
                  completed
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {workflowState.active_journey.estimated_remaining_time}m
                  remaining
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {workflowState.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Suggested Next Steps
                    </h4>

                    {workflowState.suggestions
                      .slice(0, 3)
                      .map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group"
                        >
                          <Button
                            variant="ghost"
                            className="w-full p-3 h-auto text-left justify-start hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all duration-200"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="flex items-start space-x-3 w-full">
                              <div
                                className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)} group-hover:scale-110 transition-transform`}
                              >
                                {getSuggestionIcon(suggestion.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {suggestion.title}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="text-xs ml-2"
                                  >
                                    {suggestion.priority}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                  {suggestion.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {suggestion.reason}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {suggestion.estimated_time_minutes}m
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                  </div>
                )}

                {!workflowState.active_journey &&
                  workflowState.available_journeys.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        Start a Journey
                      </h4>

                      {workflowState.available_journeys
                        .slice(0, 2)
                        .map((journey, index) => (
                          <motion.div
                            key={journey.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="mb-3 last:mb-0"
                          >
                            <Button
                              variant="outline"
                              className="w-full p-3 h-auto text-left justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-dashed hover:border-solid transition-all duration-200"
                              onClick={() => handleStartJourney(journey.id)}
                            >
                              <div className="flex items-center space-x-3 w-full">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {journey.name}
                                  </p>
                                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                    {journey.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                      {journey.steps.length} steps
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {journey.steps.reduce(
                                        (sum, step) =>
                                          sum + step.estimated_time_minutes,
                                        0
                                      )}
                                      m total
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          </motion.div>
                        ))}
                    </div>
                  )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default NavigationSuggestions;
