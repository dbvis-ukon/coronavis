import { FeatureCollection, Point, GeoJsonProperties } from 'geojson';

export interface OSMNearbyHelipads extends FeatureCollection<Point, OSMHelipadProperties> {
}

export interface OSMHelipadProperties extends GeoJsonProperties {
  osm_id: number;

  name: null;

  /**
   * Distance in meters
   */
  distance_to_hospital: number;
}