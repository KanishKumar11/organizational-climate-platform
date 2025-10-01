'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Save,
} from 'lucide-react';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    email: {
      survey_invitations: true,
      survey_reminders: true,
      survey_completions: true,
      microclimate_updates: true,
      system_notifications: true,
    },
    in_app: {
      survey_invitations: true,
      survey_reminders: true,
      survey_completions: true,
      microclimate_updates: true,
      system_notifications: true,
    },
    push: {
      urgent_alerts: true,
      deadline_reminders: true,
      system_notifications: false,
    },
  });

  const [loading, setLoading] = useState(false);

  const handleSettingChange = (
    category: keyof typeof settings,
    key: string,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would save the settings to the backend
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notification settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              Please sign in to view notification settings.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Notification Settings
            </h1>
            <p className="text-muted-foreground">
              Manage how you receive notifications and updates.
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications via email for important updates and
              activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Invitations</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you're invited to participate in surveys
                </p>
              </div>
              <Switch
                checked={settings.email.survey_invitations}
                onCheckedChange={(checked) =>
                  handleSettingChange('email', 'survey_invitations', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders for upcoming survey deadlines
                </p>
              </div>
              <Switch
                checked={settings.email.survey_reminders}
                onCheckedChange={(checked) =>
                  handleSettingChange('email', 'survey_reminders', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Completions</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when surveys you participated in are completed
                </p>
              </div>
              <Switch
                checked={settings.email.survey_completions}
                onCheckedChange={(checked) =>
                  handleSettingChange('email', 'survey_completions', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Microclimate Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about microclimate activities and results
                </p>
              </div>
              <Switch
                checked={settings.email.microclimate_updates}
                onCheckedChange={(checked) =>
                  handleSettingChange('email', 'microclimate_updates', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Important system announcements and maintenance updates
                </p>
              </div>
              <Switch
                checked={settings.email.system_notifications}
                onCheckedChange={(checked) =>
                  handleSettingChange('email', 'system_notifications', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Receive notifications within the application interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Invitations</Label>
                <p className="text-sm text-muted-foreground">
                  In-app notifications for survey invitations
                </p>
              </div>
              <Switch
                checked={settings.in_app.survey_invitations}
                onCheckedChange={(checked) =>
                  handleSettingChange('in_app', 'survey_invitations', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  In-app reminders for survey deadlines
                </p>
              </div>
              <Switch
                checked={settings.in_app.survey_reminders}
                onCheckedChange={(checked) =>
                  handleSettingChange('in_app', 'survey_reminders', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Survey Completions</Label>
                <p className="text-sm text-muted-foreground">
                  In-app notifications for completed surveys
                </p>
              </div>
              <Switch
                checked={settings.in_app.survey_completions}
                onCheckedChange={(checked) =>
                  handleSettingChange('in_app', 'survey_completions', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Microclimate Updates</Label>
                <p className="text-sm text-muted-foreground">
                  In-app updates for microclimate activities
                </p>
              </div>
              <Switch
                checked={settings.in_app.microclimate_updates}
                onCheckedChange={(checked) =>
                  handleSettingChange('in_app', 'microclimate_updates', checked)
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  In-app system announcements
                </p>
              </div>
              <Switch
                checked={settings.in_app.system_notifications}
                onCheckedChange={(checked) =>
                  handleSettingChange('in_app', 'system_notifications', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Push Notifications
              <Badge variant="secondary" className="ml-2">
                Coming Soon
              </Badge>
            </CardTitle>
            <CardDescription>
              Receive push notifications on your mobile device (when available).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Urgent Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Critical alerts and immediate action required notifications
                </p>
              </div>
              <Switch
                checked={settings.push.urgent_alerts}
                onCheckedChange={(checked) =>
                  handleSettingChange('push', 'urgent_alerts', checked)
                }
                disabled
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Deadline Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Push notifications for approaching deadlines
                </p>
              </div>
              <Switch
                checked={settings.push.deadline_reminders}
                onCheckedChange={(checked) =>
                  handleSettingChange('push', 'deadline_reminders', checked)
                }
                disabled
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Push notifications for system updates
                </p>
              </div>
              <Switch
                checked={settings.push.system_notifications}
                onCheckedChange={(checked) =>
                  handleSettingChange('push', 'system_notifications', checked)
                }
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Notification Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(settings.email).filter(Boolean).length}
                </div>
                <div className="text-sm text-blue-700">
                  Email notifications enabled
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Bell className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(settings.in_app).filter(Boolean).length}
                </div>
                <div className="text-sm text-green-700">
                  In-app notifications enabled
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Smartphone className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-600">
                  {Object.values(settings.push).filter(Boolean).length}
                </div>
                <div className="text-sm text-gray-700">
                  Push notifications enabled
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
