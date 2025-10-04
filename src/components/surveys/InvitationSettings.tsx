'use client';

import React, { useState } from 'react';
import { Mail, Key, Clock, Palette, Info, Send, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvitationSettingsProps {
  customMessage?: string;
  onCustomMessageChange: (message: string) => void;
  customSubject?: string;
  onCustomSubjectChange: (subject: string) => void;
  includeCredentials?: boolean;
  onIncludeCredentialsChange: (include: boolean) => void;
  sendImmediately?: boolean;
  onSendImmediatelyChange: (send: boolean) => void;
  brandingEnabled?: boolean;
  onBrandingEnabledChange: (enabled: boolean) => void;
  reminderEnabled?: boolean;
  onReminderEnabledChange: (enabled: boolean) => void;
  reminderFrequency?: number;
  onReminderFrequencyChange: (days: number) => void;
  className?: string;
}

export default function InvitationSettings({
  customMessage = '',
  onCustomMessageChange,
  customSubject = '',
  onCustomSubjectChange,
  includeCredentials = false,
  onIncludeCredentialsChange,
  sendImmediately = true,
  onSendImmediatelyChange,
  brandingEnabled = true,
  onBrandingEnabledChange,
  reminderEnabled = true,
  onReminderEnabledChange,
  reminderFrequency = 3,
  onReminderFrequencyChange,
  className,
}: InvitationSettingsProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const defaultSubject = 'You\'re invited to participate in our organizational survey';
  const defaultMessage = `Hello,

You have been invited to participate in our organizational climate survey. Your feedback is valuable and will help us improve our workplace environment.

The survey should take approximately 10-15 minutes to complete. All responses are confidential and will be used solely for improving our organization.

Thank you for your participation!`;

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Email Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Customize the invitation email sent to participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                placeholder={defaultSubject}
                value={customSubject}
                onChange={(e) => onCustomSubjectChange(e.target.value)}
                className="font-medium"
              />
              {!customSubject && (
                <p className="text-xs text-muted-foreground">
                  Default subject will be used if left empty
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message">Custom Message</Label>
              <Textarea
                id="custom-message"
                placeholder={defaultMessage}
                value={customMessage}
                onChange={(e) => onCustomMessageChange(e.target.value)}
                rows={8}
                className="resize-none font-sans"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {customMessage.length} characters
                  {customMessage.length > 500 && ' (keep it concise for better engagement)'}
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {previewMode ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>

            {previewMode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="mt-2 p-4 bg-white rounded border text-sm whitespace-pre-wrap">
                    <strong className="block mb-2">
                      {customSubject || defaultSubject}
                    </strong>
                    {customMessage || defaultMessage}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Credentials & Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              User Credentials
            </CardTitle>
            <CardDescription>
              Manage login credentials for new participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="include-credentials" className="text-sm font-medium">
                  Include login credentials in invitation
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically generate and send username/password for new users
                </p>
              </div>
              <Switch
                id="include-credentials"
                checked={includeCredentials}
                onCheckedChange={onIncludeCredentialsChange}
              />
            </div>

            {includeCredentials && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Security Note:</strong> Temporary passwords will be generated and
                  sent securely. Users will be prompted to change their password on first
                  login.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Sending Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4" />
              Sending Options
            </CardTitle>
            <CardDescription>
              Control when invitations are sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="send-immediately" className="text-sm font-medium">
                  Send invitations immediately
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Send emails as soon as the survey is published
                </p>
              </div>
              <Switch
                id="send-immediately"
                checked={sendImmediately}
                onCheckedChange={onSendImmediatelyChange}
              />
            </div>

            {!sendImmediately && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Invitations will be saved as drafts. You can send them manually from the
                  survey management page.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Reminder Settings
            </CardTitle>
            <CardDescription>
              Automatic reminders for non-respondents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="reminder-enabled" className="text-sm font-medium">
                  Enable automatic reminders
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Send follow-up emails to participants who haven't responded
                </p>
              </div>
              <Switch
                id="reminder-enabled"
                checked={reminderEnabled}
                onCheckedChange={onReminderEnabledChange}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                <Select
                  value={reminderFrequency.toString()}
                  onValueChange={(value) => onReminderFrequencyChange(Number(value))}
                >
                  <SelectTrigger id="reminder-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every day</SelectItem>
                    <SelectItem value="2">Every 2 days</SelectItem>
                    <SelectItem value="3">Every 3 days</SelectItem>
                    <SelectItem value="5">Every 5 days</SelectItem>
                    <SelectItem value="7">Every week</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Reminders will be sent to non-respondents every {reminderFrequency}{' '}
                  {reminderFrequency === 1 ? 'day' : 'days'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Email Branding
            </CardTitle>
            <CardDescription>
              Customize the appearance of invitation emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="branding-enabled" className="text-sm font-medium">
                  Use company branding
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Include company logo and colors in invitation emails
                </p>
              </div>
              <Switch
                id="branding-enabled"
                checked={brandingEnabled}
                onCheckedChange={onBrandingEnabledChange}
              />
            </div>

            {brandingEnabled && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Emails will use your company's configured branding settings (logo, colors,
                  footer). Update these in Company Settings.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base">Invitation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Credentials:</span>
                <Badge variant={includeCredentials ? 'default' : 'secondary'}>
                  {includeCredentials ? 'Included' : 'Not included'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sending:</span>
                <Badge variant={sendImmediately ? 'default' : 'secondary'}>
                  {sendImmediately ? 'Immediate' : 'Manual'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reminders:</span>
                <Badge variant={reminderEnabled ? 'default' : 'secondary'}>
                  {reminderEnabled
                    ? `Every ${reminderFrequency} day${reminderFrequency !== 1 ? 's' : ''}`
                    : 'Disabled'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Branding:</span>
                <Badge variant={brandingEnabled ? 'default' : 'secondary'}>
                  {brandingEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
