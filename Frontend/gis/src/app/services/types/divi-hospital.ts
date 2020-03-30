import { AbstractDiviHospital } from './abstract-divi-hospital';

export interface DiviHospital extends AbstractDiviHospital {
  City: string;
  Postcode: string;
  Address: string;
  Webaddress: string;

  helipad_nearby: boolean;
}