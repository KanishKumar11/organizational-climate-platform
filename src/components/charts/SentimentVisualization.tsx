'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Smile, Meh, Frown, TrendingUp, TrendingDown } from 'lucide-react';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  total?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface SentimentVisualizationProps {
  data: SentimentData;
  title?: string;
  height?: number;
  showTrend?: boolean;
  animated?: boolean;
  realTime?: boolean;
}

export default function SentimentVisualization({
  data,
  title,
  height = 200,
  showTrend = true,
  animated = true,
  realTime = false,
}: SentimentVisualizationProps) {
  const processedData = useMemo(() => {
    const total = data.total || data.positive + data.neutral + data.negative;

    if (total === 0) {
      return {
        positive: { percentage: 0, count: 0 },
        neutral: { percentage: 0, count: 0 },
        negative: { percentage: 0, count: 0 },
        total: 0,
      };
    }

    return {
      positive: {
        percentage: (data.positive / total) * 100,
        count: data.positive,
      },
      neutral: {
        percentage: (data.neutral / total) * 100,
        count: data.neutral,
      },
      negative: {
        percentage: (data.negative / total) * 100,
        count: data.negative,
      },
      total,
    };
  }, [data]);

  const sentimentItems = [
    {
      key: 'positive',
      label: 'Positive',
      icon: Smile,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      data: processedData.positive,
    },
    {
      key: 'neutral',
      label: 'Neutral',
      icon: Meh,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      data: processedData.neutral,
    },
    {
      key: 'negative',
      label: 'Negative',
      icon: Frown,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      data: processedData.negative,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
                {data.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : data.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>
                  {data.trend === 'up'
                    ? 'Improving'
                    : data.trend === 'down'
                      ? 'Declining'
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
          </div>
        </motion.div>
      )}

      <div className="space-y-4" style={{ minHeight: height }}>
        {/* Sentiment Bars */}
        <div className="space-y-3">
          {sentimentItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animated ? 0.3 + index * 0.1 : 0 }}
                className="flex items-center space-x-3"
              >
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-4 h-4 ${item.textColor}`} />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.data.count} ({item.data.percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full ${item.color} relative`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${item.data.percentage}%`,
                        boxShadow: realTime
                          ? '0 0 8px rgba(59, 130, 246, 0.4)'
                          : 'none',
                      }}
                      transition={{
                        duration: animated ? 0.8 : 0,
                        delay: animated ? 0.4 + index * 0.1 : 0,
                        ease: [0.25, 0.25, 0, 1],
                        boxShadow: {
                          duration: 2,
                          repeat: realTime ? Infinity : 0,
                        },
                      }}
                    >
                      {/* Animated shine effect for real-time updates */}
                      {realTime && item.data.percentage > 0 && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: index * 0.5,
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animated ? 0.8 : 0 }}
          className="bg-gray-50 rounded-lg p-4 mt-4"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Responses
            </span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: animated ? 0.9 : 0, type: 'spring' }}
              className="text-lg font-bold text-gray-900"
            >
              {processedData.total.toLocaleString()}
            </motion.span>
          </div>

          {processedData.total > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Overall sentiment:{' '}
              <span
                className={`font-medium ${
                  processedData.positive.percentage > 50
                    ? 'text-green-600'
                    : processedData.negative.percentage > 50
                      ? 'text-red-600'
                      : 'text-yellow-600'
                }`}
              >
                {processedData.positive.percentage > 50
                  ? 'Positive'
                  : processedData.negative.percentage > 50
                    ? 'Negative'
                    : 'Neutral'}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
