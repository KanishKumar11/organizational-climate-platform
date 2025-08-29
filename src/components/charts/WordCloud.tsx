'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface WordData {
  text: string;
  value: number;
  color?: string;
  category?: string;
}

interface WordCloudProps {
  data: WordData[];
  title?: string;
  height?: number;
  maxFontSize?: number;
  minFontSize?: number;
  interactive?: boolean;
  colorScheme?: 'default' | 'sentiment' | 'category';
  realTime?: boolean;
  animated?: boolean;
}

const sentimentColors = {
  positive: ['#10B981', '#059669', '#047857'],
  neutral: ['#F59E0B', '#D97706', '#B45309'],
  negative: ['#EF4444', '#DC2626', '#B91C1C'],
};

export default function WordCloud({
  data,
  title,
  height = 300,
  maxFontSize = 32,
  minFontSize = 12,
  interactive = true,
  colorScheme = 'default',
  realTime = false,
  animated = true,
}: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previousData, setPreviousData] = useState<WordData[]>([]);

  // Track data changes for real-time updates
  useEffect(() => {
    if (realTime && data.length > 0) {
      setPreviousData([...data]);
    }
  }, [data, realTime]);

  const processedData = useMemo(() => {
    if (data.length === 0) return [];

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    // Simple spiral positioning algorithm for better word placement
    const centerX = 50;
    const centerY = 50;

    return data
      .sort((a, b) => b.value - a.value) // Sort by value for better positioning
      .map((word, index) => {
        const normalizedValue = (word.value - minValue) / range;
        const fontSize =
          minFontSize + normalizedValue * (maxFontSize - minFontSize);

        // Spiral positioning
        const angle = index * 0.5;
        const radius = Math.min(index * 2, 35);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Ensure words stay within bounds
        const boundedX = Math.max(10, Math.min(90, x));
        const boundedY = Math.max(15, Math.min(85, y));

        let color = word.color;
        if (!color) {
          switch (colorScheme) {
            case 'sentiment':
              // Assign sentiment colors based on value (higher = more positive)
              if (normalizedValue > 0.7) {
                color =
                  sentimentColors.positive[
                    index % sentimentColors.positive.length
                  ];
              } else if (normalizedValue > 0.3) {
                color =
                  sentimentColors.neutral[
                    index % sentimentColors.neutral.length
                  ];
              } else {
                color =
                  sentimentColors.negative[
                    index % sentimentColors.negative.length
                  ];
              }
              break;
            case 'category':
              // Use category-based colors
              const categoryIndex = word.category
                ? word.category.charCodeAt(0)
                : index;
              color = `hsl(${(categoryIndex * 137.5) % 360}, 65%, 55%)`;
              break;
            default:
              color = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
          }
        }

        return {
          ...word,
          fontSize: Math.round(fontSize),
          color,
          x: boundedX,
          y: boundedY,
          normalizedValue,
        };
      });
  }, [data, maxFontSize, minFontSize, colorScheme]);

  const categories = useMemo(() => {
    const cats = [...new Set(data.map((d) => d.category).filter(Boolean))];
    return cats;
  }, [data]);

  const filteredData = selectedCategory
    ? processedData.filter((word) => word.category === selectedCategory)
    : processedData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-4"
    >
      {title && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          {categories.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category || null)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <div
        className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border"
        style={{ height }}
      >
        <AnimatePresence mode="popLayout">
          {filteredData.map((word, index) => {
            // Check if this is a new word for real-time highlighting
            const isNewWord =
              realTime && !previousData.some((prev) => prev.text === word.text);
            const hasValueChanged =
              realTime &&
              previousData.some(
                (prev) => prev.text === word.text && prev.value !== word.value
              );

            return (
              <motion.div
                key={`${word.text}-${selectedCategory || 'all'}`}
                initial={
                  animated
                    ? { opacity: 0, scale: 0, rotate: -180 }
                    : { opacity: 1, scale: 1, rotate: 0 }
                }
                animate={{
                  opacity: hoveredWord && hoveredWord !== word.text ? 0.3 : 1,
                  scale: isNewWord || hasValueChanged ? [1, 1.3, 1] : 1,
                  rotate: 0,
                }}
                exit={
                  animated
                    ? { opacity: 0, scale: 0, rotate: 180 }
                    : { opacity: 0 }
                }
                transition={{
                  duration: animated ? 0.6 : 0.3,
                  delay: animated ? index * 0.05 : 0,
                  ease: [0.25, 0.25, 0, 1],
                  scale:
                    isNewWord || hasValueChanged
                      ? {
                          duration: 1,
                          repeat: realTime ? 2 : 0,
                          ease: 'easeInOut',
                        }
                      : undefined,
                }}
                className={`absolute font-bold select-none ${
                  interactive ? 'cursor-pointer' : ''
                } ${isNewWord ? 'animate-pulse' : ''}`}
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  fontSize: `${word.fontSize}px`,
                  color: isNewWord ? '#10B981' : word.color,
                  transform: 'translate(-50%, -50%)',
                  textShadow: isNewWord
                    ? '2px 2px 4px rgba(16, 185, 129, 0.3)'
                    : '1px 1px 2px rgba(0,0,0,0.1)',
                  filter: isNewWord ? 'brightness(1.2)' : 'none',
                }}
                whileHover={
                  interactive
                    ? {
                        scale: 1.2,
                        zIndex: 10,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                      }
                    : {}
                }
                onHoverStart={() => interactive && setHoveredWord(word.text)}
                onHoverEnd={() => interactive && setHoveredWord(null)}
                title={`${word.text}: ${word.value}${word.category ? ` (${word.category})` : ''}${isNewWord ? ' (New!)' : ''}`}
              >
                {word.text}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredData.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full text-gray-500"
          >
            <div className="text-center">
              <div className="text-lg mb-2">📝</div>
              <div>
                {realTime ? 'Waiting for responses...' : 'No words available'}
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                >
                  Show all categories
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Real-time indicator */}
        {realTime && filteredData.length > 0 && (
          <motion.div
            className="absolute top-3 right-3 flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{
                opacity: [1, 0.3, 1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className="text-xs text-gray-600 font-medium">LIVE</span>
          </motion.div>
        )}

        {/* Real-time update indicator */}
        {realTime &&
          previousData.length > 0 &&
          data.length !== previousData.length && (
            <motion.div
              className="absolute top-3 left-3 flex items-center space-x-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 3,
                  ease: 'easeInOut',
                }}
              />
              <span>Updated</span>
            </motion.div>
          )}

        {/* Hover overlay with word details */}
        <AnimatePresence>
          {hoveredWord && interactive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border"
            >
              <div className="text-sm font-medium text-gray-900">
                {hoveredWord}
              </div>
              <div className="text-xs text-gray-500">
                Frequency:{' '}
                {filteredData.find((w) => w.text === hoveredWord)?.value}
                {filteredData.find((w) => w.text === hoveredWord)?.category && (
                  <span className="ml-2">
                    Category:{' '}
                    {filteredData.find((w) => w.text === hoveredWord)?.category}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
