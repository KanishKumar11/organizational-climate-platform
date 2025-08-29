/**
 * Interactive Heatmap Component
 * Displays data in a grid format with color-coded values and smooth animations
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { heatmapCellVariants } from '@/lib/animations';

export interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface HeatmapProps {
  data: HeatmapData[];
  className?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gradient';
  showLabels?: boolean;
  showValues?: boolean;
  interactive?: boolean;
  onCellClick?: (cell: HeatmapData) => void;
  animate?: boolean;
  cellSize?: 'sm' | 'md' | 'lg';
}

export function Heatmap({
  data,
  className,
  colorScheme = 'blue',
  showLabels = true,
  showValues = false,
  interactive = true,
  onCellClick,
  animate = true,
  cellSize = 'md',
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<HeatmapData | null>(
    null
  );

  // Process data to create grid structure
  const processedData = React.useMemo(() => {
    const xValues = Array.from(new Set(data.map((d) => d.x))).sort();
    const yValues = Array.from(new Set(data.map((d) => d.y))).sort();
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));

    const grid = yValues.map((y) =>
      xValues.map((x) => {
        const cell = data.find((d) => d.x === x && d.y === y);
        return cell || { x, y, value: 0 };
      })
    );

    return { grid, xValues, yValues, maxValue, minValue };
  }, [data]);

  // Color schemes
  const getColorIntensity = (
    value: number,
    maxValue: number,
    minValue: number
  ) => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  const getCellColor = (cell: HeatmapData) => {
    const intensity = getColorIntensity(
      cell.value,
      processedData.maxValue,
      processedData.minValue
    );

    switch (colorScheme) {
      case 'blue':
        return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
      case 'green':
        return `rgba(34, 197, 94, ${0.1 + intensity * 0.9})`;
      case 'red':
        return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
      case 'purple':
        return `rgba(147, 51, 234, ${0.1 + intensity * 0.9})`;
      case 'orange':
        return `rgba(249, 115, 22, ${0.1 + intensity * 0.9})`;
      case 'gradient':
        if (intensity < 0.33)
          return `rgba(34, 197, 94, ${0.1 + intensity * 0.9})`;
        if (intensity < 0.66)
          return `rgba(249, 115, 22, ${0.1 + intensity * 0.9})`;
        return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
      default:
        return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
    }
  };

  const getCellBorderColor = (cell: HeatmapData) => {
    const intensity = getColorIntensity(
      cell.value,
      processedData.maxValue,
      processedData.minValue
    );

    switch (colorScheme) {
      case 'blue':
        return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
      case 'green':
        return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
      case 'red':
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
      case 'purple':
        return `rgba(147, 51, 234, ${0.3 + intensity * 0.7})`;
      case 'orange':
        return `rgba(249, 115, 22, ${0.3 + intensity * 0.7})`;
      case 'gradient':
        if (intensity < 0.33)
          return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
        if (intensity < 0.66)
          return `rgba(249, 115, 22, ${0.3 + intensity * 0.7})`;
        return `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`;
      default:
        return `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
    }
  };

  const cellSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const handleCellClick = (cell: HeatmapData) => {
    if (interactive && onCellClick && cell.value > 0) {
      onCellClick(cell);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Y-axis labels */}
      {showLabels && (
        <div className="flex">
          <div className="flex flex-col justify-center space-y-1 mr-2">
            {processedData.yValues.map((y, index) => (
              <div
                key={y}
                className={cn(
                  'flex items-center justify-end text-xs text-muted-foreground',
                  cellSizes[cellSize]
                )}
              >
                {y}
              </div>
            ))}
          </div>

          <div className="flex-1">
            {/* X-axis labels */}
            <div className="flex space-x-1 mb-2">
              {processedData.xValues.map((x) => (
                <div
                  key={x}
                  className={cn(
                    'flex items-center justify-center text-xs text-muted-foreground',
                    cellSizes[cellSize]
                  )}
                >
                  {x}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {processedData.grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex space-x-1">
                  {row.map((cell, colIndex) => {
                    const cellIndex = rowIndex * row.length + colIndex;
                    const isHovered = hoveredCell === cell;

                    return (
                      <motion.div
                        key={`${cell.x}-${cell.y}`}
                        variants={animate ? heatmapCellVariants : undefined}
                        initial={animate ? 'hidden' : undefined}
                        animate={animate ? 'visible' : undefined}
                        whileHover={animate ? 'hover' : undefined}
                        custom={cellIndex * 0.02}
                        className={cn(
                          'relative flex items-center justify-center rounded border-2 cursor-pointer transition-all duration-200',
                          cellSizes[cellSize],
                          interactive &&
                            cell.value > 0 &&
                            'hover:scale-110 hover:z-10',
                          isHovered && 'z-20 shadow-lg'
                        )}
                        style={{
                          backgroundColor: getCellColor(cell),
                          borderColor: getCellBorderColor(cell),
                        }}
                        onClick={() => handleCellClick(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {showValues && cell.value > 0 && (
                          <span className="font-medium text-foreground">
                            {cell.value}
                          </span>
                        )}

                        {/* Tooltip */}
                        <AnimatePresence>
                          {isHovered && cell.value > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: 10 }}
                              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border z-30 whitespace-nowrap"
                            >
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {cell.label || `${cell.x} × ${cell.y}`}
                                </div>
                                <div className="text-muted-foreground">
                                  Value: {cell.value}
                                </div>
                                {cell.metadata &&
                                  Object.entries(cell.metadata).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="text-muted-foreground"
                                      >
                                        {key}: {value}
                                      </div>
                                    )
                                  )}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Without labels */}
      {!showLabels && (
        <div className="space-y-1">
          {processedData.grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex space-x-1">
              {row.map((cell, colIndex) => {
                const cellIndex = rowIndex * row.length + colIndex;
                const isHovered = hoveredCell === cell;

                return (
                  <motion.div
                    key={`${cell.x}-${cell.y}`}
                    variants={animate ? heatmapCellVariants : undefined}
                    initial={animate ? 'hidden' : undefined}
                    animate={animate ? 'visible' : undefined}
                    whileHover={animate ? 'hover' : undefined}
                    custom={cellIndex * 0.02}
                    className={cn(
                      'relative flex items-center justify-center rounded border-2 cursor-pointer transition-all duration-200',
                      cellSizes[cellSize],
                      interactive &&
                        cell.value > 0 &&
                        'hover:scale-110 hover:z-10',
                      isHovered && 'z-20 shadow-lg'
                    )}
                    style={{
                      backgroundColor: getCellColor(cell),
                      borderColor: getCellBorderColor(cell),
                    }}
                    onClick={() => handleCellClick(cell)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {showValues && cell.value > 0 && (
                      <span className="font-medium text-foreground">
                        {cell.value}
                      </span>
                    )}

                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && cell.value > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border z-30 whitespace-nowrap"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">
                              {cell.label || `${cell.x} × ${cell.y}`}
                            </div>
                            <div className="text-muted-foreground">
                              Value: {cell.value}
                            </div>
                            {cell.metadata &&
                              Object.entries(cell.metadata).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="text-muted-foreground"
                                  >
                                    {key}: {value}
                                  </div>
                                )
                              )}
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Color legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Low</span>
        <div
          className="flex-1 mx-4 h-4 rounded"
          style={{
            background: `linear-gradient(to right, ${getCellColor({ x: 0, y: 0, value: processedData.minValue })}, ${getCellColor({ x: 0, y: 0, value: processedData.maxValue })})`,
          }}
        />
        <span>High</span>
      </div>

      {/* Value range */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Range: {processedData.minValue} - {processedData.maxValue}
      </div>
    </div>
  );
}

/**
 * Compact Heatmap for smaller spaces
 */
interface CompactHeatmapProps
  extends Omit<HeatmapProps, 'cellSize' | 'showLabels'> {
  showLabels?: boolean;
}

export function CompactHeatmap({
  showLabels = false,
  ...props
}: CompactHeatmapProps) {
  return <Heatmap cellSize="sm" showLabels={showLabels} {...props} />;
}
