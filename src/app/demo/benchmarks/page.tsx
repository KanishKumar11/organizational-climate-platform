'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BenchmarkManager from '@/components/benchmarks/BenchmarkManager';
import BenchmarkComparison from '@/components/benchmarks/BenchmarkComparison';
import TrendAnalysis from '@/components/benchmarks/TrendAnalysis';

type ActiveView = 'manager' | 'comparison' | 'trends';

export default function BenchmarksDemo() {
  const [activeView, setActiveView] = useState<ActiveView>('manager');

  const renderActiveView = () => {
    switch (activeView) {
      case 'manager':
        return <BenchmarkManager userRole="company_admin" />;
      case 'comparison':
        return <BenchmarkComparison onClose={() => setActiveView('manager')} />;
      case 'trends':
        return <TrendAnalysis onClose={() => setActiveView('manager')} />;
      default:
        return <BenchmarkManager userRole="company_admin" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      {activeView === 'manager' && (
        <div className="mb-6 flex space-x-4">
          <Button onClick={() => setActiveView('comparison')} variant="outline">
            Compare with Benchmarks
          </Button>
          <Button onClick={() => setActiveView('trends')} variant="outline">
            Analyze Trends
          </Button>
        </div>
      )}

      {/* Active View */}
      {renderActiveView()}
    </div>
  );
}
