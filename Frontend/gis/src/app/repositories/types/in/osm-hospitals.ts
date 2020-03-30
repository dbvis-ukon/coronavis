import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

export interface OSMHospitals extends FeatureCollection<Point, OSMHospitalProperties> {
}

export interface OSMHospitalProperties extends GeoJsonProperties {
  osm_id: number;

  /**
   * Name of the hospital
   */
  name: string;
}