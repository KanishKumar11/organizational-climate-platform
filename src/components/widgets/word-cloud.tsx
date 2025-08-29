/**
 * Animated Word Cloud Component
 * Displays word frequency data with smooth animations and interactions
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { wordCloudVariants } from '@/lib/animations';

export interface WordCloudData {
  text: string;
  value: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  category?: string;
}

interface WordCloudProps {
  data: WordCloudData[];
  className?: string;
  maxWords?: number;
  colorScheme?: 'default' | 'sentiment' | 'category';
  interactive?: boolean;
  onWordClick?: (word: WordCloudData) => void;
  animate?: boolean;
}

export function WordCloud({
  data,
  className,
  maxWords = 50,
  colorScheme = 'default',
  interactive = true,
  onWordClick,
  animate = true,
}: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = React.useState<string | null>(null);

  // Sort and limit words
  const sortedData = React.useMemo(() => {
    return data.sort((a, b) => b.value - a.value).slice(0, maxWords);
  }, [data, maxWords]);

  // Calculate font sizes based on frequency
  const getWordSize = (value: number, maxValue: number, minValue: number) => {
    const ratio = (value - minValue) / (maxValue - minValue);
    return Math.max(12, Math.min(48, 12 + ratio * 36));
  };

  const maxValue = Math.max(...sortedData.map((d) => d.value));
  const minValue = Math.min(...sortedData.map((d) => d.value));

  // Color schemes
  const getWordColor = (word: WordCloudData) => {
    switch (colorScheme) {
      case 'sentiment':
        switch (word.sentiment) {
          case 'positive':
            return 'text-microclimate hover:text-microclimate/80';
          case 'negative':
            return 'text-error hover:text-error/80';
          case 'neutral':
            return 'text-muted-foreground hover:text-foreground';
          default:
            return 'text-foreground hover:text-primary';
        }
      case 'category':
        // Simple hash-based color assignment
        const hash =
          word.category?.split('').reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0) || 0;
        const colors = [
          'text-survey hover:text-survey/80',
          'text-microclimate hover:text-microclimate/80',
          'text-ai hover:text-ai/80',
          'text-action hover:text-action/80',
        ];
        return colors[Math.abs(hash) % colors.length];
      default:
        return 'text-foreground hover:text-primary';
    }
  };

  // Generate positions for words (simple grid-based layout)
  const generateLayout = () => {
    const positions: Array<{ x: number; y: number; word: WordCloudData }> = [];
    const gridSize = Math.ceil(Math.sqrt(sortedData.length));

    sortedData.forEach((word, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      // Add some randomness to avoid perfect grid
      const randomX = (Math.random() - 0.5) * 20;
      const randomY = (Math.random() - 0.5) * 20;

      positions.push({
        x: (col / gridSize) * 100 + randomX,
        y: (row / gridSize) * 100 + randomY,
        word,
      });
    });

    return positions;
  };

  const layout = React.useMemo(() => generateLayout(), [sortedData]);

  const handleWordClick = (word: WordCloudData) => {
    if (interactive && onWordClick) {
      onWordClick(word);
    }
  };

  return (
    <div className={cn('relative w-full h-96 overflow-hidden', className)}>
      <AnimatePresence>
        {layout.map(({ x, y, word }, index) => {
          const fontSize = getWordSize(word.value, maxValue, minValue);
          const isHovered = hoveredWord === word.text;

          return (
            <motion.div
              key={word.text}
              variants={animate ? wordCloudVariants : undefined}
              initial={animate ? 'hidden' : undefined}
              animate={animate ? 'visible' : undefined}
              whileHover={animate ? 'hover' : undefined}
              custom={index}
              className={cn(
                'absolute cursor-pointer select-none font-medium transition-all duration-200',
                getWordColor(word),
                interactive && 'hover:scale-110',
                isHovered && 'z-10 drop-shadow-lg'
              )}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                fontSize: `${fontSize}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handleWordClick(word)}
              onMouseEnter={() => setHoveredWord(word.text)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              {word.text}

              {/* Tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border z-20 whitespace-nowrap"
                  >
                    <div className="font-medium">{word.text}</div>
                    <div className="text-muted-foreground">
                      Frequency: {word.value}
                      {word.sentiment && (
                        <span className="ml-2 capitalize">
                          {word.sentiment}
                        </span>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-popover" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Legend */}
      {colorScheme === 'sentiment' && (
        <div className="absolute bottom-4 right-4 flex space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-microclimate rounded-full" />
            <span>Positive</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted-foreground rounded-full" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-error rounded-full" />
            <span>Negative</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {sortedData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground">No data available</div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Word Cloud for smaller spaces
 */
interface CompactWordCloudProps extends Omit<WordCloudProps, 'className'> {
  className?: string;
  maxWords?: number;
}

export function CompactWordCloud({
  data,
  className,
  maxWords = 20,
  ...props
}: CompactWordCloudProps) {
  return (
    <div className={cn('h-48', className)}>
      <WordCloud
        data={data}
        maxWords={maxWords}
        className="h-full"
        {...props}
      />
    </div>
  );
}

/**
 * Word Cloud with controls
 */
interface ControlledWordCloudProps extends WordCloudProps {
  showControls?: boolean;
  onMaxWordsChange?: (maxWords: number) => void;
  onColorSchemeChange?: (scheme: 'default' | 'sentiment' | 'category') => void;
}

export function ControlledWordCloud({
  showControls = true,
  onMaxWordsChange,
  onColorSchemeChange,
  maxWords = 50,
  colorScheme = 'default',
  ...props
}: ControlledWordCloudProps) {
  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Max Words:</label>
            <select
              value={maxWords}
              onChange={(e) => onMaxWordsChange?.(Number(e.target.value))}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Color:</label>
            <select
              value={colorScheme}
              onChange={(e) => onColorSchemeChange?.(e.target.value as any)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="default">Default</option>
              <option value="sentiment">Sentiment</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      )}

      <WordCloud maxWords={maxWords} colorScheme={colorScheme} {...props} />
    </div>
  );
}
