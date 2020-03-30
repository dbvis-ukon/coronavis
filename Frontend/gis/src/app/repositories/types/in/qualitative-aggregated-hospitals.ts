import { FeatureCollection, Point, Polygon } from 'geojson';
import { QualitativeAggregatedBedStates } from './qualitative-aggregated-bed-states';

export interface QualitativeAggregatedHospitals extends FeatureCollection<Polygon, QualitativeAggregatedHospitalsProperties> {

}

export interface QualitativeAggregatedHospitalsProperties {
    ids: string;

    name: string;

    centroid: Point;
    
    icu_low_state: QualitativeAggregatedBedStates;

    icu_high_state: QualitativeAggregatedBedStates;
    
    ecmo_state: QualitativeAggregatedBedStates;
}