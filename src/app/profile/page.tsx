'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  User,
  Settings,
  Shield,
  Activity,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  LogIn,
  Calendar,
  FileText,
  Users,
  AlertCircle,
  Download,
  Trash2,
  Edit,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    language: 'en',
  });

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Activity state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [hasLoadedActivities, setHasLoadedActivities] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLimit] = useState(10);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    try {
      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (response.ok) {
        toast.success('Preferences saved');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };

  const loadActivities = useCallback(async (page = 1) => {
    setActivitiesLoading(true);
    try {
      const offset = (page - 1) * activityLimit;
      const response = await fetch(`/api/profile/activity?limit=${activityLimit}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Activity API Response:', data);
        console.log('Activities received:', data.activities?.length || 0);
        setActivities(data.activities || []);
        setActivityTotal(data.total || 0);
        setHasMoreActivities(data.hasMore || false);
        setActivityPage(page);
        setHasLoadedActivities(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Activity API Error:', response.status, errorData);
        toast.error(`Failed to load activity data: ${response.status}`);
      }
    } catch (error) {
      console.error('Activity fetch error:', error);
      toast.error('Failed to load activity data');
    } finally {
      setActivitiesLoading(false);
    }
  }, [activityLimit]);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSecuritySettingChange = (key, value) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivities(1);
    }
  }, [activeTab, loadActivities]);

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (type) {
      case 'survey_created':
        return <Plus {...iconProps} className="h-4 w-4 text-blue-600" />;
      case 'survey_updated':
        return <Edit {...iconProps} className="h-4 w-4 text-indigo-600" />;
      case 'company_created':
        return <Users {...iconProps} className="h-4 w-4 text-green-600" />;
      case 'login':
        return <LogIn {...iconProps} className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut {...iconProps} className="h-4 w-4 text-gray-600" />;
      case 'password_changed':
        return <Key {...iconProps} className="h-4 w-4 text-orange-600" />;
      case 'profile_updated':
        return <User {...iconProps} className="h-4 w-4 text-purple-600" />;
      case 'export':
        return <Download {...iconProps} className="h-4 w-4 text-teal-600" />;
      case 'create':
        return <Plus {...iconProps} className="h-4 w-4 text-blue-600" />;
      case 'update':
        return <Edit {...iconProps} className="h-4 w-4 text-indigo-600" />;
      case 'delete':
        return <Trash2 {...iconProps} className="h-4 w-4 text-red-600" />;
      default:
        return <Activity {...iconProps} className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                Loading profile...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Modern Page Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Profile Settings
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Manage your account settings, preferences, security options,
                    and view your activity history.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="secondary" className="capitalize">
                        {profile?.role?.replace('_', ' ') ||
                          user?.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white/50 backdrop-blur-sm rounded-xl border shadow-sm">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {profile?.name?.charAt(0) || user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {profile?.name || user?.name}
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      {profile?.email || user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {profile?.role?.replace('_', ' ') ||
                          user?.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Department
                    </label>
                    <p className="mt-2 text-lg font-medium text-gray-900">
                      {profile?.department || 'Not assigned'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Join Date
                    </label>
                    <p className="mt-2 text-lg font-medium text-gray-900">
                      {profile?.joinDate || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6 space-y-6">
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      Theme
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) =>
                      handlePreferenceChange('theme', value)
                    }
                  >
                    <SelectTrigger className="w-40 bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      Notifications
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive email notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.notifications}
                    onCheckedChange={(checked) =>
                      handlePreferenceChange('notifications', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">
                      Language
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select your language
                    </p>
                  </div>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      handlePreferenceChange('language', value)
                    }
                  >
                    <SelectTrigger className="w-40 bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleSavePreferences}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            {/* Change Password */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-red-600" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-md"
                >
                  <Key className="h-4 w-4 mr-2" />
                  {changingPassword
                    ? 'Changing Password...'
                    : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <div>
                    <p className="font-semibold text-gray-900">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Secure your account with two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      handleSecuritySettingChange('twoFactorEnabled', checked)
                    }
                  />
                </div>
                {securitySettings.twoFactorEnabled && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      Two-factor authentication is enabled. You'll be prompted
                      for a code when signing in.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Management */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage your active login sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        {navigator.userAgent.includes('Chrome')
                          ? 'Chrome'
                          : navigator.userAgent.includes('Firefox')
                            ? 'Firefox'
                            : navigator.userAgent.includes('Safari')
                              ? 'Safari'
                              : 'Browser'}{' '}
                        on {navigator.platform}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after period of inactivity
                    </p>
                  </div>
                  <Select
                    value={securitySettings.sessionTimeout.toString()}
                    onValueChange={(value) =>
                      handleSecuritySettingChange(
                        'sessionTimeout',
                        parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6 space-y-6">
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-600" />
                      Activity Log
                    </CardTitle>
                    <CardDescription>
                      Your recent account activity and system events
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasLoadedActivities(false);
                      loadActivities(1);
                    }}
                    disabled={activitiesLoading}
                    className="ml-4"
                  >
                    {activitiesLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {activitiesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading your activity history...
                    </p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-indigo-50 rounded-full w-fit mx-auto mb-4">
                      <Activity className="h-12 w-12 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Activity Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Your recent actions and system events will appear here
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px]">Type</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[200px]">Date & Time</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.map((activity, index) => (
                            <TableRow key={activity.id || index} className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex items-center justify-center p-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border">
                                  {getActivityIcon(activity.type)}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {activity.title}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {activity.description}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {new Date(
                                      activity.timestamp || activity.created_at
                                    ).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      activity.timestamp || activity.created_at
                                    ).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={activity.success === false ? 'destructive' : 'outline'}
                                  className="text-xs capitalize"
                                >
                                  {activity.type.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {((activityPage - 1) * activityLimit) + 1} to {Math.min(activityPage * activityLimit, activityTotal)} of {activityTotal} activities
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadActivities(activityPage - 1)}
                          disabled={activityPage === 1 || activitiesLoading}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const totalPages = Math.ceil(activityTotal / activityLimit);
                            const maxPagesToShow = 5;
                            let startPage = Math.max(1, activityPage - Math.floor(maxPagesToShow / 2));
                            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
                            
                            // Adjust startPage if we're near the end
                            if (endPage - startPage < maxPagesToShow - 1) {
                              startPage = Math.max(1, endPage - maxPagesToShow + 1);
                            }
                            
                            const pages = [];
                            
                            // Always show first page
                            if (startPage > 1) {
                              pages.push(
                                <Button
                                  key={1}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadActivities(1)}
                                  disabled={activitiesLoading}
                                  className="w-8 h-8 p-0"
                                >
                                  1
                                </Button>
                              );
                              if (startPage > 2) {
                                pages.push(<span key="ellipsis1" className="px-2">...</span>);
                              }
                            }
                            
                            // Show page range
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant={activityPage === i ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => loadActivities(i)}
                                  disabled={activitiesLoading}
                                  className="w-8 h-8 p-0"
                                >
                                  {i}
                                </Button>
                              );
                            }
                            
                            // Always show last page
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(<span key="ellipsis2" className="px-2">...</span>);
                              }
                              pages.push(
                                <Button
                                  key={totalPages}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadActivities(totalPages)}
                                  disabled={activitiesLoading}
                                  className="w-8 h-8 p-0"
                                >
                                  {totalPages}
                                </Button>
                              );
                            }
                            
                            return pages;
                          })()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadActivities(activityPage + 1)}
                          disabled={activityPage >= Math.ceil(activityTotal / activityLimit) || activitiesLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
