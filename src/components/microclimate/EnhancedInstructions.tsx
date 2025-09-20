'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  Shield, 
  Eye, 
  Clock,
  CheckCircle,
  Lightbulb,
  Users
} from 'lucide-react';

interface MicroclimateData {
  real_time_settings?: {
    anonymous_responses?: boolean;
    show_live_results?: boolean;
  };
}

interface EnhancedInstructionsProps {
  microclimateData: MicroclimateData;
}

export default function EnhancedInstructions({ 
  microclimateData 
}: EnhancedInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const instructions = [
    {
      icon: Heart,
      color: 'text-red-500 bg-red-50',
      title: 'Be Honest & Thoughtful',
      description: 'Your genuine feedback helps create a better workplace for everyone',
    },
    {
      icon: Users,
      color: 'text-blue-500 bg-blue-50',
      title: 'Think About Your Team',
      description: 'Consider your recent experiences and interactions with colleagues',
    },
    {
      icon: Clock,
      color: 'text-orange-500 bg-orange-50',
      title: 'Take Your Time',
      description: 'There\'s no rush - thoughtful responses are more valuable',
    },
  ];

  const additionalInstructions = [
    ...(microclimateData.real_time_settings?.anonymous_responses ? [{
      icon: Shield,
      color: 'text-purple-500 bg-purple-50',
      title: 'Completely Anonymous',
      description: 'Your identity is protected - responses cannot be traced back to you',
    }] : []),
    ...(microclimateData.real_time_settings?.show_live_results ? [{
      icon: Eye,
      color: 'text-green-500 bg-green-50',
      title: 'Live Results Available',
      description: 'See how your team is feeling in real-time after submitting',
    }] : []),
    {
      icon: CheckCircle,
      color: 'text-indigo-500 bg-indigo-50',
      title: 'Required Questions',
      description: 'Questions marked with * must be answered to proceed',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-md">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quick Instructions</h3>
                <p className="text-sm text-gray-600">Everything you need to know</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>

          {/* Main Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {instructions.map((instruction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-gray-100 shadow-sm"
              >
                <div className={`p-2 rounded-lg ${instruction.color}`}>
                  <instruction.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {instruction.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {instruction.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Expandable Additional Instructions */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-200 pt-6 mt-2">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Additional Information
                  </h4>
                  
                  <div className="space-y-3">
                    {additionalInstructions.map((instruction, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50"
                      >
                        <div className={`p-2 rounded-lg ${instruction.color}`}>
                          <instruction.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm mb-1">
                            {instruction.title}
                          </h5>
                          <p className="text-xs text-gray-600">
                            {instruction.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tips Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Pro Tips
                    </h5>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        Use the navigation buttons to move between questions at your own pace
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        You can go back to previous questions to review or change your answers
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        For open-ended questions, specific examples are more helpful than general statements
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-800">
                Ready to share your feedback? Let's get started! 🚀
              </span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
