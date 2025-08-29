'use client';

import { motion } from 'framer-motion';
import { ISurvey } from '@/models/Survey';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SurveyCompletionProps {
  survey: ISurvey;
}

export function SurveyCompletion({ survey }: SurveyCompletionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </motion.div>

          {/* Thank You Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your response to "{survey.title}" has been successfully submitted.
            </p>
          </motion.div>

          {/* Additional Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Your responses will be analyzed along with others</li>
                <li>• Results will be shared with leadership</li>
                <li>• Action plans will be developed based on feedback</li>
                <li>• You may receive follow-up surveys to track progress</li>
              </ul>
            </div>

            {survey.settings.anonymous ? (
              <p className="text-sm text-gray-500">
                Your responses were submitted anonymously and cannot be traced
                back to you.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Your responses are confidential and will only be used in
                aggregate analysis.
              </p>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-3"
          >
            <Button onClick={() => window.close()} className="w-full">
              Close Window
            </Button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Return to Home
            </button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
