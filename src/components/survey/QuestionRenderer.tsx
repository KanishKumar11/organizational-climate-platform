'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IQuestion } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuestionRendererProps {
  question: IQuestion;
  response?: IQuestionResponse;
  onResponse: (questionId: string, value: any, text?: string) => void;
  questionNumber: number;
}

export function QuestionRenderer({
  question,
  response,
  onResponse,
  questionNumber,
}: QuestionRendererProps) {
  const [textValue, setTextValue] = useState(response?.response_text || '');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleResponse = (value: unknown, text?: string) => {
    onResponse(question.id, value, text);
  };

  const renderLikertScale = () => {
    const min = question.scale_min || 1;
    const max = question.scale_max || 5;
    const current = response?.response_value as number;

    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{question.scale_labels?.min || 'Strongly Disagree'}</span>
          <span>{question.scale_labels?.max || 'Strongly Agree'}</span>
        </div>

        <div className="flex justify-between items-center">
          {Array.from({ length: max - min + 1 }, (_, i) => {
            const value = min + i;
            const isSelected = current === value;

            return (
              <motion.button
                key={value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(value)}
                className={`
                  w-12 h-12 rounded-full border-2 flex items-center justify-center
                  font-semibold transition-colors
                  ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                  }
                `}
              >
                {value}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          {Array.from({ length: max - min + 1 }, (_, i) => (
            <span key={i} className="w-12 text-center">
              {min + i}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderMultipleChoice = () => {
    const current = response?.response_value as string;

    return (
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = current === option;

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleResponse(option)}
              className={`
                w-full p-4 text-left rounded-lg border-2 transition-colors
                ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center">
                <div
                  className={`
                  w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center
                  ${isSelected ? 'border-blue-500' : 'border-gray-300'}
                `}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderRanking = () => {
    const current = (response?.response_value as string[]) || [];

    const handleDragStart = (e: React.DragEvent, item: string) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetItem: string) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === targetItem) return;

      const newRanking = [...current];
      const draggedIndex = newRanking.indexOf(draggedItem);
      const targetIndex = newRanking.indexOf(targetItem);

      if (draggedIndex > -1) {
        newRanking.splice(draggedIndex, 1);
      }

      const newTargetIndex = newRanking.indexOf(targetItem);
      newRanking.splice(newTargetIndex, 0, draggedItem);

      handleResponse(newRanking);
      setDraggedItem(null);
    };

    const addToRanking = (item: string) => {
      if (!current.includes(item)) {
        handleResponse([...current, item]);
      }
    };

    const removeFromRanking = (item: string) => {
      handleResponse(current.filter((i) => i !== item));
    };

    const unrankedItems =
      question.options?.filter((opt) => !current.includes(opt)) || [];

    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Available Options</h4>
          <div className="grid grid-cols-1 gap-2">
            {unrankedItems.map((item, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                onClick={() => addToRanking(item)}
                className="p-3 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>

        {current.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Your Ranking (drag to reorder)
            </h4>
            <div className="space-y-2">
              {current.map((item, index) => (
                <motion.div
                  key={item}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item)}
                  className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move"
                >
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                    {index + 1}
                  </span>
                  <span className="flex-1">{item}</span>
                  <button
                    onClick={() => removeFromRanking(item)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOpenEnded = () => {
    return (
      <div className="space-y-4">
        <textarea
          value={textValue}
          onChange={(e) => {
            setTextValue(e.target.value);
            handleResponse(e.target.value);
          }}
          placeholder="Please share your thoughts..."
          className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={6}
          maxLength={2000}
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Be as detailed as you'd like</span>
          <span>{textValue.length}/2000</span>
        </div>
      </div>
    );
  };

  const renderYesNo = () => {
    const current = response?.response_value as string;

    return (
      <div className="flex space-x-4">
        {['Yes', 'No'].map((option) => {
          const isSelected = current === option.toLowerCase();

          return (
            <motion.button
              key={option}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleResponse(option.toLowerCase())}
              className={`
                flex-1 p-4 rounded-lg border-2 font-semibold transition-colors
                ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
                }
              `}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderRating = () => {
    const current = response?.response_value as number;
    const max = question.scale_max || 10;

    return (
      <div className="space-y-4">
        <div className="flex justify-center space-x-2">
          {Array.from({ length: max }, (_, i) => {
            const value = i + 1;
            const isSelected = current >= value;

            return (
              <motion.button
                key={value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleResponse(value)}
                className={`
                  w-8 h-8 transition-colors
                  ${isSelected ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}
                `}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </motion.button>
            );
          })}
        </div>
        <div className="text-center text-sm text-gray-600">
          {current ? `${current} out of ${max} stars` : 'Click to rate'}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    switch (question.type) {
      case 'likert':
        return renderLikertScale();
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'ranking':
        return renderRanking();
      case 'open_ended':
        return renderOpenEnded();
      case 'yes_no':
        return renderYesNo();
      case 'rating':
        return renderRating();
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex-1">
            <span className="text-blue-500 mr-2">Q{questionNumber}.</span>
            {question.text}
          </h2>
          {question.required && (
            <span className="text-red-500 text-sm ml-2">*</span>
          )}
        </div>

        {question.category && (
          <div className="mb-4">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              {question.category}
            </span>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div>{renderQuestion()}</div>
    </div>
  );
}
