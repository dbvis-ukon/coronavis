import { AbstractDiviHospital } from './abstract-divi-hospital';
import { QuantitativeAggregatedHospitalsProperties } from 'src/app/repositories/types/in/quantitative-aggregated-hospitals';

export type DiviAggregatedHospital = AbstractDiviHospital & QuantitativeAggregatedHospitalsProperties

// export interface DiviAggregatedHospital extends AbstractDiviHospital, QuantitativeAggregatedHospitalsProperties {}
