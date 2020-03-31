import { FeatureCollection, Point } from 'geojson';
import { QuantitativeSingleHospitalProperties } from './qualitative-hospitals-development';

export interface QuantitativeSingleHospitals extends FeatureCollection<Point, QuantitativeSingleHospitalProperties> {
}
