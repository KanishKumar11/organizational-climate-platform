'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordCloudData {
  text: string;
  value: number;
  color?: string;
}

interface LiveWordCloudProps {
  data: WordCloudData[];
  maxWords?: number;
  className?: string;
}

const COLORS = [
  '#10B981', // Green-500
  '#059669', // Green-600
  '#047857', // Green-700
  '#065F46', // Green-800
  '#34D399', // Green-400
  '#6EE7B7', // Green-300
];

export default function LiveWordCloud({
  data,
  maxWords = 20,
  className = '',
}: LiveWordCloudProps) {
  const [displayData, setDisplayData] = useState<WordCloudData[]>([]);

  useEffect(() => {
    // Sort by value and take top words
    const sortedData = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords)
      .map((word, index) => ({
        ...word,
        color: COLORS[index % COLORS.length],
      }));

    setDisplayData(sortedData);
  }, [data, maxWords]);

  const getFontSize = (value: number, maxValue: number) => {
    const minSize = 14;
    const maxSize = 48;
    const ratio = value / maxValue;
    return minSize + (maxSize - minSize) * ratio;
  };

  const getOpacity = (value: number, maxValue: number) => {
    const minOpacity = 0.6;
    const maxOpacity = 1;
    const ratio = value / maxValue;
    return minOpacity + (maxOpacity - minOpacity) * ratio;
  };

  const maxValue = Math.max(...displayData.map((d) => d.value), 1);

  if (displayData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">💭</div>
          <p>Waiting for responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2 p-6 min-h-64">
        <AnimatePresence mode="popLayout">
          {displayData.map((word, index) => (
            <motion.div
              key={word.text}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: getOpacity(word.value, maxValue),
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 100,
              }}
              whileHover={{
                scale: 1.1,
                transition: { duration: 0.2 },
              }}
              className="cursor-pointer select-none"
              style={{
                fontSize: `${getFontSize(word.value, maxValue)}px`,
                color: word.color,
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              }}
              title={`"${word.text}" - ${word.value} mentions`}
            >
              {word.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-green-400 rounded-full opacity-30"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
