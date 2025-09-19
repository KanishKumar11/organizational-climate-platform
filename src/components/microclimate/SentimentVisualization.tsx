'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown, TrendingUp, TrendingDown } from 'lucide-react';

interface SentimentData {
  score: number; // -1 to 1
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend?: 'up' | 'down' | 'stable';
  total_responses: number;
}

interface SentimentVisualizationProps {
  data: SentimentData;
  className?: string;
  showTrend?: boolean;
}

export default function SentimentVisualization({
  data,
  className = '',
  showTrend = true,
}: SentimentVisualizationProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedDistribution, setAnimatedDistribution] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  useEffect(() => {
    // Animate score change with safety checks
    const timer = setTimeout(() => {
      setAnimatedScore(data?.score || 0);
      setAnimatedDistribution(
        data?.distribution || {
          positive: 33,
          neutral: 34,
          negative: 33,
        }
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-600';
    if (score < -0.2) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getSentimentBgColor = (score: number) => {
    if (score > 0.2) return 'bg-green-100';
    if (score < -0.2) return 'bg-red-100';
    return 'bg-yellow-100';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return <Smile className="w-8 h-8" />;
    if (score < -0.2) return <Frown className="w-8 h-8" />;
    return <Meh className="w-8 h-8" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return 'Very Positive';
    if (score > 0.2) return 'Positive';
    if (score > -0.2) return 'Neutral';
    if (score > -0.5) return 'Negative';
    return 'Very Negative';
  };

  const getTrendIcon = () => {
    if (data.trend === 'up')
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (data.trend === 'down')
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Sentiment Score */}
      <div className="text-center">
        <motion.div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getSentimentBgColor(
            animatedScore
          )} ${getSentimentColor(animatedScore)} mb-4`}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          {getSentimentIcon(animatedScore)}
        </motion.div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {getSentimentLabel(animatedScore)}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="text-3xl font-bold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5 }}
              key={data.score}
            >
              {(animatedScore * 100).toFixed(0)}
            </motion.div>
            <span className="text-lg text-gray-600">/ 100</span>
            {showTrend && getTrendIcon()}
          </div>

          <p className="text-sm text-gray-500">
            Based on {data.total_responses} responses
          </p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 text-center">
          Sentiment Breakdown
        </h4>

        <div className="space-y-3">
          {/* Positive */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              <Smile className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Positive
              </span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${animatedDistribution?.positive || 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {(animatedDistribution?.positive || 0).toFixed(0)}%
            </span>
          </div>

          {/* Neutral */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              <Meh className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                Neutral
              </span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${animatedDistribution?.neutral || 0}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {(animatedDistribution?.neutral || 0).toFixed(0)}%
            </span>
          </div>

          {/* Negative */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              <Frown className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">Negative</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${animatedDistribution?.negative || 0}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {(animatedDistribution?.negative || 0).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Animated pulse effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at center, rgba(16, 185, 129, 0) 0%, rgba(16, 185, 129, 0) 100%)',
            'radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0) 70%)',
            'radial-gradient(circle at center, rgba(16, 185, 129, 0) 0%, rgba(16, 185, 129, 0) 100%)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
