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
 * Converts a datetime-local input value to UTC for database storage
 * The input value represents local time in the user's timezone
 *
 * @param datetimeLocalValue - The value from a datetime-local input (YYYY-MM-DDTHH:MM)
 * @param userTimezone - The user's timezone (e.g., "Asia/Kolkata")
 * @returns Date object in UTC for database storage
 */
export function convertLocalDateTimeToUTC(
  datetimeLocalValue: string,
  userTimezone: string
): Date {
  // Much simpler approach: use the Intl API to handle timezone conversion
  // The datetime-local value represents the exact time the user selected in their timezone

  // Parse the datetime-local components
  const [datePart, timePart] = datetimeLocalValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);

  // Create a date object in UTC that represents the same "wall clock" time
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

  // Now we need to adjust this to account for the user's timezone
  // Get the offset for the user's timezone at this specific date/time
  const testDate = new Date(year, month - 1, day, hours, minutes);

  // Use Intl.DateTimeFormat to get the actual offset
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: userTimezone,
    timeZoneName: 'longOffset',
  });

  // Get timezone offset in a more reliable way
  const offsetString = formatter
    .formatToParts(testDate)
    .find((part) => part.type === 'timeZoneName')?.value;
  let offsetMinutes = 0;

  if (offsetString) {
    // Parse offset string like "GMT+05:30" or "GMT-05:00"
    const match = offsetString.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      offsetMinutes = sign * (hours * 60 + minutes);
    }
  }

  // Adjust the UTC date by subtracting the timezone offset
  // (because we want to store the UTC equivalent of the local time)
  return new Date(utcDate.getTime() - offsetMinutes * 60000);
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
 * @param date - Date to format (assumed to be in UTC from database)
 * @param userTimezone - User's timezone (e.g., "Asia/Kolkata")
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string in user's timezone
 */
export function formatDateForDisplay(
  date: Date,
  userTimezone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: userTimezone || getUserTimezone(),
  };

  return date.toLocaleString(undefined, { ...defaultOptions, ...options });
}

/**
 * Formats a UTC date string for display in the user's timezone
 * This is specifically for dates stored in the database as UTC strings
 *
 * @param utcDateString - UTC date string from database
 * @param userTimezone - User's timezone (e.g., "Asia/Kolkata")
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string in user's timezone
 */
export function formatUTCDateForDisplay(
  utcDateString: string,
  userTimezone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcDateString);
  return formatDateForDisplay(date, userTimezone, options);
}

/**
 * Comprehensive serialization function for datetime objects
 * Recursively converts all Date objects to ISO strings for safe serialization
 *
 * @param obj - Object to serialize
 * @returns Serialized object with all dates converted to ISO strings
 */
export function serializeDatetimes(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDatetimes);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeDatetimes(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Enhanced sanitization function for Next.js serialization
 * Handles circular references and converts dates to ISO strings
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for Next.js serialization
 */
export function sanitizeForSerialization(obj: any): any {
  const seen = new WeakSet();

  function sanitize(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    seen.add(value);

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(sanitize);
    }

    const sanitized: any = {};
    for (const key in value) {
      if (
        value.hasOwnProperty(key) &&
        key !== '__v' &&
        key !== '$__' &&
        key !== '$isNew'
      ) {
        sanitized[key] = sanitize(value[key]);
      }
    }
    return sanitized;
  }

  return sanitize(obj);
}

/**
 * Safely converts a value to a Date object
 *
 * @param value - Value to convert (Date, string, or number)
 * @returns Date object or null if conversion fails
 */
export function safeToDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Safely converts a value to an ISO string
 *
 * @param value - Value to convert (Date, string, or number)
 * @returns ISO string or null if conversion fails
 */
export function safeToISOString(value: any): string | null {
  const date = safeToDate(value);
  return date ? date.toISOString() : null;
}
