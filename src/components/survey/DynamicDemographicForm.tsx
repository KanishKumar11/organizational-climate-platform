'use client';

import React, { useState, useId } from 'react';
import { IDemographicField } from '@/models/DemographicField';
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

interface DynamicDemographicFormProps {
  demographicFields: IDemographicField[];
  responses: IDemographicResponse[];
  onResponse: (field: string, value: any) => void;
  onConsentChange: (consented: boolean) => void;
  showGDPRCompliance?: boolean;
  companyName?: string;
  allowOptOut?: boolean;
}

export function DynamicDemographicForm({
  demographicFields,
  responses,
  onResponse,
  onConsentChange,
  showGDPRCompliance = true,
  companyName,
  allowOptOut = true,
}: DynamicDemographicFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [consented, setConsented] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const formId = useId();

  const getResponseValue = (field: string): any => {
    const response = responses.find((r) => r.field === field);
    return response?.value || '';
  };

  const renderField = (field: IDemographicField) => {
    const fieldId = `${formId}-${field.field}`;
    const value = getResponseValue(field.field);

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(value) => onResponse(field.field, value)}
            required={field.required}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
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
            onChange={(e) => onResponse(field.field, e.target.value)}
            required={field.required}
            className="w-full"
          />
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => onResponse(field.field, e.target.value)}
            required={field.required}
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
            onChange={(e) => onResponse(field.field, e.target.value)}
            required={field.required}
            className="w-full"
          />
        );
    }
  };

  const renderFieldWithLabel = (field: IDemographicField) => (
    <div key={field.field} className="space-y-2">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={`${formId}-${field.field}`}
          className="text-sm font-medium text-gray-700"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {field.type === 'select' &&
          field.options &&
          field.options.length > 0 && (
            <HelpCircle className="h-4 w-4 text-gray-400" />
          )}
      </div>
      {renderField(field)}
    </div>
  );

  const requiredFields = demographicFields.filter((field) => field.required);
  const optionalFields = demographicFields.filter((field) => !field.required);

  const hasOptionalFields = optionalFields.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Demographic Information
        </CardTitle>
        <CardDescription>
          {companyName
            ? `Help ${companyName} understand their workforce better`
            : 'Help us understand our community better'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Required Fields */}
        {requiredFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Required Information
            </h3>
            {requiredFields.map(renderFieldWithLabel)}
          </div>
        )}

        {/* Optional Fields */}
        {hasOptionalFields && (
          <Collapsible open={showOptional} onOpenChange={setShowOptional}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Optional Information
                {showOptional ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {optionalFields.map(renderFieldWithLabel)}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* GDPR Compliance Section */}
        {showGDPRCompliance && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="h-4 w-4" />
                  Privacy & Data Protection
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 text-sm">
                    <p>
                      Your demographic information helps us analyze workplace
                      climate trends and improve our services. All data is:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Stored securely and encrypted</li>
                      <li>Used only for aggregated, anonymous analysis</li>
                      <li>Never shared with third parties without consent</li>
                      <li>Retained only as long as necessary</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id={`${formId}-consent`}
                  checked={consented}
                  onCheckedChange={(checked) => {
                    setConsented(checked as boolean);
                    onConsentChange(checked as boolean);
                  }}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={`${formId}-consent`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I consent to the collection and use of my demographic
                    information
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You can withdraw consent at any time by contacting support.
                  </p>
                </div>
              </div>

              {allowOptOut && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id={`${formId}-optout`}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        // Clear all responses if opting out
                        demographicFields.forEach((field) => {
                          onResponse(field.field, '');
                        });
                      }
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={`${formId}-optout`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I prefer not to provide demographic information
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You can still participate in the survey.
                    </p>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
