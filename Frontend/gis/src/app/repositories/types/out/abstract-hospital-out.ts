import { Point } from 'geojson';
import { AbstractTimedStatus } from '../in/qualitative-hospitals-development';

export interface ForceLayoutProperties {
    x?: number;
    y?: number;
    _x?: number;
    _y?: number;
}

export interface HasName {
    name: string;
}

export interface HasCentroid {
    centroid: Point;
}

export interface AbstractHospitalOut<T extends AbstractTimedStatus> extends ForceLayoutProperties {
    developments: Array<T>;

    developmentDays: {[key: string]: T};
}
