import { TimestampedValue } from 'src/app/repositories/types/in/timestamped-value';
import { LatLngLiteral } from 'leaflet';
import { BedStatusSummary } from './bed-status-summary';
import { QuantitativeAbstractHospitalsProperties } from 'src/app/repositories/types/in/quantitative-abstract-hospital-properties';

export interface AbstractDiviHospital extends QuantitativeAbstractHospitalsProperties {
  x ? : number;
  y ? : number;
  _x ? : number;
  _y ? : number;
  vx ? : number;
  vy ? : number;

  location: LatLngLiteral;

  icu_ecmo_summary: BedStatusSummary;

  icu_high_summary: BedStatusSummary;

  icu_low_summary: BedStatusSummary;
}
