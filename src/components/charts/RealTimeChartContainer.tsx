'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { realTimeAnimations, realTimePresets } from '@/lib/realtime-animations';
import { Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface RealTimeChartContainerProps {
  title: string;
  children: React.ReactNode;
  isRealTime?: boolean;
  hasUpdate?: boolean;
  updateType?: 'data' | 'insight' | 'participation' | 'alert';
  lastUpdateTime?: Date;
  className?: string;
}

export default function RealTimeChartContainer({
  title,
  children,
  isRealTime = false,
  hasUpdate = false,
  updateType = 'data',
  lastUpdateTime,
  className = '',
}: RealTimeChartContainerProps) {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Show update notification when hasUpdate changes to true
  useEffect(() => {
    if (hasUpdate) {
      setShowUpdateNotification(true);
      const timer = setTimeout(() => {
        setShowUpdateNotification(false);
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [hasUpdate]);

  const getUpdateIcon = () => {
    switch (updateType) {
      case 'insight':
        return <TrendingUp className="w-3 h-3" />;
      case 'participation':
        return <Activity className="w-3 h-3" />;
      case 'alert':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  const getUpdateColor = () => {
    switch (updateType) {
      case 'insight':
        return 'bg-purple-100 text-purple-700';
      case 'participation':
        return 'bg-blue-100 text-blue-700';
      case 'alert':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const getUpdateMessage = () => {
    switch (updateType) {
      case 'insight':
        return 'New AI Insight';
      case 'participation':
        return 'Participation Updated';
      case 'alert':
        return 'Alert Generated';
      default:
        return 'Data Updated';
    }
  };

  return (
    <motion.div
      className={`relative ${className}`}
      animate={
        hasUpdate && isRealTime
          ? realTimePresets.newResponse.highlight
          : undefined
      }
      transition={
        hasUpdate && isRealTime
          ? (realTimePresets.newResponse.transition as any)
          : undefined
      }
    >
      <Card
        className={`relative overflow-hidden ${
          isRealTime ? 'border-green-200' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          <div className="flex items-center space-x-2">
            {/* Real-time indicator */}
            {isRealTime && (
              <motion.div
                className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium"
                {...(realTimeAnimations.livePulse as any)}
              >
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut' as any,
                  }}
                />
                <span>LIVE</span>
              </motion.div>
            )}

            {/* Last update time */}
            {lastUpdateTime && (
              <span className="text-xs text-gray-500">
                {lastUpdateTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-0">{children}</div>

        {/* Real-time glow effect */}
        {isRealTime && hasUpdate && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 0 rgba(34, 197, 94, 0)',
                '0 0 20px rgba(34, 197, 94, 0.2)',
                '0 0 0 rgba(34, 197, 94, 0)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: 2,
              ease: 'easeInOut',
            }}
          />
        )}
      </Card>

      {/* Update notification */}
      <AnimatePresence>
        {showUpdateNotification && (
          <motion.div
            className="absolute top-2 right-2 z-10"
            {...(realTimeAnimations.newDataNotification as any)}
          >
            <Badge className={`${getUpdateColor()} shadow-lg`}>
              <motion.div
                className="flex items-center space-x-1"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: 2,
                  ease: 'easeInOut' as any,
                }}
              >
                {getUpdateIcon()}
                <span>{getUpdateMessage()}</span>
              </motion.div>
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse effect for new data */}
      {isRealTime && hasUpdate && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.1, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 1,
            ease: 'easeOut',
          }}
          style={{
            background:
              'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
          }}
        />
      )}
    </motion.div>
  );
}
