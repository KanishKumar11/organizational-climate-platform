/**
 * CLIMA-007: Lazy-loaded Survey Creation Wizard
 *
 * Uses React.lazy() and Suspense for code splitting to improve initial load time
 */

'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the heavy wizard component
const SurveyCreationWizardNew = React.lazy(
  () => import('./SurveyCreationWizardNew')
);

// Loading fallback component
function WizardSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar skeleton */}
          <Skeleton className="h-2 w-full" />

          {/* Step indicators skeleton */}
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="space-y-4 mt-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex justify-between mt-8">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Lazy-loaded wrapper for Survey Creation Wizard
 */
export default function SurveyCreationWizardLazy(props: any) {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <SurveyCreationWizardNew {...props} />
    </Suspense>
  );
}
