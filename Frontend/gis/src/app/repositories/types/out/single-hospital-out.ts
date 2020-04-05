import { AbstractTimedStatus, SingleHospital } from '../in/qualitative-hospitals-development';
import { AbstractHospitalOut } from './abstract-hospital-out';

export interface SingleHospitalOut<T extends AbstractTimedStatus> extends SingleHospital, AbstractHospitalOut<T> {
}