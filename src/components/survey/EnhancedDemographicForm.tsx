'use client';

import React, { useState, useId } from 'react';
import { DemographicConfig } from '@/models/Survey';
import { IDemographicResponse } from '@/models/Response';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
} from 'lucide-react';

interface EnhancedDemographicFormProps {
  demographics: DemographicConfig[];
  responses: IDemographicResponse[];
  onResponse: (field: string, value: any) => void;
  onConsentChange: (consented: boolean) => void;
  showGDPRCompliance?: boolean;
  companyName?: string;
  allowOptOut?: boolean;
}

interface ConsentState {
  dataCollection: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
}

export function EnhancedDemographicForm({
  demographics,
  responses,
  onResponse,
  onConsentChange,
  showGDPRCompliance = true,
  companyName = 'our organization',
  allowOptOut = true,
}: EnhancedDemographicFormProps) {
  const formId = useId();
  const [consent, setConsent] = useState<ConsentState>({
    dataCollection: false,
    analytics: false,
    marketing: false,
    thirdParty: false,
  });
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  const getResponseValue = (field: string) => {
    return responses.find((r) => r.field === field)?.value || '';
  };

  const handleConsentChange = (type: keyof ConsentState, value: boolean) => {
    const newConsent = { ...consent, [type]: value };
    setConsent(newConsent);
    
    // Notify parent component about consent status
    const hasRequiredConsent = newConsent.dataCollection;
    onConsentChange(hasRequiredConsent);
  };

  const requiredDemographics = demographics.filter(d => d.required);
  const optionalDemographics = demographics.filter(d => !d.required);

  const renderField = (demographic: DemographicConfig) => {
    const value = getResponseValue(demographic.field);
    const fieldId = `${formId}-${demographic.field}`;

    switch (demographic.type) {
      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(value) => onResponse(demographic.field, value)}
            required={demographic.required}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {demographic.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => onResponse(demographic.field, e.target.value)}
            required={demographic.required}
            className="w-full"
          />
        );

      case 'text':
      default:
        return (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => onResponse(demographic.field, e.target.value)}
            required={demographic.required}
            className="w-full"
          />
        );
    }
  };

  const renderFieldWithLabel = (demographic: DemographicConfig) => (
    <div key={demographic.field} className="space-y-2">
      <div className="flex items-center gap-2">
        <Label 
          htmlFor={`${formId}-${demographic.field}`}
          className="text-sm font-medium text-gray-700"
        >
          {demographic.label}
          {demographic.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        {!demographic.required && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Optional
          </span>
        )}
      </div>
      {renderField(demographic)}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* GDPR Compliance Section */}
      {showGDPRCompliance && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-900">
                  Data Privacy & Consent
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Your privacy is important to us. Please review and consent to data collection.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Consent */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-data-collection"
                  checked={consent.dataCollection}
                  onCheckedChange={(checked) => 
                    handleConsentChange('dataCollection', checked === true)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="consent-data-collection" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    I consent to the collection and processing of my demographic data
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    This data helps {companyName} analyze survey results by different groups 
                    while maintaining your privacy and confidentiality.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Consents */}
            <div className="space-y-3 pt-2 border-t border-blue-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-analytics"
                  checked={consent.analytics}
                  onCheckedChange={(checked) => 
                    handleConsentChange('analytics', checked === true)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="consent-analytics" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    I consent to using my data for analytics and insights
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Helps improve our services and provide better organizational insights.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Details Toggle */}
            <Collapsible open={showPrivacyDetails} onOpenChange={setShowPrivacyDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  {showPrivacyDetails ? 'Hide' : 'Show'} privacy details
                  {showPrivacyDetails ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="text-xs text-gray-600 space-y-2 bg-white p-3 rounded border">
                  <p><strong>Data Usage:</strong> Your demographic information is used solely for analyzing survey results and improving organizational insights.</p>
                  <p><strong>Data Retention:</strong> Data is retained for 5 years or until you request deletion.</p>
                  <p><strong>Your Rights:</strong> You can access, correct, or delete your data at any time by contacting your administrator.</p>
                  <p><strong>Security:</strong> All data is encrypted and stored securely in compliance with GDPR and industry standards.</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Demographics Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            About You
          </CardTitle>
          <CardDescription>
            Please provide some basic information to help us better understand the survey results.
            {allowOptOut && (
              <span className="block mt-1 text-sm text-blue-600">
                Fields marked as optional can be skipped if you prefer not to share this information.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Fields */}
          {requiredDemographics.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Required Information
              </h3>
              <div className="space-y-4">
                {requiredDemographics.map(renderFieldWithLabel)}
              </div>
            </div>
          )}

          {/* Optional Fields */}
          {optionalDemographics.length > 0 && (
            <div className="space-y-4">
              <Collapsible open={showOptionalFields} onOpenChange={setShowOptionalFields}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      {showOptionalFields ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Optional Information ({optionalDemographics.length} fields)
                    </span>
                    {showOptionalFields ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        These fields are optional and help provide more detailed insights. 
                        You can skip any fields you're not comfortable sharing.
                      </AlertDescription>
                    </Alert>
                    {optionalDemographics.map(renderFieldWithLabel)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 mt-0.5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-700 mb-1">Privacy Commitment</p>
            <p>
              All demographic information is collected and processed in accordance with GDPR 
              and our privacy policy. Your responses are used solely for organizational 
              analysis and are never shared with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
