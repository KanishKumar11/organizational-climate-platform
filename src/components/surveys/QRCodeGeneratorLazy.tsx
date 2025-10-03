/**
 * CLIMA-007: Lazy-loaded QR Code Generator
 *
 * Uses qrcode library which is ~50KB - good candidate for code splitting
 */

'use client';

import React, { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode } from 'lucide-react';

const QRCodeGenerator = React.lazy(() => import('./QRCodeGenerator'));

function QRCodeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Loading QR Code Generator...
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* QR Code placeholder */}
        <Skeleton className="h-64 w-64" />

        {/* Actions skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function QRCodeGeneratorLazy(props: any) {
  return (
    <Suspense fallback={<QRCodeSkeleton />}>
      <QRCodeGenerator {...props} />
    </Suspense>
  );
}
