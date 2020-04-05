import { AbstractTimedStatus, AggregatedHospital } from '../in/qualitative-hospitals-development';
import { AbstractHospitalOut } from './abstract-hospital-out';

export interface AggregatedHospitalOut<T extends AbstractTimedStatus> extends AggregatedHospital, AbstractHospitalOut<T> {


}