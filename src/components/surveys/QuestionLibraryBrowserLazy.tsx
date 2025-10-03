/**
 * CLIMA-007: Lazy-loaded Question Library Browser
 *
 * Heavy component with search, filtering, and pagination
 */

'use client';

import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const QuestionLibraryBrowser = React.lazy(
  () => import('./QuestionLibraryBrowser')
);

function LibrarySkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Search bar */}
        <Skeleton className="h-10 w-full" />

        {/* Filters */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Question cards */}
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

export default function QuestionLibraryBrowserLazy(props: any) {
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <QuestionLibraryBrowser {...props} />
    </Suspense>
  );
}
