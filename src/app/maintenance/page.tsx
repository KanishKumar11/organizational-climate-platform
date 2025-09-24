'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Settings, Clock } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceInfo {
  enabled: boolean;
  message?: string;
  loginEnabled: boolean;
}

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] =
    useState<MaintenanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMaintenanceInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setMaintenanceInfo(data);
      }
    } catch (error) {
      console.error('Error fetching maintenance info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceInfo();
    // Check status every 30 seconds
    const interval = setInterval(fetchMaintenanceInfo, 30000);
    return () => clearInterval(interval);
  }, [fetchMaintenanceInfo]);

  const handleRefresh = () => {
    setLoading(true);
    fetchMaintenanceInfo();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit">
              {maintenanceInfo?.enabled ? (
                <Settings className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {maintenanceInfo?.enabled
                ? 'System Maintenance'
                : 'Access Temporarily Disabled'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {maintenanceInfo?.message ||
                  (maintenanceInfo?.enabled
                    ? 'Our system is currently undergoing scheduled maintenance to improve your experience.'
                    : 'User login has been temporarily disabled by the system administrator.')}
              </p>

              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Status updates every 30 seconds</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Check Status
              </Button>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>If you're a system administrator, you can access the</p>
                <Link
                  href="/admin/system-settings"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Admin Panel
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We apologize for any inconvenience. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
