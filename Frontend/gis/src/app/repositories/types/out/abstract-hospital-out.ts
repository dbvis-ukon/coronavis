import { AbstractTimedStatus } from '../in/qualitative-hospitals-development';

export interface AbstractHospitalOut<T extends AbstractTimedStatus> {
    x?:number;
    y?:number;
    _x?:number;
    _y?:number;

    developments: ArrayLike<T>;
}