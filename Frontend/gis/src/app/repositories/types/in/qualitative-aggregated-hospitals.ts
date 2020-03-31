import { FeatureCollection, Point, Polygon } from 'geojson';
import { QualitativeAggregatedBedStateCounts } from './qualitative-aggregated-bed-states';
import { QualitativeAggregatedHospitalProperties } from './qualitative-hospitals-development';

export interface QualitativeAggregatedHospitals extends FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties> {

}