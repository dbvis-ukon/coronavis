import { FeatureCollection, MultiPolygon } from 'geojson';
import { QuantitativeAggregatedHospitalProperties } from './qualitative-hospitals-development';

export interface QuantitativeAggregatedHospitals extends FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalProperties> {
}
