import { TimestampedValue } from '../repositories/types/in/timestamped-value';

export function getLatest(entries: TimestampedValue[]): number {
  // console.log(entries);
  if (entries === undefined) {
    return NaN;
  }
  if (entries.length === 0) {
    return NaN;
  }
  let currentEntry = entries[0];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].timestamp > currentEntry.timestamp) {
      currentEntry = entries[i];
    }
  }
  return currentEntry.value;
}
