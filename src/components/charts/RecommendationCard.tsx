'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  assignee?: string;
}

interface RecommendationCardProps {
  id: string;
  title: string;
  description: string;
  type: 'insight' | 'action' | 'alert' | 'prediction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  category: string;
  affectedAreas: string[];
  actions?: RecommendationAction[];
  metrics?: {
    current: number;
    target: number;
    unit: string;
  };
  onAccept?: () => void;
  onDismiss?: () => void;
  onViewDetails?: () => void;
  animated?: boolean;
  index?: number;
}

const typeConfig = {
  insight: {
    icon: Lightbulb,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    accentColor: 'bg-blue-500',
  },
  action: {
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-500',
    accentColor: 'bg-green-500',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-500',
    accentColor: 'bg-red-500',
  },
  prediction: {
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-l-purple-500',
    accentColor: 'bg-purple-500',
  },
};

const priorityConfig = {
  low: {
    variant: 'secondary' as const,
    label: 'Low',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  medium: {
    variant: 'default' as const,
    label: 'Medium',
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  high: {
    variant: 'destructive' as const,
    label: 'High',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
  },
  critical: {
    variant: 'destructive' as const,
    label: 'Critical',
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
};

const effortImpactConfig = {
  low: { color: 'text-green-600', bg: 'bg-green-100', label: 'Low' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Medium' },
  high: { color: 'text-red-600', bg: 'bg-red-100', label: 'High' },
};

export default function RecommendationCard({
  id,
  title,
  description,
  type,
  priority,
  confidence,
  category,
  affectedAreas,
  actions = [],
  metrics,
  onAccept,
  onDismiss,
  onViewDetails,
  animated = true,
  index = 0,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const config = typeConfig[type];
  const priorityConf = priorityConfig[priority];
  const Icon = config.icon;

  const handleAccept = () => {
    setIsAccepted(true);
    onAccept?.();
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
      rotateX: -15,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.5,
        delay: animated ? index * 0.1 : 0,
        ease: 'easeOut' as const,
      },
    },
    accepted: {
      scale: 0.98,
      opacity: 0.8,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate={isAccepted ? 'accepted' : 'visible'}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative"
    >
      <Card
        className={`${config.bgColor} border-l-4 ${config.borderColor} hover:shadow-lg transition-shadow`}
      >
        {/* Confidence indicator */}
        <div className="absolute top-4 right-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: animated ? 0.3 + index * 0.1 : 0 }}
            className="flex items-center space-x-1"
          >
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600">
              {Math.round(confidence * 100)}%
            </span>
          </motion.div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start space-x-3 pr-16">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: animated ? 0.2 + index * 0.1 : 0,
                type: 'spring',
                stiffness: 200,
              }}
              className={`p-2 rounded-lg ${config.bgColor} border`}
            >
              <Icon className={`w-5 h-5 ${config.color}`} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animated ? 0.3 + index * 0.1 : 0 }}
                className="text-lg font-semibold text-gray-900 leading-tight"
              >
                {title}
              </motion.h3>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animated ? 0.4 + index * 0.1 : 0 }}
                className="flex items-center space-x-2 mt-2"
              >
                <Badge variant={priorityConf.variant} className="text-xs">
                  {priorityConf.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animated ? 0.5 + index * 0.1 : 0 }}
            className="text-gray-700 leading-relaxed"
          >
            {description}
          </motion.p>

          {/* Metrics */}
          {metrics && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animated ? 0.6 + index * 0.1 : 0 }}
              className="bg-white rounded-lg p-3 border"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Current
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {metrics.current}
                  {metrics.unit}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-gray-600">
                  Target
                </span>
                <span className="text-lg font-bold text-green-600">
                  {metrics.target}
                  {metrics.unit}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-green-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(metrics.current / metrics.target) * 100}%`,
                  }}
                  transition={{
                    delay: animated ? 0.8 + index * 0.1 : 0,
                    duration: 0.8,
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Affected Areas */}
          {affectedAreas.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: animated ? 0.7 + index * 0.1 : 0 }}
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Affected Areas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {affectedAreas.map((area, areaIndex) => (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: animated
                        ? 0.8 + index * 0.1 + areaIndex * 0.05
                        : 0,
                    }}
                  >
                    <Badge variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <AnimatePresence>
            {actions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animated ? 0.8 + index * 0.1 : 0 }}
              >
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>Recommended Actions ({actions.length})</span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 space-y-3"
                  >
                    {actions.map((action, actionIndex) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: actionIndex * 0.1 }}
                        className="bg-white rounded-lg p-3 border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-900">
                            {action.title}
                          </h5>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {action.timeline}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {action.description}
                        </p>

                        <div className="flex items-center space-x-2">
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${effortImpactConfig[action.effort].bg} ${effortImpactConfig[action.effort].color}`}
                          >
                            Effort: {effortImpactConfig[action.effort].label}
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${effortImpactConfig[action.impact].bg} ${effortImpactConfig[action.impact].color}`}
                          >
                            Impact: {effortImpactConfig[action.impact].label}
                          </div>
                          {action.assignee && (
                            <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              <Users className="w-3 h-3 inline mr-1" />
                              {action.assignee}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: animated ? 0.9 + index * 0.1 : 0 }}
            className="flex items-center space-x-3 pt-2"
          >
            {onAccept && !isAccepted && (
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept</span>
              </Button>
            )}

            {isAccepted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2 text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Accepted</span>
              </motion.div>
            )}

            {onViewDetails && (
              <Button onClick={onViewDetails} variant="outline" size="sm">
                View Details
              </Button>
            )}

            {onDismiss && !isAccepted && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
