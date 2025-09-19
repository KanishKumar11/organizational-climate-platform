'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ResponseData {
  question: string;
  responses: Array<{
    option: string;
    count: number;
    percentage: number;
  }>;
  total_responses: number;
}

interface LiveResponseChartProps {
  data: ResponseData[];
  className?: string;
  maxQuestions?: number;
}

const CHART_COLORS = [
  '#10B981', // Green-500
  '#3B82F6', // Blue-500
  '#F59E0B', // Amber-500
  '#EF4444', // Red-500
  '#8B5CF6', // Violet-500
  '#06B6D4', // Cyan-500
];

export default function LiveResponseChart({
  data,
  className = '',
  maxQuestions = 3,
}: LiveResponseChartProps) {
  const [animatedData, setAnimatedData] = useState<ResponseData[]>([]);

  useEffect(() => {
    // Animate data changes
    const timer = setTimeout(() => {
      setAnimatedData(data.slice(0, maxQuestions));
    }, 100);

    return () => clearTimeout(timer);
  }, [data, maxQuestions]);

  if (animatedData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Waiting for response data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {animatedData.map((questionData, questionIndex) => (
        <motion.div
          key={questionData.question}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: questionIndex * 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {questionData.question}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{questionData.total_responses} responses</span>
              </div>
            </div>
          </div>

          {/* Response Bars */}
          <div className="space-y-3">
            {questionData.responses.map((response, responseIndex) => (
              <div key={response.option} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {response.option}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {response.count}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {response.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          CHART_COLORS[responseIndex % CHART_COLORS.length],
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${response.percentage}%` }}
                      transition={{
                        duration: 0.8,
                        ease: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth easing
                        delay: responseIndex * 0.05, // Reduced delay for snappier feel
                      }}
                    />
                  </div>

                  {/* Subtle glow effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-200"
                    style={{
                      backgroundColor:
                        CHART_COLORS[responseIndex % CHART_COLORS.length],
                      boxShadow: `0 0 8px ${CHART_COLORS[responseIndex % CHART_COLORS.length]}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live Status Indicator */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span>Live responses updating</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Overall Stats */}
      {animatedData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Overall Activity
              </h4>
              <p className="text-sm text-gray-600">
                {animatedData.length} questions • Total responses across all
                questions
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {animatedData.reduce(
                  (total, q) => total + q.total_responses,
                  0
                )}
              </div>
              <p className="text-sm text-gray-600">Total responses</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subtle background animation for active state */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl"
        animate={{
          background: [
            'linear-gradient(45deg, transparent 0%, rgba(16, 185, 129, 0.02) 50%, transparent 100%)',
            'linear-gradient(45deg, transparent 0%, rgba(59, 130, 246, 0.02) 50%, transparent 100%)',
            'linear-gradient(45deg, transparent 0%, rgba(16, 185, 129, 0.02) 50%, transparent 100%)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
