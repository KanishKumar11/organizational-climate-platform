'use client';

import React, { useState, useEffect } from 'react';
import { useDraftRecovery, useTimeUntilExpiry } from '@/hooks/useDraftRecovery';
import {
  DraftRecoveryBanner,
  DraftRecoveryAlert,
  DraftRecoveryContainer,
} from './DraftRecoveryBanner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Database,
  RefreshCw,
  Trash2,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

/**
 * Draft Recovery Demo Component
 *
 * Interactive demonstration of the draft recovery system.
 * Shows how to integrate useDraftRecovery hook with a survey wizard.
 */

export default function DraftRecoveryDemo() {
  // Mock user/company IDs for demo
  const [userId] = useState('demo-user-123');
  const [companyId] = useState('demo-company-456');

  // Draft recovery hook
  const {
    hasDraft,
    draft,
    draftAge,
    isLoading,
    showBanner,
    recoverDraft,
    discardDraft,
    hideBanner,
    checkForDrafts,
    isRecovering,
    isDiscarding,
    recoverError,
    discardError,
  } = useDraftRecovery(userId, companyId, {
    maxAgeHours: 24,
    autoCheck: true,
    onDraftFound: (draft) => {
      console.log('Draft found:', draft);
    },
    onRecover: (draft) => {
      console.log('Draft recovered:', draft);
      // Load draft data into form
      if (draft.step1_data) {
        setFormData((prev) => ({
          ...prev,
          ...(draft.step1_data as any),
        }));
      }
    },
    onDiscard: (draftId) => {
      console.log('Draft discarded:', draftId);
    },
  });

  // Time until expiry hook
  const { timeRemaining, isExpiringSoon, isExpired } = useTimeUntilExpiry(
    draft?.expires_at || null
  );

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
  });

  // Demo state
  const [showAlertVariant, setShowAlertVariant] = useState(false);
  const [bannerPosition, setBannerPosition] = useState<'top' | 'bottom'>('top');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Draft Recovery System Demo
          </h1>
          <p className="text-gray-600 text-lg">
            Interactive demonstration of automatic draft detection and recovery
          </p>
        </div>

        {/* Draft Recovery Banner */}
        <DraftRecoveryContainer show={showBanner && !showAlertVariant}>
          <DraftRecoveryBanner
            draftAge={draftAge}
            currentStep={draft?.current_step}
            saveCount={draft?.auto_save_count}
            timeUntilExpiry={timeRemaining}
            isExpiringSoon={isExpiringSoon}
            onRecover={recoverDraft}
            onDiscard={discardDraft}
            onDismiss={hideBanner}
            isRecovering={isRecovering}
            isDiscarding={isDiscarding}
            position={bannerPosition}
            language="es"
          />
        </DraftRecoveryContainer>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Draft Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Draft Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {hasDraft ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-700">Found</div>
                      <div className="text-xs text-gray-500">{draftAge}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">
                        No Draft
                      </div>
                      <div className="text-xs text-gray-500">Clean state</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Current Step
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-blue-700">
                    {draft?.current_step || 1}/4
                  </div>
                  <div className="text-xs text-gray-500">
                    {draft?.current_step === 1 && 'Basic Info'}
                    {draft?.current_step === 2 && 'Questions'}
                    {draft?.current_step === 3 && 'Targeting'}
                    {draft?.current_step === 4 && 'Scheduling'}
                    {!draft && 'Not started'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Auto-saves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-purple-700">
                    {draft?.auto_save_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total saves</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiry */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expires In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${
                    isExpiringSoon
                      ? 'bg-gradient-to-br from-red-500 to-orange-500'
                      : 'bg-gradient-to-br from-yellow-500 to-amber-500'
                  }
                `}
                >
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div
                    className={`
                    font-semibold
                    ${isExpiringSoon ? 'text-red-700' : 'text-yellow-700'}
                  `}
                  >
                    {timeRemaining || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isExpired
                      ? 'Expired'
                      : isExpiringSoon
                        ? 'Expiring soon!'
                        : 'Time left'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Example */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Survey Form
              </CardTitle>
              <CardDescription>
                Sample form that would integrate with draft recovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alert variant toggle */}
              {showAlertVariant && hasDraft && (
                <DraftRecoveryAlert
                  draftAge={draftAge}
                  onRecover={recoverDraft}
                  onDiscard={discardDraft}
                  isRecovering={isRecovering}
                  isDiscarding={isDiscarding}
                  language="es"
                />
              )}

              {/* Form fields */}
              <div className="space-y-2">
                <Label htmlFor="title">Survey Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Employee Satisfaction Survey"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your survey..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Target Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Form actions */}
              <div className="flex items-center gap-2 pt-4">
                <Button className="flex-1">Continue to Questions</Button>
                <Button variant="outline">Save Draft</Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls & Information */}
          <div className="space-y-6">
            {/* Demo Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Demo Controls
                </CardTitle>
                <CardDescription>Test different scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={checkForDrafts}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Checking...' : 'Check for Drafts'}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowAlertVariant(!showAlertVariant)}
                    className="flex-1"
                    variant="outline"
                  >
                    {showAlertVariant ? 'Banner Variant' : 'Alert Variant'}
                  </Button>

                  <Button
                    onClick={() =>
                      setBannerPosition(
                        bannerPosition === 'top' ? 'bottom' : 'top'
                      )
                    }
                    className="flex-1"
                    variant="outline"
                  >
                    Position: {bannerPosition}
                  </Button>
                </div>

                {showBanner && (
                  <Button
                    onClick={hideBanner}
                    className="w-full"
                    variant="outline"
                  >
                    Hide Banner
                  </Button>
                )}

                {/* Error displays */}
                {recoverError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Recover error: {(recoverError as Error).message}
                    </AlertDescription>
                  </Alert>
                )}

                {discardError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Discard error: {(discardError as Error).message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="features">
                  <TabsList className="w-full">
                    <TabsTrigger value="features" className="flex-1">
                      Features
                    </TabsTrigger>
                    <TabsTrigger value="integration" className="flex-1">
                      Integration
                    </TabsTrigger>
                    <TabsTrigger value="data" className="flex-1">
                      Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="features" className="space-y-2 pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Automatic draft detection on page load</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Age-based filtering (default: 24 hours)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Expiry time tracking with warnings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>One-click recovery or discard</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Beautiful animated UI with Framer Motion</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Two UI variants: Banner and Alert</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Multilingual support (ES/EN)</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="integration" className="pt-4">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-gray-100">
                        {`const {
  hasDraft,
  draft,
  draftAge,
  recoverDraft,
  discardDraft,
  showBanner,
} = useDraftRecovery(
  userId,
  companyId,
  {
    maxAgeHours: 24,
    onRecover: (draft) => {
      // Load into form
      loadFormData(draft);
    },
  }
);`}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="data" className="pt-4">
                    {draft ? (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">ID:</span>
                          <span className="text-gray-600 font-mono text-xs">
                            {draft.id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Version:</span>
                          <span className="text-gray-600">{draft.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Step:</span>
                          <span className="text-gray-600">
                            {draft.current_step}/4
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Saves:</span>
                          <span className="text-gray-600">
                            {draft.auto_save_count}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Created:</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(draft.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Updated:</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(draft.updated_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No draft data available
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
