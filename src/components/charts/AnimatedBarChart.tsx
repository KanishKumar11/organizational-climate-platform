'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface AnimatedBarChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
}

export function AnimatedBarChart({
  data,
  height = 300,
  className = '',
}: AnimatedBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex flex-col items-center flex-1">
            <motion.div
              className="w-full rounded-t-md"
              style={{
                backgroundColor: item.color || '#3b82f6',
                height: `${(item.value / maxValue) * 80}%`,
              }}
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 80}%` }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
            />
            <div className="mt-2 text-xs text-center text-muted-foreground">
              {item.name}
            </div>
            <div className="text-sm font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnimatedBarChart;
