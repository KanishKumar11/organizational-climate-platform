'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Clock, TrendingUp } from 'lucide-react';
import AnimatedCounter from '@/components/charts/AnimatedCounter';

interface ParticipationData {
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  time_remaining?: number; // in minutes
  engagement_level?: 'low' | 'medium' | 'high';
}

interface LiveParticipationTrackerProps {
  data: ParticipationData;
  className?: string;
  showTimeRemaining?: boolean;
}

export default function LiveParticipationTracker({
  data,
  className = '',
  showTimeRemaining = true,
}: LiveParticipationTrackerProps) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // Trigger pulse animation when response count changes
    setPulseKey((prev) => prev + 1);
  }, [data.response_count]);

  const getEngagementColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEngagementBgColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100';
      case 'medium':
        return 'bg-yellow-100';
      case 'low':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatTimeRemaining = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Response Count */}
        <motion.div
          key={pulseKey}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          animate={{
            scale: [1, 1.02, 1],
            boxShadow: [
              '0 1px 3px rgba(0, 0, 0, 0.1)',
              '0 4px 6px rgba(0, 0, 0, 0.1)',
              '0 1px 3px rgba(0, 0, 0, 0.1)',
            ],
          }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Responses</p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter
                  value={data.response_count}
                  className="text-2xl font-bold text-gray-900"
                />
                <span className="text-sm text-gray-500">
                  / {data.target_participant_count}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Participation Rate */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Participation</p>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter
                  value={data.participation_rate}
                  suffix="%"
                  className="text-2xl font-bold text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        {showTimeRemaining && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Left</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTimeRemaining(data.time_remaining)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Progress</h4>
          {data.engagement_level && (
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getEngagementBgColor(
                data.engagement_level
              )} ${getEngagementColor(data.engagement_level)}`}
            >
              <TrendingUp className="w-4 h-4" />
              {data.engagement_level.charAt(0).toUpperCase() +
                data.engagement_level.slice(1)}{' '}
              Engagement
            </div>
          )}
        </div>

        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor(
                data.participation_rate
              )}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(data.participation_rate, 100)}%` }}
              transition={{
                duration: 1,
                ease: 'easeOut',
              }}
            />
          </div>

          {/* Progress markers */}
          <div className="absolute inset-0 flex items-center">
            {[25, 50, 75].map((marker) => (
              <div
                key={marker}
                className="absolute w-px h-6 bg-white"
                style={{ left: `${marker}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Live Activity Indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        <motion.div
          className="w-2 h-2 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <span className="text-sm text-gray-600">Live updates active</span>
      </div>

      {/* Floating response indicators */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`${pulseKey}-${i}`}
            className="absolute w-8 h-8 bg-green-400 rounded-full opacity-20"
            initial={{
              x: Math.random() * 100 + '%',
              y: '100%',
              scale: 0,
            }}
            animate={{
              y: '-20%',
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
