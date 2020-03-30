import { FeatureCollection, MultiPolygon, Point } from 'geojson';
import { QuantitativeAbstractHospitalsProperties } from './quantitative-abstract-hospital-properties';

export interface QuantitativeAggregatedHospitals extends FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalsProperties> {
}

export interface QuantitativeAggregatedHospitalsProperties extends QuantitativeAbstractHospitalsProperties {
  ids: string;
  centroid: Point;
}