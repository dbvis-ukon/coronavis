import { FeatureCollection, Point } from 'geojson';

export interface OSMHospitals extends FeatureCollection<Point, OSMHospitalProperties> {
}

export interface OSMHospitalProperties {
  osm_id: number;

  /**
   * Name of the hospital
   */
  name: string;
}