import { AbstractDiviHospital } from './abstract-divi-hospital';
import { QuantitativeSingleHospitalProperties } from 'src/app/repositories/types/in/quantitative-single-hospitals';

export type DiviHospital = AbstractDiviHospital & QuantitativeSingleHospitalProperties;
