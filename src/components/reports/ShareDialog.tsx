'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Share2,
  Mail,
  Link,
  Calendar,
  Users,
  Eye,
  MessageSquare,
  Edit,
  Copy,
  Check,
  X,
  Plus,
  Clock,
  Download,
  Shield,
} from 'lucide-react';

interface ShareDialogProps {
  reportId: string;
  reportTitle: string;
  onShare?: (type: string) => void;
}

interface ShareOptions {
  recipients: string[];
  message: string;
  permissions: 'view' | 'comment' | 'edit';
  expiresAt?: Date;
  requireLogin: boolean;
  allowDownload: boolean;
}

export function ShareDialog({
  reportId,
  reportTitle,
  onShare,
}: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'link' | 'schedule'>(
    'share'
  );
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    recipients: [],
    message: '',
    permissions: 'view',
    requireLogin: true,
    allowDownload: true,
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [scheduleOptions, setScheduleOptions] = useState({
    name: '',
    frequency: 'weekly',
    time: '09:00',
    recipients: [],
    format: 'pdf',
  });

  const permissionOptions = [
    {
      value: 'view',
      label: 'Can View',
      description: 'Read-only access to the report',
      icon: Eye,
    },
    {
      value: 'comment',
      label: 'Can Comment',
      description: 'View and add comments',
      icon: MessageSquare,
    },
    {
      value: 'edit',
      label: 'Can Edit',
      description: 'Full editing permissions',
      icon: Edit,
    },
  ];

  const addRecipient = () => {
    if (newRecipient && !shareOptions.recipients.includes(newRecipient)) {
      setShareOptions((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient],
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setShareOptions((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareOptions),
      });

      if (!response.ok) {
        throw new Error('Share failed');
      }

      const result = await response.json();
      onShare?.('direct');
      setIsOpen(false);

      // Show success message
      console.log('Report shared successfully:', result);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const createPublicLink = async () => {
    setIsSharing(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/public-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expiresAt: shareOptions.expiresAt,
          requireLogin: shareOptions.requireLogin,
          allowDownload: shareOptions.allowDownload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create public link');
      }

      const result = await response.json();
      setShareUrl(result.publicLink);
      onShare?.('link');
    } catch (error) {
      console.error('Public link error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const scheduleReport = async () => {
    setIsSharing(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scheduleOptions,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule report');
      }

      const result = await response.json();
      onShare?.('schedule');
      setIsOpen(false);

      console.log('Report scheduled successfully:', result);
    } catch (error) {
      console.error('Schedule error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Report: {reportTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'share', label: 'Share with People', icon: Users },
            { id: 'link', label: 'Create Link', icon: Link },
            { id: 'schedule', label: 'Schedule Delivery', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* Share with People Tab */}
          {activeTab === 'share' && (
            <>
              {/* Recipients */}
              <div>
                <h3 className="text-sm font-medium mb-3">Share with</h3>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Enter email address"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    className="flex-1"
                  />
                  <Button onClick={addRecipient} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {shareOptions.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {shareOptions.recipients.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-2">
                        {email}
                        <button
                          onClick={() => removeRecipient(email)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-sm font-medium mb-3">Permissions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {permissionOptions.map((permission) => {
                    const Icon = permission.icon;
                    return (
                      <Card
                        key={permission.value}
                        className={`p-3 cursor-pointer transition-colors ${
                          shareOptions.permissions === permission.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          setShareOptions((prev) => ({
                            ...prev,
                            permissions: permission.value as any,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <div className="flex-1">
                            <span className="font-medium text-sm">
                              {permission.label}
                            </span>
                            <p className="text-xs text-gray-600">
                              {permission.description}
                            </p>
                          </div>
                          {shareOptions.permissions === permission.value && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-sm font-medium mb-3">Message (optional)</h3>
                <textarea
                  placeholder="Add a message for recipients..."
                  value={shareOptions.message}
                  onChange={(e) =>
                    setShareOptions((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Options */}
              <div>
                <h3 className="text-sm font-medium mb-3">Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={shareOptions.requireLogin}
                      onChange={(e) =>
                        setShareOptions((prev) => ({
                          ...prev,
                          requireLogin: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">Require login</span>
                      <p className="text-xs text-gray-600">
                        Recipients must sign in to view the report
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={shareOptions.allowDownload}
                      onChange={(e) =>
                        setShareOptions((prev) => ({
                          ...prev,
                          allowDownload: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium">
                        Allow downloads
                      </span>
                      <p className="text-xs text-gray-600">
                        Recipients can export the report
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Create Link Tab */}
          {activeTab === 'link' && (
            <>
              <div className="text-center py-6">
                <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Create a shareable link
                </h3>
                <p className="text-gray-600 mb-6">
                  Anyone with the link can access this report
                </p>

                {shareUrl ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      Link expires in 7 days
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={createPublicLink}
                    disabled={isSharing}
                    className="gap-2"
                  >
                    {isSharing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4" />
                        Create Link
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Schedule Delivery Tab */}
          {activeTab === 'schedule' && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-3">Schedule Name</h3>
                <Input
                  placeholder="e.g., Weekly Team Report"
                  value={scheduleOptions.name}
                  onChange={(e) =>
                    setScheduleOptions((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Frequency</h3>
                  <select
                    value={scheduleOptions.frequency}
                    onChange={(e) =>
                      setScheduleOptions((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Time</h3>
                  <Input
                    type="time"
                    value={scheduleOptions.time}
                    onChange={(e) =>
                      setScheduleOptions((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Format</h3>
                <div className="flex gap-2">
                  {['pdf', 'excel'].map((format) => (
                    <Button
                      key={format}
                      variant={
                        scheduleOptions.format === format
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() =>
                        setScheduleOptions((prev) => ({
                          ...prev,
                          format,
                        }))
                      }
                      className="capitalize"
                    >
                      {format}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>

          {activeTab === 'share' && (
            <Button
              onClick={handleShare}
              disabled={isSharing || shareOptions.recipients.length === 0}
              className="gap-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Sharing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Share Report
                </>
              )}
            </Button>
          )}

          {activeTab === 'schedule' && (
            <Button
              onClick={scheduleReport}
              disabled={isSharing || !scheduleOptions.name}
              className="gap-2"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Schedule Report
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
