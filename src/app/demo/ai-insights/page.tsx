'use client';

import React, { useState } from 'react';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Sample survey responses for testing
const sampleResponses = [
  {
    id: '1',
    questionId: 'comm_1',
    type: 'likert',
    value: 2,
    text: 'How effectively does your team communicate?',
  },
  {
    id: '2',
    questionId: 'comm_2',
    type: 'text',
    value:
      'Communication is poor. We rarely get updates and meetings are unproductive.',
    text: 'Please elaborate on communication challenges',
  },
  {
    id: '3',
    questionId: 'collab_1',
    type: 'likert',
    value: 3,
    text: 'How well does your team collaborate?',
  },
  {
    id: '4',
    questionId: 'collab_2',
    type: 'text',
    value:
      'Collaboration is okay but could be better. Some team members are not responsive.',
    text: 'Describe your collaboration experience',
  },
  {
    id: '5',
    questionId: 'leadership_1',
    type: 'likert',
    value: 1,
    text: 'How satisfied are you with leadership?',
  },
  {
    id: '6',
    questionId: 'leadership_2',
    type: 'text',
    value:
      'Leadership is disconnected from the team. They make decisions without consulting us and the workload is overwhelming.',
    text: 'Share your thoughts on leadership',
  },
  {
    id: '7',
    questionId: 'worklife_1',
    type: 'likert',
    value: 2,
    text: 'How is your work-life balance?',
  },
  {
    id: '8',
    questionId: 'worklife_2',
    type: 'text',
    value:
      'Work-life balance is terrible. I work late every day and weekends. Very stressed.',
    text: 'Describe your work-life balance',
  },
];

const sampleContext = {
  department: 'Engineering',
  role: 'Software Developer',
  tenure: '2 years',
  teamSize: 8,
};

export default function AIInsightsDemoPage() {
  const [responses, setResponses] = useState(sampleResponses);
  const [context, setContext] = useState(sampleContext);

  const addPositiveResponse = () => {
    const positiveResponses = [
      {
        id: `positive_${Date.now()}`,
        questionId: 'satisfaction_1',
        type: 'text',
        value:
          'I really enjoy working here. The team is supportive and leadership is great!',
        text: 'Overall satisfaction',
      },
    ];
    setResponses([...responses, ...positiveResponses]);
  };

  const resetResponses = () => {
    setResponses(sampleResponses);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Insights Demo
          </h1>
          <p className="text-gray-600">
            Test the JavaScript-based AI service for analyzing survey responses
            and generating insights.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sample Data Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Sample Data</h2>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Context</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Department:</strong> {context.department}
                  </p>
                  <p>
                    <strong>Role:</strong> {context.role}
                  </p>
                  <p>
                    <strong>Tenure:</strong> {context.tenure}
                  </p>
                  <p>
                    <strong>Team Size:</strong> {context.teamSize}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Responses ({responses.length})
                </h3>
                <div className="text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                  {responses.map((response, index) => (
                    <div
                      key={response.id}
                      className="border-l-2 border-gray-200 pl-2"
                    >
                      <p className="font-medium">{response.text}</p>
                      <p className="text-gray-500">
                        {response.type === 'likert'
                          ? `Rating: ${response.value}/5`
                          : `"${String(response.value).substring(0, 50)}..."`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={addPositiveResponse}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Add Positive Response
                </Button>
                <Button
                  onClick={resetResponses}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Reset to Original
                </Button>
              </div>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="lg:col-span-2">
            <AIInsightsPanel responses={responses} context={context} />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              JavaScript AI Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-blue-900">
                  Sentiment Analysis
                </h3>
                <p className="text-sm text-blue-700">
                  Analyze emotional tone of text responses
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium text-green-900">Theme Extraction</h3>
                <p className="text-sm text-green-700">
                  Identify key topics and concerns
                </p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-lg">
                <div className="text-2xl mb-2">🧠</div>
                <h3 className="font-medium text-violet-900">AI Insights</h3>
                <p className="text-sm text-violet-700">
                  Generate actionable recommendations
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-medium text-orange-900">
                  Real-time Processing
                </h3>
                <p className="text-sm text-orange-700">
                  No external microservice needed
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
