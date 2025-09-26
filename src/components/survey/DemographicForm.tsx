'use client';

import { DemographicConfig } from '@/models/Survey';
import { IDemographicResponse } from '@/models/Response';
import { EnhancedDemographicForm } from './EnhancedDemographicForm';

interface DemographicFormProps {
  demographics: DemographicConfig[];
  responses: IDemographicResponse[];
  onResponse: (field: string, value: any) => void;
  companyName?: string;
  showGDPRCompliance?: boolean;
  allowOptOut?: boolean;
}

export function DemographicForm({
  demographics,
  responses,
  onResponse,
  companyName,
  showGDPRCompliance = true,
  allowOptOut = true,
}: DemographicFormProps) {
  const handleConsentChange = (consented: boolean) => {
    // Handle consent change - could trigger additional logic
    console.log('Consent changed:', consented);
  };

  return (
    <EnhancedDemographicForm
      demographics={demographics}
      responses={responses}
      onResponse={onResponse}
      onConsentChange={handleConsentChange}
      showGDPRCompliance={showGDPRCompliance}
      companyName={companyName}
      allowOptOut={allowOptOut}
    />
  );
}
