import { Point } from 'geojson';
import { GeneralDevelopment } from './general-development';
import { QualitativeAggregatedBedStateCounts } from './qualitative-aggregated-bed-states';
import { QuantitativeHospitalsDevelopment } from './quantitative-hospitals-development';

export type QualitativeSingleHospitalProperties = SingleHospital & QualitativeHospitalDevelopmentExtension;

export type QualitativeAggregatedHospitalProperties = AggregatedHospital & QualitativeHospitalDevelopmentExtension;

export type QuantitativeSingleHospitalProperties = SingleHospital & QuantitativeHospitalsDevelopment;

export type QuantitativeAggregatedHospitalProperties = AggregatedHospital & QuantitativeHospitalsDevelopment;


export interface AggregatedHospital {
    name: string;
    centroid: Point;
}

export interface SingleHospital {
    name: string;

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

export interface QualitativeHospitalDevelopmentExtension extends GeneralDevelopment {


    developments: Array<QualitativeTimedStatus>;

    developmentDays: {[key: string]: QualitativeTimedStatus };
}


export interface AbstractTimedStatus {
    timestamp: Date;
}


export interface QualitativeTimedStatus extends AbstractTimedStatus {

    /**
     * Only available in an aggregation
     */
    numHospitals?: number;

    last_update?: Date;
    
    icu_low_care: QualitativeAggregatedBedStateCounts;

    icu_high_care: QualitativeAggregatedBedStateCounts;

    ecmo_state: QualitativeAggregatedBedStateCounts;
}