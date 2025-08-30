'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AnimatedBarChart,
  AnimatedLineChart,
  AnimatedPieChart,
  HeatMap,
  WordCloud,
  SentimentVisualization,
  KPIDisplay,
  RecommendationCard,
} from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Sample data for demonstrations
const barChartData = [
  { name: 'Leadership', value: 85 },
  { name: 'Communication', value: 72 },
  { name: 'Work-Life Balance', value: 68 },
  { name: 'Career Development', value: 79 },
  { name: 'Compensation', value: 74 },
];

const lineChartData = [
  { name: 'Jan', value: 65 },
  { name: 'Feb', value: 68 },
  { name: 'Mar', value: 72 },
  { name: 'Apr', value: 70 },
  { name: 'May', value: 75 },
  { name: 'Jun', value: 78 },
];

const pieChartData = [
  { name: 'Engaged', value: 45 },
  { name: 'Neutral', value: 35 },
  { name: 'Disengaged', value: 20 },
];

const heatMapData = [
  { x: 'Q1', y: 'Engineering', value: 85 },
  { x: 'Q1', y: 'Sales', value: 72 },
  { x: 'Q1', y: 'Marketing', value: 68 },
  { x: 'Q2', y: 'Engineering', value: 88 },
  { x: 'Q2', y: 'Sales', value: 75 },
  { x: 'Q2', y: 'Marketing', value: 71 },
  { x: 'Q3', y: 'Engineering', value: 82 },
  { x: 'Q3', y: 'Sales', value: 78 },
  { x: 'Q3', y: 'Marketing', value: 74 },
];

const wordCloudData = [
  { text: 'Innovation', value: 95, category: 'Culture' },
  { text: 'Collaboration', value: 87, category: 'Teamwork' },
  { text: 'Growth', value: 82, category: 'Development' },
  { text: 'Flexibility', value: 78, category: 'Work-Life' },
  { text: 'Recognition', value: 75, category: 'Rewards' },
  { text: 'Communication', value: 73, category: 'Leadership' },
  { text: 'Trust', value: 70, category: 'Culture' },
  { text: 'Support', value: 68, category: 'Leadership' },
  { text: 'Balance', value: 65, category: 'Work-Life' },
  { text: 'Learning', value: 62, category: 'Development' },
];

const sentimentData = {
  positive: 156,
  neutral: 89,
  negative: 23,
  trend: 'up' as const,
};

const kpiData = [
  {
    id: '1',
    label: 'Employee Engagement',
    value: 78,
    target: 85,
    previousValue: 75,
    format: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 3,
    icon: 'users' as const,
    color: 'green' as const,
  },
  {
    id: '2',
    label: 'Response Rate',
    value: 92,
    target: 95,
    previousValue: 88,
    format: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 4,
    icon: 'target' as const,
    color: 'blue' as const,
  },
  {
    id: '3',
    label: 'Action Plans',
    value: 12,
    target: 15,
    previousValue: 10,
    format: 'number' as const,
    trend: 'up' as const,
    trendValue: 2,
    icon: 'trending-up' as const,
    color: 'purple' as const,
  },
];

const recommendationData = {
  id: '1',
  title: 'Improve Team Communication',
  description:
    'Analysis shows communication gaps between departments. Implementing regular cross-functional meetings could improve collaboration by 25%.',
  type: 'action' as const,
  priority: 'high' as const,
  confidence: 0.87,
  category: 'Communication',
  affectedAreas: ['Engineering', 'Product', 'Design'],
  actions: [
    {
      id: 'a1',
      title: 'Weekly Cross-functional Standups',
      description:
        'Implement weekly 30-minute standups between engineering, product, and design teams.',
      priority: 'high' as const,
      effort: 'low' as const,
      impact: 'high' as const,
      timeline: '2 weeks',
      assignee: 'Team Leads',
    },
    {
      id: 'a2',
      title: 'Communication Training',
      description:
        'Provide communication skills training for team leads and managers.',
      priority: 'medium' as const,
      effort: 'medium' as const,
      impact: 'medium' as const,
      timeline: '1 month',
      assignee: 'HR Team',
    },
  ],
  metrics: {
    current: 68,
    target: 85,
    unit: '%',
  },
};

export default function ChartsDemo() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Data Visualization Components Demo
            </h1>
            <p className="text-gray-600 mt-2">
              Animated charts and visualization components with Framer Motion
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Animations</span>
          </Button>
        </motion.div>

        {/* Basic Charts */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Basic Charts
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card key={`bar-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Animated Bar Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatedBarChart
                  data={barChartData}
                  color="#3B82F6"
                />
              </CardContent>
            </Card>

            <Card key={`line-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Animated Line Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatedLineChart
                  data={lineChartData.map((point, index) => ({
                    x: index,
                    y: point.value,
                    label: point.name,
                  }))}
                  color="#10B981"
                />
              </CardContent>
            </Card>

            <Card key={`pie-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Animated Pie Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatedPieChart
                  data={pieChartData}
                  title="Employee Engagement Distribution"
                  colors={['#10B981', '#F59E0B', '#EF4444']}
                />
              </CardContent>
            </Card>

            <Card key={`heat-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Heat Map</CardTitle>
              </CardHeader>
              <CardContent>
                <HeatMap
                  data={heatMapData}
                  title="Department Performance by Quarter"
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Specialized Visualizations */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Specialized Visualizations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card key={`word-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Interactive Word Cloud</CardTitle>
              </CardHeader>
              <CardContent>
                <WordCloud
                  data={wordCloudData}
                  title="Most Mentioned Topics"
                  height={300}
                  colorScheme="category"
                  interactive={true}
                />
              </CardContent>
            </Card>

            <Card key={`sentiment-${refreshKey}`}>
              <CardHeader>
                <CardTitle>Sentiment Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentVisualization
                  data={sentimentData}
                  title="Response Sentiment Analysis"
                  height={250}
                  showTrend={true}
                />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* KPI Display */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            KPI Dashboard
          </h2>
          <Card key={`kpi-${refreshKey}`}>
            <CardContent className="p-6">
              <KPIDisplay
                kpis={kpiData}
                title="Key Performance Indicators"
                columns={3}
                animated={true}
                showTrends={true}
              />
            </CardContent>
          </Card>
        </motion.section>

        {/* AI Recommendations */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            AI Recommendations
          </h2>
          <div key={`rec-${refreshKey}`}>
            <RecommendationCard
              {...recommendationData}
              animated={true}
              index={0}
              onAccept={() => console.log('Recommendation accepted')}
              onDismiss={() => console.log('Recommendation dismissed')}
              onViewDetails={() => console.log('View details clicked')}
            />
          </div>
        </motion.section>

        {/* Animation Features */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Animation Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Chart Animations
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Staggered bar animations</li>
                    <li>• Smooth line drawing</li>
                    <li>• Pie slice reveals</li>
                    <li>• Heat map cell transitions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">
                    Interactive Elements
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Hover effects and scaling</li>
                    <li>• Word cloud interactions</li>
                    <li>• Expandable recommendations</li>
                    <li>• Animated counters</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Motion Design</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Fade-in animations</li>
                    <li>• Spring physics</li>
                    <li>• Staggered delays</li>
                    <li>• Smooth transitions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
