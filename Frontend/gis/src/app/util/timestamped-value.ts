import { TimestampedValue } from '../repositories/types/in/timestamped-value';
import { AbstractTimedStatus, QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QuantitativeTimedStatus, haxx } from '../repositories/types/out/quantitative-timed-status';

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

export function getLatestQuantitativeTimedStatus(entries: Array<AbstractTimedStatus>): QuantitativeTimedStatus {
  if(!entries) {
    return null;
  }
  const last: AbstractTimedStatus = entries[entries.length - 1];

  return last as unknown as QuantitativeTimedStatus;
}
