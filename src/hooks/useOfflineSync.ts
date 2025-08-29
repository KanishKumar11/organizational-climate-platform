'use client';

import { useState, useEffect, useCallback } from 'react';

interface PendingData {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingData, setPendingData] = useState<PendingData[]>([]);

  // Check online status
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

  // Load pending data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('offline_pending_data');
    if (stored) {
      try {
        setPendingData(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse pending data:', error);
        localStorage.removeItem('offline_pending_data');
      }
    }
  }, []);

  // Save pending data to localStorage
  const savePendingData = useCallback((data: PendingData[]) => {
    localStorage.setItem('offline_pending_data', JSON.stringify(data));
    setPendingData(data);
  }, []);

  // Add data to sync queue
  const addToSyncQueue = useCallback(
    (url: string, method: string, data: any) => {
      const newItem: PendingData = {
        id: `${Date.now()}_${Math.random()}`,
        url,
        method,
        data,
        timestamp: Date.now(),
      };

      const updated = [...pendingData, newItem];
      savePendingData(updated);
    },
    [pendingData, savePendingData]
  );

  // Sync pending data when online
  const syncPendingData = useCallback(async () => {
    if (!isOnline || pendingData.length === 0) return;

    const successful: string[] = [];
    const failed: PendingData[] = [];

    for (const item of pendingData) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
        });

        if (response.ok) {
          successful.push(item.id);
          console.log('Successfully synced offline data:', item.id);
        } else {
          failed.push(item);
          console.error(
            'Failed to sync offline data:',
            item.id,
            response.status
          );
        }
      } catch (error) {
        failed.push(item);
        console.error('Error syncing offline data:', item.id, error);
      }
    }

    // Update pending data (remove successful items)
    const remaining = pendingData.filter(
      (item) => !successful.includes(item.id)
    );
    savePendingData(remaining);

    if (successful.length > 0) {
      console.log(`Successfully synced ${successful.length} offline items`);
    }

    if (failed.length > 0) {
      console.warn(`Failed to sync ${failed.length} offline items`);
    }
  }, [isOnline, pendingData, savePendingData]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingData.length > 0) {
      // Delay sync slightly to ensure connection is stable
      const timer = setTimeout(syncPendingData, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingData.length, syncPendingData]);

  // Store survey response offline
  const storeSurveyResponseOffline = useCallback(
    (surveyId: string, responseData: any) => {
      const url = `/api/surveys/${surveyId}/responses`;
      addToSyncQueue(url, 'POST', responseData);
    },
    [addToSyncQueue]
  );

  // Check if survey response is stored offline
  const hasPendingSurveyResponse = useCallback(
    (surveyId: string) => {
      return pendingData.some(
        (item) =>
          item.url.includes(`/surveys/${surveyId}/responses`) &&
          item.data.is_complete
      );
    },
    [pendingData]
  );

  return {
    isOnline,
    pendingData,
    syncPendingData,
    addToSyncQueue,
    storeSurveyResponseOffline,
    hasPendingSurveyResponse,
    hasPendingData: pendingData.length > 0,
  };
}
