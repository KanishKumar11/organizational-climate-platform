'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Users,
  MessageSquare,
  Shield,
  Eye,
  Sparkles,
  Timer,
  Target,
} from 'lucide-react';

interface MicroclimateData {
  title: string;
  description?: string;
  response_count: number;
  target_participant_count: number;
  time_remaining?: number;
  questions: any[];
  real_time_settings?: {
    anonymous_responses?: boolean;
    show_live_results?: boolean;
  };
}

interface EnhancedResponseHeaderProps {
  microclimateData: MicroclimateData;
}

export default function EnhancedResponseHeader({
  microclimateData,
}: EnhancedResponseHeaderProps) {
  const formatTimeRemaining = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const participationRate =
    microclimateData.target_participant_count > 0
      ? (microclimateData.response_count /
          microclimateData.target_participant_count) *
        100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative px-8 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon and Title */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight"
          >
            {microclimateData.title}
          </motion.h1>

          {microclimateData.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto"
            >
              {microclimateData.description}
            </motion.p>
          )}

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Participation Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {microclimateData.response_count} /{' '}
                {microclimateData.target_participant_count}
              </div>
              <div className="text-sm text-gray-600 mb-2">Responses</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(participationRate, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(participationRate)}% participation
              </div>
            </div>

            {/* Time Remaining Card */}
            {microclimateData.time_remaining !== undefined && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Timer className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatTimeRemaining(microclimateData.time_remaining)}
                </div>
                <div className="text-sm text-gray-600">Remaining</div>
                {microclimateData.time_remaining < 60 && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-xs text-orange-600 font-medium mt-1"
                  >
                    ⚡ Hurry up!
                  </motion.div>
                )}
              </div>
            )}

            {/* Questions Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {microclimateData.questions.length}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
              <div className="text-xs text-gray-500 mt-1">
                ~{microclimateData.questions.length * 30} seconds
              </div>
            </div>
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {microclimateData.real_time_settings?.anonymous_responses && (
              <Badge
                variant="outline"
                className="bg-white/80 backdrop-blur-sm text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium"
              >
                <Shield className="w-4 h-4 mr-2" />
                Anonymous Responses
              </Badge>
            )}

            {microclimateData.real_time_settings?.show_live_results && (
              <Badge
                variant="outline"
                className="bg-white/80 backdrop-blur-sm text-green-700 border-green-200 px-4 py-2 text-sm font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                Live Results
              </Badge>
            )}

            <Badge
              variant="outline"
              className="bg-white/80 backdrop-blur-sm text-purple-700 border-purple-200 px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Interactive Survey
            </Badge>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
