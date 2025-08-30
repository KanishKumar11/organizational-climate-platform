'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  name?: string;
  value?: number;
  [key: string]: any; // Allow additional properties for multi-series support
}

interface AnimatedBarChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  color?: string;
  xKey?: string;
  yKeys?: string[];
  colors?: string[];
}

export function AnimatedBarChart({
  data,
  height = 300,
  className = '',
  color = '#3b82f6',
  xKey,
  yKeys,
  colors,
}: AnimatedBarChartProps) {
  // Handle multi-series case
  if (xKey && yKeys && yKeys.length > 0) {
    const xAxisKey = xKey || 'name';
    const allValues = data.flatMap((item) =>
      yKeys.map((key) => item[key] || 0)
    );
    const maxValue = Math.max(...allValues);

    return (
      <div className={`w-full ${className}`} style={{ height }}>
        <div className="flex items-end justify-between h-full gap-2">
          {data.map((item, index) => (
            <div
              key={item[xAxisKey] || item.name}
              className="flex flex-col items-center flex-1 gap-1"
            >
              {yKeys.map((key, keyIndex) => {
                const value = item[key] || 0;
                const barColor = colors?.[keyIndex] || color;
                return (
                  <motion.div
                    key={key}
                    className="w-full rounded-t-md"
                    style={{
                      backgroundColor: barColor,
                      height: `${(value / maxValue) * 70}%`,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(value / maxValue) * 70}%` }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1 + keyIndex * 0.05,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}
              <div className="mt-2 text-xs text-center text-muted-foreground">
                {item[xAxisKey] || item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle single series case (backward compatibility)
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex flex-col items-center flex-1">
            <motion.div
              className="w-full rounded-t-md"
              style={{
                backgroundColor: item.color || color,
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
