'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Settings,
  Eye,
  Lock,
} from 'lucide-react';
import { ConsentManager } from '@/components/privacy/ConsentManager';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';
import { toast } from 'sonner';

interface DataExportStatus {
  requested: boolean;
  processing: boolean;
  completed: boolean;
  downloadUrl?: string;
  error?: string;
}

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const [showConsentManager, setShowConsentManager] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [exportStatus, setExportStatus] = useState<DataExportStatus>({
    requested: false,
    processing: false,
    completed: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be signed in to access privacy settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleDataExport = async () => {
    setExportStatus({ requested: true, processing: true, completed: false });

    try {
      const response = await fetch(
        `/api/users/${session.user.id}/data-export`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExportStatus({
          requested: true,
          processing: false,
          completed: true,
          downloadUrl: data.downloadUrl,
        });
        toast.success('Data export completed! Download link is ready.');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setExportStatus({
        requested: true,
        processing: false,
        completed: false,
        error: 'Failed to export data. Please try again.',
      });
      toast.error('Failed to export data. Please try again.');
    }
  };

  const handleAccountDeletion = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/users/${session.user.id}/delete-account`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success(
          'Account deletion request submitted. You will be contacted within 30 days.'
        );
        // Redirect to sign out
        window.location.href = '/api/auth/signout';
      } else {
        throw new Error('Deletion failed');
      }
    } catch (error) {
      toast.error(
        'Failed to process deletion request. Please contact support.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Privacy Settings
        </h1>
        <p className="text-gray-600">
          Manage your privacy preferences, data consent, and account settings.
        </p>
      </div>

      {/* Privacy Consent Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <CardTitle>Data Consent Preferences</CardTitle>
          </div>
          <CardDescription>
            Control how your data is collected and used across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Consent Status</p>
              <p className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>

          <Button
            onClick={() => setShowConsentManager(true)}
            variant="outline"
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Consent Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Data Access & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            <CardTitle>Data Access & Export</CardTitle>
          </div>
          <CardDescription>
            Download a copy of all your personal data stored in our system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>Your data export will include:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Profile information and account details</li>
              <li>Survey responses and demographic data</li>
              <li>Activity logs and usage history</li>
              <li>Consent preferences and privacy settings</li>
            </ul>
          </div>

          {exportStatus.completed && exportStatus.downloadUrl && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your data export is ready!{' '}
                <a
                  href={exportStatus.downloadUrl}
                  className="text-blue-600 hover:text-blue-700 underline"
                  download
                >
                  Download your data
                </a>
              </AlertDescription>
            </Alert>
          )}

          {exportStatus.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{exportStatus.error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleDataExport}
            disabled={exportStatus.processing}
            variant="outline"
            className="w-full"
          >
            {exportStatus.processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-600" />
            <CardTitle>Privacy Policy</CardTitle>
          </div>
          <CardDescription>
            Review our privacy policy and data handling practices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowPrivacyPolicy(true)}
            variant="outline"
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Privacy Policy
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions that will permanently affect your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Account Deletion:</strong> This will permanently delete
              your account and all associated data. This action cannot be
              undone.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 space-y-2">
            <p>When you delete your account:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>All personal information will be permanently removed</li>
              <li>Survey responses will be anonymized for research purposes</li>
              <li>You will lose access to all platform features</li>
              <li>This action cannot be reversed</li>
            </ul>
          </div>

          <Button
            onClick={handleAccountDeletion}
            disabled={isDeleting}
            variant="destructive"
            className="w-full"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing Deletion...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <ConsentManager
        userId={session.user.id}
        companyName="Our Organization"
        showAsModal={true}
        isOpen={showConsentManager}
        onClose={() => setShowConsentManager(false)}
      />

      <PrivacyPolicyModal
        open={showPrivacyPolicy}
        onOpenChange={setShowPrivacyPolicy}
        companyName="Our Organization"
      />
    </div>
  );
}
