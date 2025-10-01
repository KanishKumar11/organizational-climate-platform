'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface NotificationItem {
  _id: string;
  user_id: string;
  company_id: string;
  type: string;
  channel: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';
  title: string;
  message: string;
  data: Record<string, any>;
  scheduled_for: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Cache for preventing duplicate requests
  const requestCache = useRef<Map<string, Promise<any>>>(new Map());
  
  // Throttling for fetch requests
  const lastFetchTime = useRef<number>(0);
  const FETCH_THROTTLE_MS = 30000; // 30 seconds minimum between automatic fetches
  const MANUAL_REFRESH_THROTTLE_MS = 5000; // 5 seconds for manual refreshes

  // Memoized stats calculation for performance
  const calculatedStats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((n: NotificationItem) => n.status === 'delivered').length,
      today: notifications.filter((n: NotificationItem) => {
        const today = new Date();
        const notificationDate = new Date(n.created_at);
        return notificationDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: notifications.filter((n: NotificationItem) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const notificationDate = new Date(n.created_at);
        return notificationDate >= weekAgo;
      }).length,
    };
  }, [notifications]);

  // Fetch notifications with caching and throttling
  const fetchNotifications = useCallback(async (limit = 20, page = 1, force = false) => {
    if (!user?.id) return;

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    const throttleTime = force ? MANUAL_REFRESH_THROTTLE_MS : FETCH_THROTTLE_MS;
    
    // Throttle requests unless forced
    if (!force && timeSinceLastFetch < throttleTime) {
      console.log(`[useNotifications] Throttling fetch. Wait ${Math.ceil((throttleTime - timeSinceLastFetch) / 1000)}s (${force ? 'manual' : 'auto'})`);
      return;
    }

    // Create cache key
    const cacheKey = `${user.id}-${limit}-${page}`;

    // Check if request is already in progress
    if (!force && requestCache.current.has(cacheKey)) {
      console.log(`[useNotifications] Request already in progress: ${cacheKey}`);
      return requestCache.current.get(cacheKey);
    }

    const request = (async () => {
      try {
        setLoading(true);
        setError(null);
        setCurrentRequest(cacheKey);
        
        // Update last fetch time
        lastFetchTime.current = Date.now();
        
        console.log(`[useNotifications] Fetching notifications for user ${user.id} (page ${page}, limit ${limit}, force: ${force})`);

        const params = new URLSearchParams({
          user_id: user.id,
          limit: limit.toString(),
          page: page.toString(),
          status: 'delivered,opened',
        });

        const response = await fetch(`/api/notifications?${params}`, {
          headers: {
            'Cache-Control': 'no-cache',
          },
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setNotifications(prev => page === 1 ? data.data : [...prev, ...data.data]);
          setPagination(data.pagination);
          setError(null); // Clear any previous errors on successful fetch

          // Stats will be automatically recalculated via memoization
        } else {
          throw new Error(data.message || 'Failed to fetch notifications');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        toast({
          title: 'Error',
          description: 'Failed to load notifications. Please try again.',
        });
      } finally {
        setLoading(false);
        setCurrentRequest(null);
        // Remove from cache after completion
        requestCache.current.delete(cacheKey);
      }
    })();

    // Store in cache
    requestCache.current.set(cacheKey, request);
    return request;
  }, [user?.id, toast]); // Removed notifications from dependencies

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action: 'mark_opened',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, status: 'opened' as const, opened_at: new Date().toISOString() }
              : notification
          )
        );

        // Stats will be automatically recalculated via memoization
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
      });
    }
  }, [toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          action: 'mark_opened',
          user_id: user.id,
          filters: {
            status: 'delivered', // Only mark delivered notifications as read
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.status === 'delivered'
              ? { ...notification, status: 'opened' as const, opened_at: new Date().toISOString() }
              : notification
          )
        );

        // Stats will be automatically recalculated via memoization

        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
      });
    }
  }, [user, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      const data = await response.json();

      if (data.success) {
        // Update local state
        setNotifications(prev => prev.filter(n => n._id !== notificationId));

        // Stats will be automatically recalculated via memoization

        toast({
          title: 'Success',
          description: 'Notification deleted',
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
      });
    }
  }, [toast]);

  // Get notification icon based on type
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'survey_invitation':
        return '📋';
      case 'survey_reminder':
        return '⏰';
      case 'survey_completion':
        return '✅';
      case 'microclimate_invitation':
        return '🌡️';
      case 'user_invitation':
        return '👥';
      case 'action_plan_alert':
        return '📝';
      case 'deadline_reminder':
        return '⚠️';
      case 'ai_insight_alert':
        return '🤖';
      case 'system_notification':
        return '🔔';
      default:
        return '📢';
    }
  }, []);

  // Get notification priority color
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  // Format relative time
  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }, []);

  // Load notifications on mount and when user changes
  useEffect(() => {
    console.log('[useNotifications] useEffect triggered, user?.id:', user?.id);
    if (user?.id) {
      // Initial load should not be throttled
      lastFetchTime.current = 0;
      fetchNotifications();
    }

    // Cleanup function to clear cache when user changes
    return () => {
      console.log('[useNotifications] Cleanup: clearing request cache');
      requestCache.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user?.id to avoid infinite loops

  // TODO: Add polling back later with proper implementation to avoid infinite loops
  // Set up polling for real-time updates (every 30 seconds)
  // useEffect(() => {
  //   if (!user) return;
  //
  //   const interval = setInterval(() => {
  //     fetchNotifications(5, 1); // Only fetch recent notifications for polling
  //   }, 30000); // 30 seconds
  //
  //   return () => clearInterval(interval);
  // }, [user, fetchNotifications]);

  return {
    notifications,
    stats: calculatedStats, // Use memoized stats for better performance
    pagination,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getPriorityColor,
    formatRelativeTime,
    refresh: () => fetchNotifications(20, 1, true), // Force refresh bypasses throttling
  };
}