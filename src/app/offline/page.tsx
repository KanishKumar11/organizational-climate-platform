'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="p-8 text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m8-10h-6M4 12h6"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        <p className="text-gray-600 mb-6">
          It looks like you've lost your internet connection. Don't worry - any
          survey responses you've started will be saved and submitted when you
          reconnect.
        </p>

        <div className="space-y-4">
          <div
            className={`flex items-center justify-center p-3 rounded-lg ${
              isOnline ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isOnline ? 'Connection restored' : 'No internet connection'}
          </div>

          <Button onClick={handleRetry} disabled={!isOnline} className="w-full">
            {isOnline ? 'Reload Page' : 'Waiting for connection...'}
          </Button>

          <div className="text-sm text-gray-500">
            <p>While offline, you can:</p>
            <ul className="mt-2 space-y-1">
              <li>• Continue taking surveys you've already started</li>
              <li>• Your responses will be saved locally</li>
              <li>• Everything will sync when you reconnect</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
