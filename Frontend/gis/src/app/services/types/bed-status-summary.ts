import { TimestampedValue } from 'src/app/repositories/types/in/timestamped-value';

export interface BedStatusSummary {
  free: TimestampedValue[]
  full: TimestampedValue[]
  prognosis: TimestampedValue[]
  in24h: TimestampedValue[]
}

export interface QuantitativeBedStatusSummary{
  free: number;

  full: number;

  prognosis: number;

  in24h: number;
}

export interface QuantitativeCovid19Summary {
  aktuell: number;
  beatmet: number;
  kumulativ: number;
  verstorben: number;
}
