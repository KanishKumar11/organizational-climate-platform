'use client';

import { useState, useEffect } from 'react';
import RealTimeMicroclimateVisualization from '@/components/microclimate/RealTimeMicroclimateVisualization';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const mockMicroclimateData = {
  id: 'demo-microclimate-1',
  title: 'Team Pulse Check - Engineering',
  status: 'active' as const,
  response_count: 12,
  target_participant_count: 25,
  participation_rate: 48,
  live_results: {
    sentiment_score: 0.3,
    engagement_level: 'medium' as const,
    top_themes: [
      'collaboration',
      'workload',
      'communication',
      'tools',
      'meetings',
    ],
    word_cloud_data: [
      { text: 'collaboration', value: 8 },
      { text: 'workload', value: 6 },
      { text: 'communication', value: 5 },
      { text: 'tools', value: 4 },
      { text: 'meetings', value: 3 },
      { text: 'deadlines', value: 3 },
      { text: 'support', value: 2 },
      { text: 'feedback', value: 2 },
    ],
    response_distribution: {
      very_positive: 3,
      positive: 4,
      neutral: 3,
      negative: 2,
      very_negative: 0,
    },
  },
  ai_insights: [
    {
      type: 'pattern' as const,
      message:
        'Increased mentions of "workload" suggest team capacity concerns',
      confidence: 0.85,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      type: 'recommendation' as const,
      message:
        'Consider scheduling a team discussion about collaboration tools',
      confidence: 0.72,
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
  ],
  time_remaining: 45, // 45 minutes
};

export default function MicroclimateLiveDemo() {
  const [currentData, setCurrentData] = useState(mockMicroclimateData);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCurrentData((prev) => {
        const newResponseCount =
          prev.response_count + Math.floor(Math.random() * 3);
        const newParticipationRate = Math.min(
          100,
          Math.round((newResponseCount / prev.target_participant_count) * 100)
        );

        // Add new words occasionally
        const newWordCloudData = [...prev.live_results.word_cloud_data];
        if (Math.random() > 0.7) {
          const newWords = [
            'productivity',
            'innovation',
            'stress',
            'balance',
            'growth',
            'clarity',
          ];
          const randomWord =
            newWords[Math.floor(Math.random() * newWords.length)];
          const existingWord = newWordCloudData.find(
            (w) => w.text === randomWord
          );

          if (existingWord) {
            existingWord.value += 1;
          } else {
            newWordCloudData.push({ text: randomWord, value: 1 });
          }
        }

        // Update sentiment slightly
        const sentimentChange = (Math.random() - 0.5) * 0.1;
        const newSentimentScore = Math.max(
          -1,
          Math.min(1, prev.live_results.sentiment_score + sentimentChange)
        );

        // Add new insights occasionally
        const newInsights = [...prev.ai_insights];
        if (Math.random() > 0.8) {
          const insightMessages = [
            'New trend detected: increased focus on work-life balance',
            'Positive sentiment spike detected in recent responses',
            'Recommendation: Follow up on collaboration concerns',
            'Alert: Response rate is below target for this time period',
          ];

          newInsights.unshift({
            type: Math.random() > 0.6 ? 'pattern' : 'recommendation',
            message:
              insightMessages[
                Math.floor(Math.random() * insightMessages.length)
              ],
            confidence: 0.6 + Math.random() * 0.3,
            timestamp: new Date(),
          });

          // Keep only last 10 insights
          if (newInsights.length > 10) {
            newInsights.pop();
          }
        }

        return {
          ...prev,
          response_count: newResponseCount,
          participation_rate: newParticipationRate,
          live_results: {
            ...prev.live_results,
            sentiment_score: newSentimentScore,
            word_cloud_data: newWordCloudData,
            engagement_level:
              newParticipationRate > 70
                ? 'high'
                : newParticipationRate > 40
                  ? 'medium'
                  : 'low',
          },
          ai_insights: newInsights,
          time_remaining: Math.max(0, prev.time_remaining! - 1),
        };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleDataUpdate = (data: any) => {
    console.log('Data updated:', data);
  };

  const simulateNewResponse = () => {
    const responses = [
      { text: 'productivity', sentiment: 0.5 },
      { text: 'stress', sentiment: -0.3 },
      { text: 'teamwork', sentiment: 0.7 },
      { text: 'deadlines', sentiment: -0.2 },
      { text: 'innovation', sentiment: 0.8 },
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    setCurrentData((prev) => {
      const newWordCloudData = [...prev.live_results.word_cloud_data];
      const existingWord = newWordCloudData.find(
        (w) => w.text === randomResponse.text
      );

      if (existingWord) {
        existingWord.value += 1;
      } else {
        newWordCloudData.push({ text: randomResponse.text, value: 1 });
      }

      const newResponseCount = prev.response_count + 1;
      const newParticipationRate = Math.min(
        100,
        Math.round((newResponseCount / prev.target_participant_count) * 100)
      );

      return {
        ...prev,
        response_count: newResponseCount,
        participation_rate: newParticipationRate,
        live_results: {
          ...prev.live_results,
          word_cloud_data: newWordCloudData,
          sentiment_score:
            (prev.live_results.sentiment_score * prev.response_count +
              randomResponse.sentiment) /
            newResponseCount,
        },
      };
    });
  };

  const addAIInsight = () => {
    const insights = [
      {
        type: 'alert',
        message: 'Sudden increase in stress-related keywords detected',
      },
      {
        type: 'pattern',
        message: 'Team collaboration sentiment is trending upward',
      },
      {
        type: 'recommendation',
        message: 'Consider addressing workload distribution concerns',
      },
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];

    setCurrentData((prev) => ({
      ...prev,
      ai_insights: [
        {
          ...randomInsight,
          type: randomInsight.type as 'alert' | 'pattern' | 'recommendation',
          confidence: 0.7 + Math.random() * 0.2,
          timestamp: new Date(),
        },
        ...prev.ai_insights.slice(0, 9), // Keep only last 10
      ],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Demo Controls */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Real-Time Microclimate Demo
              </h1>
              <p className="text-gray-600">
                This demo shows real-time visualization capabilities with
                WebSocket integration
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant={isSimulating ? 'default' : 'secondary'}>
                {isSimulating ? 'SIMULATING' : 'STATIC'}
              </Badge>

              <Button
                onClick={() => setIsSimulating(!isSimulating)}
                variant={isSimulating ? 'destructive' : 'default'}
              >
                {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
              </Button>

              <Button onClick={simulateNewResponse} variant="outline">
                Add Response
              </Button>

              <Button onClick={addAIInsight} variant="outline">
                Add AI Insight
              </Button>
            </div>
          </div>
        </Card>

        {/* Real-Time Visualization */}
        <RealTimeMicroclimateVisualization
          microclimateId={currentData.id}
          initialData={currentData}
          onDataUpdate={handleDataUpdate}
        />

        {/* Technical Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Features Demonstrated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">
                WebSocket Integration
              </h4>
              <p className="text-sm text-blue-700">
                Real-time data updates via Socket.IO
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">
                Animated Word Cloud
              </h4>
              <p className="text-sm text-green-700">
                Framer Motion animations with collision detection
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">
                Live Sentiment Analysis
              </h4>
              <p className="text-sm text-purple-700">
                Real-time sentiment tracking with trends
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900">
                Participation Tracking
              </h4>
              <p className="text-sm text-orange-700">
                Animated progress bars with status alerts
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900">AI Insights Stream</h4>
              <p className="text-sm text-red-700">
                Live AI recommendations and alerts
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Smooth Transitions</h4>
              <p className="text-sm text-gray-700">
                Framer Motion animations throughout
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
