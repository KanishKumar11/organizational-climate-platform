'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AIAlertProps {
  type: 'pattern' | 'risk' | 'recommendation' | 'prediction' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  affectedSegments?: string[];
  recommendedActions?: string[];
  onAcknowledge?: () => void;
  onDismiss?: () => void;
}

const typeConfig = {
  pattern: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  risk: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  recommendation: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  prediction: {
    icon: Info,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  alert: {
    icon: XCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
};

const priorityConfig = {
  low: { variant: 'secondary' as const, label: 'Low' },
  medium: { variant: 'warning' as const, label: 'Medium' },
  high: { variant: 'destructive' as const, label: 'High' },
  critical: { variant: 'destructive' as const, label: 'Critical' },
};

export default function AIAlert({
  type,
  priority,
  title,
  description,
  confidence,
  affectedSegments = [],
  recommendedActions = [],
  onAcknowledge,
  onDismiss,
}: AIAlertProps) {
  const config = typeConfig[type];
  const priorityConf = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border-l-4`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Icon className={`h-6 w-6 ${config.color}`} />
              </motion.div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={priorityConf.variant} className="text-xs">
                    {priorityConf.label} Priority
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(confidence * 100)}% Confidence
                  </Badge>
                </div>
              </div>
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-700">{description}</p>

          {affectedSegments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-medium text-gray-900 mb-2">
                Affected Segments:
              </h4>
              <div className="flex flex-wrap gap-2">
                {affectedSegments.map((segment, index) => (
                  <motion.div
                    key={segment}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Badge variant="outline" className="text-xs">
                      {segment}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {recommendedActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="font-medium text-gray-900 mb-2">
                Recommended Actions:
              </h4>
              <ul className="space-y-1">
                {recommendedActions.map((action, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-sm text-gray-600 flex items-start"
                  >
                    <span className="text-gray-400 mr-2">•</span>
                    {action}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {onAcknowledge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-2"
            >
              <Button
                onClick={onAcknowledge}
                size="sm"
                className="w-full sm:w-auto"
              >
                Acknowledge
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
