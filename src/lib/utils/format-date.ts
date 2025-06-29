import { format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format a UTC date to display in UTC+7 timezone
 * @param date - Date object or string in UTC
 * @param formatStr - date-fns format string
 * @returns Formatted date string in UTC+7
 */
export function formatDateUTC7(date: Date | string, formatStr: string = 'dd MMM yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // No need to manually add hours - just format in the correct timezone
  // The Date object already handles timezone conversion when created from UTC string
  return format(dateObj, formatStr, { locale: id });
}

/**
 * Get display time with WIB timezone indicator
 */
export function formatTimeWIB(date: Date | string): string {
  return formatDateUTC7(date, 'HH:mm') + ' WIB';
}

/**
 * Format full date time with WIB
 */
export function formatDateTimeWIB(date: Date | string): string {
  return formatDateUTC7(date, 'dd MMM yyyy HH:mm') + ' WIB';
}