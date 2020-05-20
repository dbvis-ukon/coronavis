import { Point } from 'geojson';

export interface RKICaseDevelopmentProperties {
  centroid: Point;
  /**
   * An object where the keys are dates in form of YYYY-MM-DD
   */
  developmentDays: {[key: string]: RKICaseTimedStatus};
  developments: RKICaseTimedStatus[];
  id: string;

  /**
   * Name of the county, district, state
   */
  name: string;

  /**
   * A description e.g. "Landkreis", "Kreis", "Kreisfreie Stadt"
   * Only available for counties
   */
  description?: string;
}



export interface RKICaseTimedStatus {
  cases: number; 
  cases_per_100k: number;
  cases_per_population: number;
  cases7_per_100k: number | null;
  death_rate: number;
  deaths: number; 
  // insert_date: string;
  // last_update: string;
  population: number;
  timestamp: string;
}