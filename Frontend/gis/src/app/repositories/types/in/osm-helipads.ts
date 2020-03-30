import { FeatureCollection, Point } from 'geojson';

export interface OSMNearbyHelipads extends FeatureCollection<Point, OSMHelipadProperties> {
}

export interface OSMHelipadProperties {
  osm_id: number;

  name: null;

  /**
   * Distance in meters
   */
  distance_to_hospital: number;
}