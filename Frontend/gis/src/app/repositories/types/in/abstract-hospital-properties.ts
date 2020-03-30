import { GeoJsonProperties } from 'geojson';
import { TimestampedValue } from './timestamped-value';

/**
 * These are properties that occur in both, AggregatedHospitalProperties and SingleHospitalProperties
 */
export interface AbstractHospitalsProperties extends GeoJsonProperties {
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];
  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
}