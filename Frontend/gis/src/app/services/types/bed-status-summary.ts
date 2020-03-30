import { TimestampedValue } from 'src/app/repositories/types/in/timestamped-value';

export interface BedStatusSummary {
  free: TimestampedValue[]
  full: TimestampedValue[]
  prognosis: TimestampedValue[]
  in24h: TimestampedValue[]
}
