'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface HeatMapData {
  x: string;
  y: string;
  value: number;
}

interface HeatMapProps {
  data: HeatMapData[];
  title?: string;
  height?: number;
  colorScale?: string[];
}

const DEFAULT_COLOR_SCALE = [
  '#FEF3C7',
  '#FDE68A',
  '#FCD34D',
  '#F59E0B',
  '#D97706',
  '#B45309',
  '#92400E',
  '#78350F',
];

export default function HeatMap({
  data,
  title,
  height = 300,
  colorScale = DEFAULT_COLOR_SCALE,
}: HeatMapProps) {
  const { processedData, xLabels, yLabels, maxValue, minValue } =
    useMemo(() => {
      if (data.length === 0)
        return {
          processedData: [],
          xLabels: [],
          yLabels: [],
          maxValue: 0,
          minValue: 0,
        };

      const xLabels = [...new Set(data.map((d) => d.x))];
      const yLabels = [...new Set(data.map((d) => d.y))];
      const maxValue = Math.max(...data.map((d) => d.value));
      const minValue = Math.min(...data.map((d) => d.value));
      const range = maxValue - minValue || 1;

      const processedData = data.map((item) => {
        const normalizedValue = (item.value - minValue) / range;
        const colorIndex = Math.floor(
          normalizedValue * (colorScale.length - 1)
        );

        return {
          ...item,
          color: colorScale[colorIndex],
          opacity: 0.3 + normalizedValue * 0.7,
        };
      });

      return { processedData, xLabels, yLabels, maxValue, minValue };
    }, [data, colorScale]);

  const cellWidth = 100 / xLabels.length;
  const cellHeight = (height - 60) / yLabels.length; // Account for labels

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold mb-4 text-gray-900 text-center"
        >
          {title}
        </motion.h3>
      )}

      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-8 flex flex-col justify-between"
          style={{ height: height - 60 }}
        >
          {yLabels.map((label, index) => (
            <div key={label} className="text-xs text-gray-600 pr-2">
              {label}
            </div>
          ))}
        </div>

        {/* Heat map grid */}
        <div className="ml-16 mt-8">
          {/* X-axis labels */}
          <div className="flex mb-2">
            {xLabels.map((label, index) => (
              <div
                key={label}
                className="text-xs text-gray-600 text-center"
                style={{ width: `${cellWidth}%` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="relative">
            {yLabels.map((yLabel, yIndex) => (
              <div key={yLabel} className="flex">
                {xLabels.map((xLabel, xIndex) => {
                  const cellData = processedData.find(
                    (d) => d.x === xLabel && d.y === yLabel
                  );

                  return (
                    <motion.div
                      key={`${xLabel}-${yLabel}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: cellData?.opacity || 0.1, scale: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: (yIndex * xLabels.length + xIndex) * 0.05,
                      }}
                      className="border border-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        width: `${cellWidth}%`,
                        height: cellHeight,
                        backgroundColor: cellData?.color || '#F3F4F6',
                      }}
                      title={
                        cellData
                          ? `${xLabel} - ${yLabel}: ${cellData.value}`
                          : 'No data'
                      }
                    >
                      {cellData?.value.toFixed(1) || '0'}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          <span className="text-xs text-gray-600">Low</span>
          <div className="flex">
            {colorScale.map((color, index) => (
              <div
                key={index}
                className="w-4 h-4"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600">High</span>
        </div>
      </div>
    </motion.div>
  );
}
