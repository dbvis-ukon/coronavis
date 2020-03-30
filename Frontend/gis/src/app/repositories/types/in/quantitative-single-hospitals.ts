import { FeatureCollection, Point } from 'geojson';
import { QuantitativeAbstractHospitalsProperties } from './quantitative-abstract-hospital-properties';

export interface QuantitativeSingleHospitals extends FeatureCollection<Point, QuantitativeSingleHospitalProperties> {
}

export interface QuantitativeSingleHospitalProperties extends QuantitativeAbstractHospitalsProperties {
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
