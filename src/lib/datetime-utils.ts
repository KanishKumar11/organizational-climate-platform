/**
 * Utility functions for handling datetime operations, especially for HTML datetime-local inputs
 */

/**
 * Formats a Date object for use with HTML datetime-local input
 * Returns the date in "YYYY-MM-DDTHH:MM" format in the user's local timezone
 * 
 * @param date - The Date object to format
 * @returns Formatted string suitable for datetime-local input
 */
export function formatDateForDatetimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Creates a default start time for microclimate scheduling
 * Returns a time 1 hour from now, formatted for datetime-local input
 * 
 * @returns Formatted datetime string 1 hour from current time
 */
export function getDefaultMicroclimateStartTime(): string {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  return formatDateForDatetimeLocal(oneHourFromNow);
}

/**
 * Converts a datetime-local input value to a Date object
 * The input value is treated as being in the user's local timezone
 * 
 * @param datetimeLocalValue - The value from a datetime-local input
 * @returns Date object representing the local time
 */
export function parseDatetimeLocal(datetimeLocalValue: string): Date {
  // datetime-local format is "YYYY-MM-DDTHH:MM"
  // We need to treat this as local time, not UTC
  return new Date(datetimeLocalValue);
}

/**
 * Converts a Date object to UTC for storage while preserving the intended local time
 * This is useful when you want to store the exact time the user selected
 * 
 * @param localDate - Date object representing local time
 * @returns Date object adjusted to UTC for storage
 */
export function convertLocalDateToUTC(localDate: Date): Date {
  return new Date(localDate.getTime());
}

/**
 * Gets the user's current timezone identifier
 * 
 * @returns Timezone identifier (e.g., "America/New_York", "Europe/London")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Formats a date for display in the user's local timezone
 * 
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date, 
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return date.toLocaleString(undefined, { ...defaultOptions, ...options });
}
