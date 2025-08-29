'use client';

import React, { useState } from 'react';
import QuestionBankManager from '@/components/question-bank/QuestionBankManager';
import QuestionRecommendations from '@/components/question-bank/QuestionRecommendations';
import QuestionAnalytics from '@/components/question-bank/QuestionAnalytics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function QuestionBankDemo() {
  const [activeTab, setActiveTab] = useState<
    'manager' | 'recommendations' | 'analytics'
  >('manager');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Demo Header */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900 mb-2">
                Question Bank Management Demo
              </h1>
              <p className="text-blue-700">
                Explore the centralized question repository with AI-powered
                recommendations and analytics.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">
                Task 10.1 & 10.2
              </div>
              <div className="text-xs text-blue-500">
                Repository & AI Recommendations
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg border">
          <Button
            variant={activeTab === 'manager' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('manager')}
            className="flex-1"
          >
            Question Manager
          </Button>
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('recommendations')}
            className="flex-1"
          >
            AI Recommendations
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analytics')}
            className="flex-1"
          >
            Analytics
          </Button>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14-7l2 2-2 2M5 13l-2-2 2-2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Categorization
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Questions organized by categories and subcategories for easy
              navigation and management.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Analytics
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Track question effectiveness, usage patterns, and response rates
              for optimization.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                Search & Filter
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Advanced search and filtering capabilities to quickly find
              relevant questions.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">
                AI Recommendations
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered question suggestions based on context, effectiveness,
              and trends.
            </p>
          </Card>
        </div>

        {/* Tab Content */}
        {activeTab === 'manager' && (
          <QuestionBankManager
            userRole="company_admin"
            companyId="demo-company-123"
          />
        )}

        {activeTab === 'recommendations' && (
          <QuestionRecommendations
            category="Leadership & Management"
            surveyType="general_climate"
            industry="technology"
            companySize="medium"
            onQuestionSelect={(question) => {
              console.log('Selected question:', question);
            }}
            onAddToSurvey={(questions) => {
              console.log('Added questions to survey:', questions);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <QuestionAnalytics
            category="Leadership & Management"
            timeframe="30"
          />
        )}

        {/* Implementation Notes */}
        <Card className="p-6 mt-8 bg-gray-50 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Implementation Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Core Functionality (Task 10.1)
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Centralized question database with 200+ questions</li>
                <li>• Category and subcategory organization</li>
                <li>• Question type support (Likert, Multiple Choice, etc.)</li>
                <li>• Tag-based organization and search</li>
                <li>• Version control and question variations</li>
                <li>• Effectiveness tracking and analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                AI Recommendations (Task 10.2)
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Context-aware question suggestions</li>
                <li>• Multiple recommendation strategies</li>
                <li>• Industry and company size optimization</li>
                <li>• Survey type-specific recommendations</li>
                <li>• Trending and high-performing questions</li>
                <li>• AI-generated question alternatives</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Analytics & Optimization
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Question effectiveness analysis</li>
                <li>• Usage pattern tracking</li>
                <li>• Response rate optimization</li>
                <li>• Category performance comparison</li>
                <li>• AI vs human-created analysis</li>
                <li>• Automated optimization suggestions</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
