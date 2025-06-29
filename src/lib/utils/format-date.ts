import { format, addHours } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format a UTC date to display in UTC+7 timezone
 * @param date - Date object or string in UTC
 * @param formatStr - date-fns format string
 * @returns Formatted date string in UTC+7
 */
export function formatDateUTC7(date: Date | string, formatStr: string = 'dd MMM yyyy HH:mm'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  // Add 7 hours to convert from UTC to UTC+7
  const utc7Date = addHours(dateObj, 7);
  return format(utc7Date, formatStr, { locale: id });
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