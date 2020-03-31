import { GeneralDevelopment } from '../in/general-development';
import { AbstractTimedStatus } from '../in/qualitative-hospitals-development';

export interface AbstractHospitalOut<T extends AbstractTimedStatus> {

    development: ArrayLike<T>;
}