'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Users, Target, TrendingUp, Clock } from 'lucide-react';

interface ParticipationData {
  current: number;
  target: number;
  rate: number; // percentage
  trend?: 'up' | 'down' | 'stable';
  timeRemaining?: number; // minutes
}

interface ParticipationTrackerProps {
  data: ParticipationData;
  title?: string;
  realTime?: boolean;
  animated?: boolean;
  showTimeRemaining?: boolean;
  showTrend?: boolean;
}

export default function ParticipationTracker({
  data,
  title = 'Participation Rate',
  realTime = false,
  animated = true,
  showTimeRemaining = false,
  showTrend = true,
}: ParticipationTrackerProps) {
  const [previousData, setPreviousData] = useState<ParticipationData | null>(
    null
  );
  const [animatedRate, setAnimatedRate] = useState(0);

  // Track changes for highlighting
  useEffect(() => {
    if (data.current !== previousData?.current) {
      setPreviousData({ ...data });
    }
  }, [data, previousData]);

  // Animate the rate counter
  useEffect(() => {
    if (animated) {
      const duration = 1000; // 1 second
      const steps = 60;
      const increment = (data.rate - animatedRate) / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setAnimatedRate((prev) => {
          const newRate = prev + increment;
          if (currentStep >= steps) {
            clearInterval(timer);
            return data.rate;
          }
          return newRate;
        });
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setAnimatedRate(data.rate);
    }
  }, [data.rate, animated, animatedRate]);

  const hasRecentChange =
    previousData &&
    (data.current !== previousData.current || data.rate !== previousData.rate);

  const getStatusColor = (rate: number) => {
    if (rate >= 80)
      return {
        bg: 'bg-green-500',
        text: 'text-green-700',
        light: 'bg-green-50',
      };
    if (rate >= 60)
      return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50' };
    if (rate >= 40)
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700',
        light: 'bg-yellow-50',
      };
    return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' };
  };

  const statusColor = getStatusColor(data.rate);

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getParticipationStatus = (rate: number) => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Good';
    if (rate >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : {}}
      animate={animated ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={`w-full p-6 rounded-lg border ${hasRecentChange && realTime ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-2">
          {showTrend && data.trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                data.trend === 'up'
                  ? 'bg-green-100 text-green-700'
                  : data.trend === 'down'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              <TrendingUp
                className={`w-3 h-3 ${data.trend === 'down' ? 'rotate-180' : ''}`}
              />
              <span>
                {data.trend === 'up'
                  ? 'Rising'
                  : data.trend === 'down'
                    ? 'Falling'
                    : 'Stable'}
              </span>
            </motion.div>
          )}

          {realTime && (
            <motion.div
              className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium"
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span>LIVE</span>
            </motion.div>
          )}

          {/* Real-time update notification */}
          {hasRecentChange && realTime && (
            <motion.div
              className="flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                  ease: 'easeInOut',
                }}
              />
              <span>NEW</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Participants */}
        <motion.div
          className={`p-4 rounded-lg ${statusColor.light}`}
          animate={
            hasRecentChange && realTime
              ? {
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    '0 0 0 rgba(59, 130, 246, 0)',
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                    '0 0 0 rgba(59, 130, 246, 0)',
                  ],
                }
              : {}
          }
          transition={{
            duration: 1,
            repeat: hasRecentChange && realTime ? 2 : 0,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current</p>
              <motion.p
                className={`text-2xl font-bold ${statusColor.text}`}
                key={data.current}
                initial={
                  hasRecentChange ? { scale: 1.2, color: '#3B82F6' } : {}
                }
                animate={{
                  scale: 1,
                  color: statusColor.text.replace('text-', '#'),
                }}
                transition={{ duration: 0.5 }}
              >
                {data.current.toLocaleString()}
              </motion.p>
            </div>
            <Users className={`w-8 h-8 ${statusColor.text}`} />
          </div>
        </motion.div>

        {/* Target */}
        <div className="p-4 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Target</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.target.toLocaleString()}
              </p>
            </div>
            <Target className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        {/* Time Remaining */}
        {showTimeRemaining && data.timeRemaining !== undefined && (
          <div className="p-4 rounded-lg bg-orange-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Left</p>
                <p className="text-2xl font-bold text-orange-700">
                  {formatTimeRemaining(data.timeRemaining)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className={`text-sm font-medium ${statusColor.text}`}>
            {getParticipationStatus(data.rate)}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
          <motion.div
            className={`h-4 rounded-full ${statusColor.bg} relative`}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(data.rate, 100)}%`,
              boxShadow: realTime ? '0 0 10px rgba(59, 130, 246, 0.4)' : 'none',
            }}
            transition={{
              duration: animated ? 1.2 : 0,
              ease: [0.25, 0.25, 0, 1],
              boxShadow: { duration: 2, repeat: realTime ? Infinity : 0 },
            }}
          >
            {/* Animated shine effect */}
            {realTime && data.rate > 0 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </motion.div>

          {/* Percentage Label */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: data.rate > 10 ? 1 : 0 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(animatedRate)}%
          </motion.div>
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {data.rate >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-green-100 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="text-green-500 text-lg">🎉</div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Target Achieved!
                </p>
                <p className="text-xs text-green-600">
                  All participants have responded
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {data.rate < 30 && data.timeRemaining && data.timeRemaining < 60 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-100 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="text-red-500 text-lg">⚠️</div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Low Participation Alert
                </p>
                <p className="text-xs text-red-600">
                  Consider sending reminders or extending time
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-lg font-semibold text-gray-900">
            {(data.target - data.current).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Completion Rate</p>
          <p className={`text-lg font-semibold ${statusColor.text}`}>
            {Math.round(animatedRate)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}
