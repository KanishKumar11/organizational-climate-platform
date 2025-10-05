/**
 * Timezone Utilities
 *
 * Provides timezone support for survey scheduling.
 *
 * Features:
 * - List of all timezones with UTC offsets
 * - Get company default timezone
 * - Convert between timezones
 * - Format dates in specific timezone
 * - Validate timezone strings
 *
 * Best Practices:
 * - Uses IANA timezone database (date-fns-tz)
 * - Handles daylight saving time automatically
 * - Type-safe timezone strings
 * - Performance optimized (cached lists)
 */

import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Common timezones for Latin America and North America
 * Grouped by region for better UX
 */
export const TIMEZONE_GROUPS = {
  'América Latina': [
    {
      value: 'America/Mexico_City',
      label: 'Ciudad de México (GMT-6)',
      offset: -6,
    },
    { value: 'America/Monterrey', label: 'Monterrey (GMT-6)', offset: -6 },
    { value: 'America/Cancun', label: 'Cancún (GMT-5)', offset: -5 },
    { value: 'America/Tijuana', label: 'Tijuana (GMT-8)', offset: -8 },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)', offset: -5 },
    { value: 'America/Lima', label: 'Lima (GMT-5)', offset: -5 },
    { value: 'America/Santiago', label: 'Santiago (GMT-3)', offset: -3 },
    {
      value: 'America/Buenos_Aires',
      label: 'Buenos Aires (GMT-3)',
      offset: -3,
    },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)', offset: -3 },
    { value: 'America/Caracas', label: 'Caracas (GMT-4)', offset: -4 },
  ],
  'América del Norte': [
    { value: 'America/New_York', label: 'New York (GMT-5)', offset: -5 },
    { value: 'America/Chicago', label: 'Chicago (GMT-6)', offset: -6 },
    { value: 'America/Denver', label: 'Denver (GMT-7)', offset: -7 },
    { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)', offset: -8 },
    { value: 'America/Phoenix', label: 'Phoenix (GMT-7)', offset: -7 },
    { value: 'America/Toronto', label: 'Toronto (GMT-5)', offset: -5 },
    { value: 'America/Vancouver', label: 'Vancouver (GMT-8)', offset: -8 },
  ],
  Europa: [
    { value: 'Europe/London', label: 'London (GMT+0)', offset: 0 },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)', offset: 1 },
    { value: 'Europe/Berlin', label: 'Berlin (GMT+1)', offset: 1 },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)', offset: 1 },
    { value: 'Europe/Rome', label: 'Rome (GMT+1)', offset: 1 },
  ],
  Asia: [
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)', offset: 9 },
    { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)', offset: 8 },
    { value: 'Asia/Dubai', label: 'Dubai (GMT+4)', offset: 4 },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8)', offset: 8 },
  ],
} as const;

/**
 * Flat list of all timezones (for autocomplete/search)
 */
export const ALL_TIMEZONES = Object.values(TIMEZONE_GROUPS).flat();

/**
 * Type for timezone value
 */
export type TimezoneValue = (typeof ALL_TIMEZONES)[number]['value'];

/**
 * Default timezone (Mexico City)
 */
export const DEFAULT_TIMEZONE: TimezoneValue = 'America/Mexico_City';

/**
 * Get company default timezone
 * This should be called from the company settings or location
 *
 * @param companyId - Company ID
 * @returns Timezone string
 */
export async function getCompanyTimezone(
  companyId: string
): Promise<TimezoneValue> {
  try {
    // Fetch company settings
    const response = await fetch(`/api/companies/${companyId}`);
    const data = await response.json();

    // Return company timezone or default
    return data.company?.timezone || DEFAULT_TIMEZONE;
  } catch (error) {
    console.error('Error fetching company timezone:', error);
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Format date in specific timezone
 *
 * @param date - Date to format
 * @param timezone - IANA timezone string
 * @param formatString - Format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatString: string = 'yyyy-MM-dd HH:mm:ss'
): string {
  return formatInTimeZone(date, timezone, formatString);
}

/**
 * Convert UTC date to specific timezone
 *
 * @param utcDate - UTC Date
 * @param timezone - Target timezone
 * @returns Date in target timezone
 */
export function convertToTimezone(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Convert timezone date to UTC
 *
 * @param localDate - Date in local timezone
 * @param timezone - Source timezone
 * @returns UTC Date
 */
export function convertToUTC(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}

/**
 * Get current time in specific timezone
 *
 * @param timezone - IANA timezone string
 * @returns Current date in timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Get timezone offset in hours
 *
 * @param timezone - IANA timezone string
 * @returns Offset in hours (e.g., -6 for GMT-6)
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Validate timezone string
 *
 * @param timezone - Timezone to validate
 * @returns True if valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get timezone display name
 *
 * @param timezone - IANA timezone string
 * @returns Display name (e.g., "Mexico City (GMT-6)")
 */
export function getTimezoneDisplayName(timezone: string): string {
  const tz = ALL_TIMEZONES.find((t) => t.value === timezone);
  return tz?.label || timezone;
}

/**
 * Search timezones by name
 *
 * @param query - Search query
 * @returns Matching timezones
 */
export function searchTimezones(query: string): typeof ALL_TIMEZONES {
  const lowerQuery = query.toLowerCase();
  return ALL_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(lowerQuery) ||
      tz.value.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get user's browser timezone
 *
 * @returns IANA timezone string
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Check if survey is currently active based on schedule and timezone
 *
 * @param startDate - Survey start date (UTC)
 * @param endDate - Survey end date (UTC)
 * @param timezone - Survey timezone
 * @returns True if survey is active
 */
export function isSurveyActive(
  startDate: Date,
  endDate: Date,
  timezone: string
): boolean {
  const now = getCurrentTimeInTimezone(timezone);
  const start = convertToTimezone(startDate, timezone);
  const end = convertToTimezone(endDate, timezone);

  return now >= start && now <= end;
}

/**
 * Format schedule display text
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @param timezone - Timezone
 * @param language - Display language
 * @returns Formatted schedule text
 */
export function formatScheduleDisplay(
  startDate: Date,
  endDate: Date,
  timezone: string,
  language: 'es' | 'en' = 'es'
): string {
  const format =
    language === 'es'
      ? "d 'de' MMMM yyyy 'a las' HH:mm"
      : "MMMM d, yyyy 'at' HH:mm";

  const startFormatted = formatInTimezone(startDate, timezone, format);
  const endFormatted = formatInTimezone(endDate, timezone, format);

  const tzName = getTimezoneDisplayName(timezone);

  if (language === 'es') {
    return `Del ${startFormatted} al ${endFormatted} (${tzName})`;
  } else {
    return `From ${startFormatted} to ${endFormatted} (${tzName})`;
  }
}
