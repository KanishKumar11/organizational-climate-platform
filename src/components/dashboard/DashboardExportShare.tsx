/**
 * Dashboard export and sharing functionality
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Share,
  FileText,
  Image,
  Mail,
  Link,
  Calendar,
  Settings,
  Eye,
  Lock,
  Globe,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

interface ExportOptions {
  format: 'pdf' | 'png' | 'excel' | 'json';
  includeCharts: boolean;
  includeData: boolean;
  includeInsights: boolean;
  dateRange: string;
  widgets: string[];
  quality: 'low' | 'medium' | 'high';
  orientation: 'portrait' | 'landscape';
}

interface ShareOptions {
  visibility: 'private' | 'company' | 'department' | 'public';
  allowComments: boolean;
  allowDownload: boolean;
  expiresAt?: string;
  password?: string;
  recipients: string[];
  message: string;
}

interface DashboardExportShareProps {
  dashboardId: string;
  dashboardName: string;
  widgets: Array<{
    id: string;
    title: string;
    type: string;
    module: string;
  }>;
  onExport?: (options: ExportOptions) => void;
  onShare?: (options: ShareOptions) => void;
}

const EXPORT_FORMATS = {
  pdf: {
    label: 'PDF Document',
    icon: FileText,
    description: 'High-quality document with charts and data',
  },
  png: {
    label: 'PNG Image',
    icon: Image,
    description: 'High-resolution image of the dashboard',
  },
  excel: {
    label: 'Excel Spreadsheet',
    icon: FileText,
    description: 'Data tables and charts in Excel format',
  },
  json: {
    label: 'JSON Data',
    icon: FileText,
    description: 'Raw data in JSON format for developers',
  },
};

const DATE_RANGES = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
  custom: 'Custom range',
};

const VISIBILITY_OPTIONS = {
  private: { label: 'Private', icon: Lock, description: 'Only you can access' },
  company: {
    label: 'Company',
    icon: Users,
    description: 'Anyone in your company',
  },
  department: {
    label: 'Department',
    icon: Users,
    description: 'Your department members',
  },
  public: { label: 'Public', icon: Globe, description: 'Anyone with the link' },
};

export function DashboardExportShare({
  dashboardId,
  dashboardName,
  widgets,
  onExport,
  onShare,
}: DashboardExportShareProps) {
  const { user } = useAuth();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeData: true,
    includeInsights: true,
    dateRange: '30d',
    widgets: widgets.map((w) => w.id),
    quality: 'high',
    orientation: 'landscape',
  });

  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    visibility: 'private',
    allowComments: false,
    allowDownload: true,
    recipients: [],
    message: '',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (onExport) {
        await onExport(exportOptions);
      } else {
        // Default export implementation
        const response = await fetch('/api/dashboard/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboard_id: dashboardId,
            ...exportOptions,
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${dashboardName}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (onShare) {
        await onShare(shareOptions);
      } else {
        // Default share implementation
        const response = await fetch('/api/dashboard/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dashboard_id: dashboardId,
            ...shareOptions,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setShareUrl(data.share_url);
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Dashboard</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="format" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Export Format</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(EXPORT_FORMATS).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = exportOptions.format === key;

                    return (
                      <Button
                        key={key}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() =>
                          setExportOptions((prev) => ({
                            ...prev,
                            format: key as any,
                          }))
                        }
                        className="flex items-start gap-3 h-auto p-4"
                      >
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div className="text-left">
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs opacity-80">
                            {config.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Date Range</Label>
                <Select
                  value={exportOptions.dateRange}
                  onValueChange={(value) =>
                    setExportOptions((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_RANGES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-charts">Include Charts</Label>
                  <Switch
                    id="include-charts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeCharts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-data">Include Data Tables</Label>
                  <Switch
                    id="include-data"
                    checked={exportOptions.includeData}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeData: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-insights">Include AI Insights</Label>
                  <Switch
                    id="include-insights"
                    checked={exportOptions.includeInsights}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeInsights: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">
                  Widgets to Include
                </Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {widgets.map((widget) => {
                    const moduleColors = getModuleColors(widget.module as any);
                    const isSelected = exportOptions.widgets.includes(
                      widget.id
                    );

                    return (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: moduleColors.primary }}
                          />
                          <span className="text-sm">{widget.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {widget.type}
                          </Badge>
                        </div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setExportOptions((prev) => ({
                              ...prev,
                              widgets: checked
                                ? [...prev.widgets, widget.id]
                                : prev.widgets.filter((id) => id !== widget.id),
                            }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div>
                <Label className="text-base font-medium">Quality</Label>
                <Select
                  value={exportOptions.quality}
                  onValueChange={(value) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      quality: value as any,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Faster)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Best Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Orientation</Label>
                <Select
                  value={exportOptions.orientation}
                  onValueChange={(value) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      orientation: value as any,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Dashboard</DialogTitle>
          </DialogHeader>

          {shareUrl ? (
            <ShareSuccess shareUrl={shareUrl} onCopy={copyShareUrl} />
          ) : (
            <Tabs defaultValue="visibility" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
              </TabsList>

              <TabsContent value="visibility" className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    Who can access
                  </Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(VISIBILITY_OPTIONS).map(([key, config]) => {
                      const Icon = config.icon;
                      const isSelected = shareOptions.visibility === key;

                      return (
                        <Button
                          key={key}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() =>
                            setShareOptions((prev) => ({
                              ...prev,
                              visibility: key as any,
                            }))
                          }
                          className="w-full flex items-center justify-start gap-3 h-auto p-4"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs opacity-80">
                              {config.description}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {shareOptions.visibility === 'public' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="password">
                        Password Protection (Optional)
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={shareOptions.password || ''}
                        onChange={(e) =>
                          setShareOptions((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter password"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="expires">Expires At (Optional)</Label>
                      <Input
                        id="expires"
                        type="datetime-local"
                        value={shareOptions.expiresAt || ''}
                        onChange={(e) =>
                          setShareOptions((prev) => ({
                            ...prev,
                            expiresAt: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissions" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-comments">Allow Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        Let viewers add comments to the dashboard
                      </p>
                    </div>
                    <Switch
                      id="allow-comments"
                      checked={shareOptions.allowComments}
                      onCheckedChange={(checked) =>
                        setShareOptions((prev) => ({
                          ...prev,
                          allowComments: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-download">Allow Download</Label>
                      <p className="text-sm text-muted-foreground">
                        Let viewers download the dashboard
                      </p>
                    </div>
                    <Switch
                      id="allow-download"
                      checked={shareOptions.allowDownload}
                      onCheckedChange={(checked) =>
                        setShareOptions((prev) => ({
                          ...prev,
                          allowDownload: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recipients" className="space-y-4">
                <div>
                  <Label htmlFor="recipients">
                    Email Recipients (Optional)
                  </Label>
                  <Input
                    id="recipients"
                    value={shareOptions.recipients.join(', ')}
                    onChange={(e) =>
                      setShareOptions((prev) => ({
                        ...prev,
                        recipients: e.target.value
                          .split(',')
                          .map((email) => email.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="Enter email addresses separated by commas"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={shareOptions.message}
                    onChange={(e) =>
                      setShareOptions((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Add a personal message..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            {!shareUrl && (
              <>
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleShare} disabled={isSharing}>
                  {isSharing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share className="h-4 w-4 mr-2" />
                      Share Dashboard
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ShareSuccessProps {
  shareUrl: string;
  onCopy: () => void;
}

function ShareSuccess({ shareUrl, onCopy }: ShareSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <h4 className="font-medium text-green-900">
            Dashboard Shared Successfully!
          </h4>
          <p className="text-sm text-green-700">
            Your dashboard is now accessible via the link below.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Share Link</Label>
        <div className="flex gap-2">
          <Input value={shareUrl} readOnly className="font-mono text-sm" />
          <Button onClick={handleCopy} variant="outline">
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Send via Email
        </Button>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </motion.div>
  );
}
