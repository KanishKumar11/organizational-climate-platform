'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface AnimatedLineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function AnimatedLineChart({
  data,
  width = 400,
  height = 200,
  color = '#3b82f6',
  className = '',
}: AnimatedLineChartProps) {
  if (!data.length) return null;

  const maxX = Math.max(...data.map((d) => d.x));
  const maxY = Math.max(...data.map((d) => d.y));
  const minY = Math.min(...data.map((d) => d.y));

  const scaleX = (x: number) => (x / maxX) * (width - 40) + 20;
  const scaleY = (y: number) =>
    height - 20 - ((y - minY) / (maxY - minY)) * (height - 40);

  const pathData = data
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className={className}>
      <svg width={width} height={height} className="overflow-visible">
        <motion.path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        {data.map((point, index) => (
          <motion.circle
            key={index}
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r="4"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.3,
              delay: (index / data.length) * 1.5 + 0.5,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default AnimatedLineChart;
