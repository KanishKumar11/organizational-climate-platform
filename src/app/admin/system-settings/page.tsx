'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Settings,
  Users,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SystemSettings {
  login_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  max_login_attempts: number;
  session_timeout: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
  };
  email_settings: {
    smtp_enabled: boolean;
    from_email: string;
    smtp_host: string;
    smtp_port: number;
  };
}

export default function SystemSettingsPage() {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, isSuperAdmin, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/system-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        toast.error('Failed to load system settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSettings();
    }
  }, [isSuperAdmin]);

  const handleSettingChange = (key: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = key.split('.');
    let current: any = newSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('System settings updated successfully');
        setHasChanges(false);
        // Clear cache by making a status check
        await fetch('/api/system/status');
      } else {
        toast.error('Failed to update system settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving system settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading system settings...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load system settings. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              System Administration
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage global system settings and access controls
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={settings.login_enabled ? 'default' : 'destructive'}>
              {settings.login_enabled ? (
                <>
                  <Unlock className="h-3 w-3 mr-1" /> Login Enabled
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" /> Login Disabled
                </>
              )}
            </Badge>

            <Badge
              variant={settings.maintenance_mode ? 'secondary' : 'outline'}
            >
              {settings.maintenance_mode ? (
                <>
                  <Wrench className="h-3 w-3 mr-1" /> Maintenance
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" /> Operational
                </>
              )}
            </Badge>
          </div>
        </motion.div>

        {/* Access Control Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Control */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    User Login Access
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Control whether users can log into the system
                  </p>
                </div>
                <Switch
                  checked={settings.login_enabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('login_enabled', checked)
                  }
                />
              </div>

              <Separator />

              {/* Maintenance Mode */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Put the system in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) =>
                      handleSettingChange('maintenance_mode', checked)
                    }
                  />
                </div>

                {settings.maintenance_mode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-message">
                      Maintenance Message
                    </Label>
                    <Textarea
                      id="maintenance-message"
                      value={settings.maintenance_message}
                      onChange={(e) =>
                        handleSettingChange(
                          'maintenance_message',
                          e.target.value
                        )
                      }
                      placeholder="Enter message to display to users during maintenance"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Attempts */}
              <div className="space-y-2">
                <Label htmlFor="max-login-attempts">
                  Maximum Login Attempts
                </Label>
                <Input
                  id="max-login-attempts"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_login_attempts}
                  onChange={(e) =>
                    handleSettingChange(
                      'max_login_attempts',
                      parseInt(e.target.value)
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Number of failed login attempts before account lockout
                </p>
              </div>

              <Separator />

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Session Timeout (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="30"
                  max="10080"
                  value={settings.session_timeout}
                  onChange={(e) =>
                    handleSettingChange(
                      'session_timeout',
                      parseInt(e.target.value)
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  How long user sessions remain active (30 minutes to 1 week)
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            size="lg"
            className="min-w-32"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>

        {/* Warning Alert */}
        {(!settings.login_enabled || settings.maintenance_mode) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong>{' '}
                {!settings.login_enabled &&
                  'User login is currently disabled. '}
                {settings.maintenance_mode && 'System is in maintenance mode. '}
                Only super administrators can access the system in this state.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
