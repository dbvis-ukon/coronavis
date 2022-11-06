import { isString } from 'lodash';
import { DateTime } from 'luxon';


export function getDateTime(strDate: string): DateTime {
  let res: DateTime;
  if (strDate !== 'now') {
    res = DateTime.fromISO(strDate);
  } else {
    res = DateTime.now();
  }

  return res;
}

export function getStrDate(date: DateTime): string {
  return date.toISODate();
}

/**
 * This is a replacement for the momentjs.isBetween(min, max, 'day', '[]') function.
 *
 * @param query the date time to query, may be a string in ISO format
 * @param min the min extent date time, may be a string in ISO format
 * @param max the max extent date time, may be a string in ISO format
 * @returns true iff the query is in between (inclusive) the query based on the `day`
 */
export function isBetweenDaysInclusive(query: DateTime | string, min: DateTime | string, max: DateTime | string): boolean {
  if (isString(query)) {
    query = getDateTime(query);
  }
  if (isString(min)) {
    min = getDateTime(min);
  }
  if (isString(max)) {
    max = getDateTime(max);
  }
  return query.startOf('day') >= min.startOf('day') && query.startOf('day') <= max.startOf('day');
}

/**
 * A convenience function to replace moment.max
 *
 * @param a a datetime or iso formatted string
 * @param b a datetime or iso formatted string
 * @returns the maximum of both datetimes
 */
export function maxDateTime(a: DateTime | string, b: DateTime | string): DateTime {
  if (isString(a)) {
    a = getDateTime(a);
  }
  if (isString(b)) {
    b = getDateTime(b);
  }
  return a > b ? a : b;
}
