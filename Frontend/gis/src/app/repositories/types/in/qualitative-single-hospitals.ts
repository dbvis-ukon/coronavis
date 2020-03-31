import { Point, FeatureCollection } from 'geojson';
import { QualitativeSingleHospitalProperties } from './qualitative-hospitals-development';

export interface QualitativeSingleHospitals extends FeatureCollection<Point, QualitativeSingleHospitalProperties> {

}