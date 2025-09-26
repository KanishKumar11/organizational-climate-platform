'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Settings, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Eye,
  Database,
  Share2
} from 'lucide-react';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';

interface ConsentPreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  demographics: boolean;
}

interface ConsentManagerProps {
  userId?: string;
  companyName?: string;
  onConsentUpdate?: (preferences: ConsentPreferences) => void;
  showAsModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const CONSENT_CATEGORIES = [
  {
    key: 'essential' as keyof ConsentPreferences,
    title: 'Essential',
    description: 'Required for basic platform functionality',
    icon: Shield,
    required: true,
    details: [
      'User authentication and session management',
      'Security and fraud prevention',
      'Core survey functionality',
      'System administration'
    ]
  },
  {
    key: 'analytics' as keyof ConsentPreferences,
    title: 'Analytics & Insights',
    description: 'Help us understand how the platform is used',
    icon: Database,
    required: false,
    details: [
      'Usage statistics and performance metrics',
      'Survey completion rates and patterns',
      'Feature usage analytics',
      'System optimization data'
    ]
  },
  {
    key: 'demographics' as keyof ConsentPreferences,
    title: 'Demographic Analysis',
    description: 'Enable demographic-based insights and reporting',
    icon: Eye,
    required: false,
    details: [
      'Demographic data collection in surveys',
      'Group-based analysis and reporting',
      'Diversity and inclusion insights',
      'Organizational benchmarking'
    ]
  },
  {
    key: 'personalization' as keyof ConsentPreferences,
    title: 'Personalization',
    description: 'Customize your experience based on your preferences',
    icon: Settings,
    required: false,
    details: [
      'Personalized dashboard layouts',
      'Customized survey recommendations',
      'Tailored notification preferences',
      'Adaptive user interface'
    ]
  },
  {
    key: 'thirdParty' as keyof ConsentPreferences,
    title: 'Third-Party Integrations',
    description: 'Enable integrations with external services',
    icon: Share2,
    required: false,
    details: [
      'Calendar integrations for survey scheduling',
      'Email service integrations',
      'External reporting tools',
      'API access for approved applications'
    ]
  }
];

export function ConsentManager({
  userId,
  companyName = 'Our Organization',
  onConsentUpdate,
  showAsModal = false,
  isOpen = false,
  onClose,
}: ConsentManagerProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false,
    demographics: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Load existing preferences
  useEffect(() => {
    if (userId) {
      loadUserPreferences();
    }
  }, [userId]);

  const loadUserPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/consent-preferences`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : null);
      }
    } catch (error) {
      console.error('Failed to load consent preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${userId}/consent-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setLastUpdated(new Date());
        onConsentUpdate?.(preferences);
        if (showAsModal && onClose) {
          onClose();
        }
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save consent preferences:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const acceptAll = () => {
    const allAccepted: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      thirdParty: true,
      demographics: true,
    };
    setPreferences(allAccepted);
  };

  const acceptEssentialOnly = () => {
    const essentialOnly: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdParty: false,
      demographics: false,
    };
    setPreferences(essentialOnly);
  };

  const renderConsentCategory = (category: typeof CONSENT_CATEGORIES[0]) => {
    const Icon = category.icon;
    const isChecked = preferences[category.key];
    
    return (
      <Card key={category.key} className={`transition-all ${isChecked ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Checkbox
                id={category.key}
                checked={isChecked}
                onCheckedChange={(checked) => 
                  handlePreferenceChange(category.key, checked === true)
                }
                disabled={category.required}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <Label 
                    htmlFor={category.key} 
                    className="font-medium cursor-pointer"
                  >
                    {category.title}
                  </Label>
                  {category.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {category.description}
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {category.details.map((detail, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Privacy Preferences</h2>
        </div>
        <p className="text-gray-600">
          Control how your data is collected and used by {companyName}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={acceptEssentialOnly} size="sm">
          Essential Only
        </Button>
        <Button onClick={acceptAll} size="sm">
          Accept All
        </Button>
      </div>

      {/* Consent Categories */}
      <div className="space-y-3">
        {CONSENT_CATEGORIES.map(renderConsentCategory)}
      </div>

      {/* Privacy Policy Link */}
      <div className="text-center">
        <Button 
          variant="link" 
          onClick={() => setShowPrivacyPolicy(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Info className="h-4 w-4 mr-1" />
          Read our full Privacy Policy
        </Button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {lastUpdated.toLocaleDateString()}
        </div>
      )}

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Important:</strong> You can change these preferences at any time in your account settings. 
          Some features may not work properly if you disable certain data collection categories.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {showAsModal && (
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        open={showPrivacyPolicy}
        onOpenChange={setShowPrivacyPolicy}
        companyName={companyName}
      />
    </div>
  );

  if (showAsModal) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Privacy Preferences</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {content}
    </div>
  );
}
