import { FeatureCollection, MultiPolygon, GeoJsonProperties } from 'geojson';
import { TimestampedValue } from './timestamped-value';
import { AbstractHospitalsProperties } from './abstract-hospital-properties';

export interface AggregatedHospitals extends FeatureCollection<MultiPolygon, AggregatedHospitalsProperties> {
}

export interface AggregatedHospitalsProperties extends AbstractHospitalsProperties {
  ids: string;
  centroid: {
    coordinates: number[];
    type: string;
  } 
}