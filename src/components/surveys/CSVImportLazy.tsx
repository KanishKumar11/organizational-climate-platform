/**
 * CLIMA-007: Lazy-loaded CSV Import
 *
 * Uses papaparse and xlsx libraries - good candidate for code splitting
 */

'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUp } from 'lucide-react';

const CSVImport = React.lazy(() => import('./CSVImport'));

function CSVImportSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          Loading CSV Import...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload area skeleton */}
        <div className="border-2 border-dashed rounded-lg p-12">
          <div className="flex flex-col items-center space-y-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-2 w-16" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CSVImportLazy(props: any) {
  return (
    <Suspense fallback={<CSVImportSkeleton />}>
      <CSVImport {...props} />
    </Suspense>
  );
}
