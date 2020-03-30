import { FeatureCollection, Point } from 'geojson';
import { AbstractHospitalsProperties } from './abstract-hospital-properties';

export interface SingleHospitals extends FeatureCollection<Point, SingleHospitalProperties> {
}

export interface SingleHospitalProperties extends AbstractHospitalsProperties {
  gemeindeschluessel: number;
  ort: string;
  bundeslandschluessel: string;
  plz: string;
  webaddresse: string;
  id: string;
  address: string;
  state: string;
  contact: string;
  helipad_nearby: boolean;
}
