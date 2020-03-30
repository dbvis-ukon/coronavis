import { TimestampedValue } from 'src/app/repositories/types/in/timestamped-value';
import { LatLngLiteral } from 'leaflet';
import { BedStatusSummary } from './bed-status-summary';

export interface AbstractDiviHospital {
  x ? : number;
  y ? : number;
  _x ? : number;
  _y ? : number;
  vx ? : number;
  vy ? : number;

  ID: number;
  Name: string;
  Location: LatLngLiteral;

  covid19_aktuell: TimestampedValue[];
  covid19_beatmet: TimestampedValue[];
  covid19_kumulativ: TimestampedValue[];
  covid19_verstorben: TimestampedValue[];
  ecmo_faelle_jahr: TimestampedValue[];

  icu_ecmo_care_belegt: TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  icu_ecmo_care_einschaetzung: TimestampedValue[];
  icu_ecmo_care_frei: TimestampedValue[];
  icu_ecmo_care_in_24h: TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  icu_high_care_belegt: TimestampedValue[];
  icu_high_care_einschaetzung: TimestampedValue[];
  icu_high_care_frei: TimestampedValue[];
  icu_high_care_in_24h: TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  icu_low_care_belegt: TimestampedValue[];
  icu_low_care_einschaetzung: TimestampedValue[];
  icu_low_care_frei: TimestampedValue[];
  icu_low_care_in_24h: TimestampedValue[];
  icu_low_summary: BedStatusSummary;
}
