import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * CLIMA-004: Survey Scheduler Component
 *
 * Timezone-aware scheduling with:
 * - Start date & time
 * - End date & time (required)
 * - Timezone selection
 * - Validation: Start < End
 */

interface SurveySchedulerProps {
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  onChange: (data: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  }) => void;
  error?: string;
}

// Common timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)' },
  { value: 'America/Bogota', label: 'Colombia (COT)' },
  { value: 'America/Lima', label: 'Peru (PET)' },
  { value: 'America/Santiago', label: 'Chile (CLT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (ART)' },
  { value: 'America/Sao_Paulo', label: 'Brazil (BRT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Madrid', label: 'Spain (CET)' },
  { value: 'UTC', label: 'UTC' },
];

export default function SurveyScheduler({
  startDate,
  endDate,
  timezone = 'America/New_York',
  onChange,
  error,
}: SurveySchedulerProps) {
  const [localStartDate, setLocalStartDate] = useState<string>(
    startDate ? formatDateTimeLocal(startDate) : formatDateTimeLocal(new Date())
  );
  const [localEndDate, setLocalEndDate] = useState<string>(
    endDate
      ? formatDateTimeLocal(endDate)
      : formatDateTimeLocal(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [validationError, setValidationError] = useState<string>('');

  function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const validateAndUpdate = (
    newStartDate: string,
    newEndDate: string,
    newTimezone: string
  ) => {
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);

    // Validation: End must be after Start
    if (end <= start) {
      setValidationError('End date must be after start date');
      return;
    }

    // Validation: Start must be in the future (optional, can be removed)
    const now = new Date();
    if (start < now) {
      setValidationError('Start date should be in the future');
      // Allow but warn
    } else {
      setValidationError('');
    }

    onChange({
      startDate: start,
      endDate: end,
      timezone: newTimezone,
    });
  };

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    validateAndUpdate(value, localEndDate, selectedTimezone);
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    validateAndUpdate(localStartDate, value, selectedTimezone);
  };

  const handleTimezoneChange = (value: string) => {
    setSelectedTimezone(value);
    validateAndUpdate(localStartDate, localEndDate, value);
  };

  // Calculate duration
  const calculateDuration = () => {
    if (localStartDate && localEndDate) {
      const start = new Date(localStartDate);
      const end = new Date(localEndDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''}${
          diffHours > 0 ? ` ${diffHours} hour${diffHours > 1 ? 's' : ''}` : ''
        }`;
      }
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Timezone Selector */}
      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timezone
        </Label>
        <Select value={selectedTimezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger id="timezone">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All dates and times will be displayed in this timezone
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date & Time */}
        <div className="space-y-2">
          <Label htmlFor="start-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Start Date & Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="start-date"
            type="datetime-local"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* End Date & Time */}
        <div className="space-y-2">
          <Label htmlFor="end-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            End Date & Time <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end-date"
            type="datetime-local"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full"
            required
          />
        </div>
      </div>

      {/* Duration Display */}
      {localStartDate && localEndDate && !validationError && (
        <div className="p-3 bg-muted/50 rounded-md text-sm">
          <div className="font-medium">Survey Duration</div>
          <div className="text-muted-foreground">{calculateDuration()}</div>
        </div>
      )}

      {/* Validation Error */}
      {(validationError || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError || error}</AlertDescription>
        </Alert>
      )}

      {/* Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> The survey will be accessible to respondents
          only between the start and end times. After the end time, the survey
          will automatically close and no new responses will be accepted.
        </p>
      </div>
    </div>
  );
}
