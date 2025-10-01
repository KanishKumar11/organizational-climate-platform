'use client';

import { useState, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/sanitize';

interface NotificationDropdownProps {
  className?: string;
}

// Error Boundary Component
class NotificationErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Notification component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 sm:h-9 sm:w-9"
            disabled
          >
            <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
            <div className="absolute -top-1 -right-1">
              <Badge
                variant="destructive"
                className="h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                !
              </Badge>
            </div>
          </Button>
        )
      );
    }

    return this.props.children;
  }
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    stats,
    pagination,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getPriorityColor,
    formatRelativeTime,
    refresh,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = notifications.filter(
    (n) => n.status === 'delivered'
  );

  const handleMarkAsRead = async (
    notificationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <NotificationErrorBoundary>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'relative h-10 w-10 sm:h-9 sm:w-9 hover:bg-accent transition-colors',
              className
            )}
            aria-label={`Notifications${stats.unread > 0 ? `, ${stats.unread} unread` : ', no unread notifications'}`}
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
            <AnimatePresence>
              {stats.unread > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge
                    variant="destructive"
                    className="h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
                    aria-label={`${stats.unread} unread notifications`}
                  >
                    {stats.unread > 99 ? '99+' : stats.unread}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80 p-0"
          sideOffset={8}
          role="menu"
          aria-label="Notifications menu"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            role="banner"
          >
            <div>
              <h3 className="font-semibold text-sm" id="notifications-heading">
                Notifications
              </h3>
              <p className="text-xs text-muted-foreground">
                {stats.unread > 0 ? `${stats.unread} unread` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {stats.unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-8 px-2 text-xs"
                  aria-label="Mark all notifications as read"
                >
                  <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                asChild
                aria-label="Notification settings"
              >
                <a href="/settings/notifications">
                  <Settings className="h-3 w-3" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 border-b">
            <div className="p-3 text-center border-r">
              <div className="text-lg font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-3 text-center border-r">
              <div className="text-lg font-bold text-orange-600">
                {stats.today}
              </div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-lg font-bold text-blue-600">
                {stats.thisWeek}
              </div>
              <div className="text-xs text-muted-foreground">This week</div>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {/* Live region for dynamic updates */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {loading && 'Loading notifications'}
              {error && `Error: ${error}`}
              {!loading && notifications.length === 0 && 'No notifications'}
              {!loading &&
                stats.unread > 0 &&
                `${stats.unread} unread notifications`}
            </div>

            {error ? (
              <div
                className="flex flex-col items-center justify-center py-8 px-4"
                role="alert"
                aria-label="Error loading notifications"
              >
                <div className="p-3 bg-red-50 rounded-full mb-3">
                  <X className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-center text-red-900">
                  Failed to load notifications
                </p>
                <p className="text-xs text-red-700 text-center mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => refresh()}
                  aria-label="Retry loading notifications"
                >
                  Try again
                </Button>
              </div>
            ) : loading ? (
              <div
                className="space-y-4 p-4"
                role="status"
                aria-label="Loading notifications"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-6 h-6 bg-muted rounded-full flex-shrink-0 mt-0.5"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-6 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 px-4"
                role="status"
                aria-label="No notifications"
              >
                <div className="p-3 bg-muted rounded-full mb-3">
                  <Bell
                    className="h-6 w-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm font-medium text-center">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <div
                className="divide-y"
                role="list"
                aria-labelledby="notifications-heading"
              >
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'p-4 hover:bg-accent/50 transition-colors cursor-pointer group relative',
                      notification.status === 'delivered' && 'bg-blue-50/30'
                    )}
                    onClick={() =>
                      notification.status === 'delivered' &&
                      markAsRead(notification._id)
                    }
                    role="listitem"
                    aria-label={`${sanitizeText(notification.title)}. ${sanitizeText(notification.message)}. ${formatRelativeTime(notification.created_at)}. ${notification.status === 'delivered' ? 'Unread' : 'Read'}. Priority: ${notification.priority}.`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (notification.status === 'delivered') {
                          markAsRead(notification._id);
                        }
                      }
                    }}
                  >
                    {/* Priority indicator */}
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 rounded-r',
                        notification.priority === 'critical' && 'bg-red-500',
                        notification.priority === 'high' && 'bg-orange-500',
                        notification.priority === 'medium' && 'bg-blue-500',
                        notification.priority === 'low' && 'bg-gray-400'
                      )}
                    />

                    <div className="flex items-start gap-3 ml-2">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-foreground line-clamp-1">
                              {sanitizeText(notification.title)}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {sanitizeText(notification.message)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div
                            className="flex items-center gap-1"
                            role="group"
                            aria-label="Notification actions"
                          >
                            {notification.status === 'delivered' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleMarkAsRead(notification._id, e)
                                }
                                className="h-6 w-6 p-0 hover:bg-green-100"
                                aria-label={`Mark notification "${sanitizeText(notification.title)}" as read`}
                              >
                                <Check
                                  className="h-3 w-3 text-green-600"
                                  aria-hidden="true"
                                />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(notification._id, e)}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                              aria-label={`Delete notification "${sanitizeText(notification.title)}"`}
                            >
                              <Trash2
                                className="h-3 w-3 text-red-600"
                                aria-hidden="true"
                              />
                            </Button>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          {notification.status === 'delivered' && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0.5"
                            >
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  asChild
                >
                  <a href="/notifications">View all notifications</a>
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </NotificationErrorBoundary>
  );
}
