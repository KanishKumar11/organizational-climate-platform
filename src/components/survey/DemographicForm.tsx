'use client';

import { DemographicConfig } from '@/models/Survey';
import { IDemographicResponse } from '@/models/Response';

interface DemographicFormProps {
  demographics: DemographicConfig[];
  responses: IDemographicResponse[];
  onResponse: (field: string, value: any) => void;
}

export function DemographicForm({
  demographics,
  responses,
  onResponse,
}: DemographicFormProps) {
  const getResponseValue = (field: string) => {
    return responses.find((r) => r.field === field)?.value || '';
  };

  const renderField = (demographic: DemographicConfig) => {
    const value = getResponseValue(demographic.field);

    switch (demographic.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onResponse(demographic.field, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={demographic.required}
          >
            <option value="">Select an option</option>
            {demographic.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onResponse(demographic.field, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={demographic.required}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onResponse(demographic.field, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
            required={demographic.required}
          />
        );
    }
  };

  if (demographics.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">About You</h2>
        <p className="text-gray-600">
          Please provide some basic information to help us better understand the
          survey results.
        </p>
      </div>

      <div className="space-y-4">
        {demographics.map((demographic, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {demographic.label}
              {demographic.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            {renderField(demographic)}
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500">
        <p>
          This demographic information helps us analyze survey results by
          different groups while maintaining your privacy and confidentiality.
        </p>
      </div>
    </div>
  );
}
