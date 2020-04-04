import { QualitativeTimedStatus } from 'src/app/repositories/types/in/qualitative-hospitals-development';

export interface QualitativeTimedStatusAggregation extends QualitativeTimedStatus {
    numberOfHospitals: number;
}