'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface KPIData {
  id: string;
  label: string;
  value: number;
  target?: number;
  previousValue?: number;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon?: 'users' | 'target' | 'calendar' | 'trending-up' | 'trending-down';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

interface KPIDisplayProps {
  kpis?: KPIData[];
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  animated?: boolean;
  showTrends?: boolean;
  // Single KPI props for backward compatibility
  value?: number;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

interface SingleKPIProps {
  kpi: KPIData;
  index: number;
  animated?: boolean;
  showTrend?: boolean;
}

const iconMap = {
  users: Users,
  target: Target,
  calendar: Calendar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
};

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    accent: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-600',
    accent: 'bg-green-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    accent: 'bg-yellow-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-600',
    accent: 'bg-red-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    accent: 'bg-purple-500',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    icon: 'text-gray-600',
    accent: 'bg-gray-500',
  },
};

function AnimatedCounter({
  value,
  format = 'number',
  unit = '',
  duration = 1000,
}: {
  value: number;
  format?: KPIData['format'];
  unit?: string;
  duration?: number;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: [0.25, 0.25, 0, 1],
    });

    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded, duration]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'duration':
        return `${val}d`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <span>
      {formatValue(displayValue)}
      {unit && ` ${unit}`}
    </span>
  );
}

function SingleKPI({
  kpi,
  index,
  animated = true,
  showTrend = true,
}: SingleKPIProps) {
  const Icon = kpi.icon ? iconMap[kpi.icon] : Target;
  const colors = colorMap[kpi.color || 'blue'];

  const progressPercentage = kpi.target
    ? Math.min((kpi.value / kpi.target) * 100, 100)
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: animated ? 0.5 : 0,
        delay: animated ? index * 0.1 : 0,
        ease: [0.25, 0.25, 0, 1],
      }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${colors.bg}`}>
              <Icon className={`w-6 h-6 ${colors.icon}`} />
            </div>

            {showTrend && kpi.trend && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: animated ? 0.3 + index * 0.1 : 0 }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  kpi.trend === 'up'
                    ? 'bg-green-100 text-green-700'
                    : kpi.trend === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {kpi.trendValue && (
                  <span>
                    {kpi.trend === 'up' ? '+' : kpi.trend === 'down' ? '-' : ''}
                    {Math.abs(kpi.trendValue)}
                    {kpi.format === 'percentage' ? '%' : ''}
                  </span>
                )}
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">{kpi.label}</h3>

            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: animated ? 0.2 + index * 0.1 : 0 }}
              className="text-3xl font-bold text-gray-900"
            >
              {animated ? (
                <AnimatedCounter
                  value={kpi.value}
                  format={kpi.format}
                  unit={kpi.unit}
                  duration={800 + index * 200}
                />
              ) : (
                <>
                  {kpi.format === 'percentage' && `${kpi.value}%`}
                  {kpi.format === 'currency' &&
                    `$${kpi.value.toLocaleString()}`}
                  {kpi.format === 'duration' && `${kpi.value}d`}
                  {(!kpi.format || kpi.format === 'number') &&
                    kpi.value.toLocaleString()}
                  {kpi.unit && ` ${kpi.unit}`}
                </>
              )}
            </motion.div>

            {kpi.target && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    Target: {kpi.target.toLocaleString()}
                    {kpi.unit && ` ${kpi.unit}`}
                  </span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${colors.accent}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{
                      duration: animated ? 1 : 0,
                      delay: animated ? 0.4 + index * 0.1 : 0,
                      ease: [0.25, 0.25, 0, 1],
                    }}
                  />
                </div>
              </div>
            )}

            {kpi.previousValue !== undefined && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animated ? 0.5 + index * 0.1 : 0 }}
                className="text-xs text-gray-500"
              >
                Previous: {kpi.previousValue.toLocaleString()}
                {kpi.unit && ` ${kpi.unit}`}
                {kpi.value !== kpi.previousValue && (
                  <span
                    className={`ml-1 ${
                      kpi.value > kpi.previousValue
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ({kpi.value > kpi.previousValue ? '+' : ''}
                    {(
                      ((kpi.value - kpi.previousValue) / kpi.previousValue) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Simple KPI Display component for dashboard usage
interface SimpleKPIProps {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export function SimpleKPICard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  color,
}: SimpleKPIProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              <AnimatedCounter
                value={value}
                format={suffix === '%' ? 'percentage' : 'number'}
                unit={suffix !== '%' ? suffix : ''}
                duration={800}
              />
            </div>
            {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KPIDisplay(props: KPIDisplayProps) {
  // Check if single KPI props are provided
  if (props.value !== undefined && props.icon) {
    return (
      <SimpleKPICard
        title={props.title || ''}
        value={props.value}
        suffix={props.suffix}
        icon={props.icon}
        trend={props.trend}
        color={props.color || 'blue'}
      />
    );
  }

  // Original multi-KPI functionality
  const { kpis, title, columns = 3, animated = true, showTrends = true } = props;
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-semibold text-gray-900"
        >
          {title}
        </motion.h3>
      )}

      <div className={`grid gap-6 ${gridCols[columns]}`}>
        {kpis && kpis.length > 0 ? (
          kpis.map((kpi, index) => (
            <SingleKPI
              key={kpi.id}
              kpi={kpi}
              index={index}
              animated={animated}
              showTrend={showTrends}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No KPI data available
          </div>
        )}
      </div>
    </motion.div>
  );
}
// Export both named and default exports for flexibility
export { KPIDisplay };
export default KPIDisplay;
