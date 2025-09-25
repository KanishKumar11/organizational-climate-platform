'use client';

import React, { useState, useEffect, useId } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Building,
  Save,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Settings,
  Palette,
  Bell,
  Shield,
  Clock,
} from 'lucide-react';

interface CompanySettings {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  branding?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  };
  settings?: {
    timezone?: string;
    date_format?: string;
    language?: string;
    currency?: string;
    email_notifications?: boolean;
    survey_reminders?: boolean;
    data_retention_days?: number;
  };
  created_at: string;
  updated_at: string;
}

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Government',
  'Non-profit',
  'Other',
];

const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function CompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/admin/company-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.company);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/company-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<CompanySettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  const updateNestedSettings = (
    section: keyof CompanySettings,
    updates: Record<string, unknown>
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...((settings[section] as Record<string, unknown>) || {}),
        ...updates,
      },
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load company settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600">
            Manage your organization's configuration
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loading size="sm" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <Input
                  value={settings.name}
                  onChange={(e) => updateSettings({ name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={settings.description || ''}
                  onChange={(e) =>
                    updateSettings({ description: e.target.value })
                  }
                  placeholder="Brief description of your company"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={settings.industry || ''}
                    onChange={(e) =>
                      updateSettings({ industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={settings.size || ''}
                    onChange={(e) => updateSettings({ size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} employees
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={settings.website || ''}
                    onChange={(e) =>
                      updateSettings({ website: e.target.value })
                    }
                    placeholder="https://www.company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={settings.email || ''}
                    onChange={(e) => updateSettings({ email: e.target.value })}
                    placeholder="contact@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={settings.phone || ''}
                    onChange={(e) => updateSettings({ phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <Input
                    value={settings.address?.street || ''}
                    onChange={(e) =>
                      updateNestedSettings('address', {
                        street: e.target.value,
                      })
                    }
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Input
                    value={settings.address?.city || ''}
                    onChange={(e) =>
                      updateNestedSettings('address', { city: e.target.value })
                    }
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <Input
                    value={settings.address?.state || ''}
                    onChange={(e) =>
                      updateNestedSettings('address', { state: e.target.value })
                    }
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Input
                    value={settings.address?.country || ''}
                    onChange={(e) =>
                      updateNestedSettings('address', {
                        country: e.target.value,
                      })
                    }
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    value={settings.address?.postal_code || ''}
                    onChange={(e) =>
                      updateNestedSettings('address', {
                        postal_code: e.target.value,
                      })
                    }
                    placeholder="10001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.branding?.primary_color || '#3B82F6'}
                    onChange={(e) =>
                      updateNestedSettings('branding', {
                        primary_color: e.target.value,
                      })
                    }
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.branding?.primary_color || '#3B82F6'}
                    onChange={(e) =>
                      updateNestedSettings('branding', {
                        primary_color: e.target.value,
                      })
                    }
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.branding?.secondary_color || '#6B7280'}
                    onChange={(e) =>
                      updateNestedSettings('branding', {
                        secondary_color: e.target.value,
                      })
                    }
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={settings.branding?.secondary_color || '#6B7280'}
                    onChange={(e) =>
                      updateNestedSettings('branding', {
                        secondary_color: e.target.value,
                      })
                    }
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo & Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <Input
                  value={settings.branding?.logo_url || ''}
                  onChange={(e) =>
                    updateNestedSettings('branding', {
                      logo_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={settings.branding?.font_family || 'Inter'}
                  onChange={(e) =>
                    updateNestedSettings('branding', {
                      font_family: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>

              <Button variant="outline" className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Receive email notifications for important events
                </p>
              </div>
              <EmailNotificationsCheckbox
                checked={settings.settings?.email_notifications ?? true}
                onCheckedChange={(checked) =>
                  updateNestedSettings('settings', {
                    email_notifications: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Survey Reminders</h4>
                <p className="text-sm text-gray-600">
                  Send reminders for pending surveys
                </p>
              </div>
              <SurveyRemindersCheckbox
                checked={settings.settings?.survey_reminders ?? true}
                onCheckedChange={(checked) =>
                  updateNestedSettings('settings', {
                    survey_reminders: checked,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Retention (Days)
              </label>
              <Input
                type="number"
                value={settings.settings?.data_retention_days || 365}
                onChange={(e) =>
                  updateNestedSettings('settings', {
                    data_retention_days: parseInt(e.target.value),
                  })
                }
                placeholder="365"
                min="30"
                max="2555"
              />
              <p className="text-sm text-gray-500 mt-1">
                How long to keep survey data before automatic deletion
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={settings.settings?.timezone || 'America/New_York'}
                onChange={(e) =>
                  updateNestedSettings('settings', { timezone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Checkbox components for settings
interface SettingsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function EmailNotificationsCheckbox({
  checked,
  onCheckedChange,
}: SettingsCheckboxProps) {
  const checkboxId = useId();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={`${checkboxId}-description`}
      />
      <Label htmlFor={checkboxId} className="sr-only">
        Enable email notifications
      </Label>
    </div>
  );
}

function SurveyRemindersCheckbox({
  checked,
  onCheckedChange,
}: SettingsCheckboxProps) {
  const checkboxId = useId();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={`${checkboxId}-description`}
      />
      <Label htmlFor={checkboxId} className="sr-only">
        Enable survey reminders
      </Label>
    </div>
  );
}
