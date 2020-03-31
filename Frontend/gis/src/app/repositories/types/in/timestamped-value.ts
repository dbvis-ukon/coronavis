export interface TimestampedValue {
  value: number;

  /**
   * This seems to be the timestamp when the data was crawled the last time.
   */
  timestamp: Date;
}
