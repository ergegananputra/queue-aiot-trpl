import { toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Formats a date in Asia/Jakarta time zone using date-fns-tz.
 * @param date Date object or string
 * @param pattern date-fns format string
 * @returns formatted string in Asia/Jakarta time
 */
export function formatJakarta(date: Date | string, pattern: string) {
    const timeZone = 'Asia/Jakarta';
    const d = typeof date === 'string' ? new Date(date) : date;
    const zoned = toZonedTime(d, timeZone);
    return formatTz(zoned, pattern, { timeZone });
}