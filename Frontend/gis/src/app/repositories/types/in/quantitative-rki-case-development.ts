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


export interface RKIAgeGroups {
  A00_A04: number;
  A05_A14: number;
  A15_A34: number;
  A35_A59: number;
  A60_A79: number;
  A80plus: number;
  Aunknown?: number;
}

export interface SurvStatAgeGroups {
  A00: number;
  A01: number;
  A02: number;
  A03: number;
  A04: number;
  A05: number;
  A06: number;
  A07: number;
  A08: number;
  A09: number;
  A10: number;
  A11: number;
  A12: number;
  A13: number;
  A14: number;
  A15: number;
  A16: number;
  A17: number;
  A18: number;
  A19: number;
  A20: number;
  A21: number;
  A22: number;
  A23: number;
  A24: number;
  A25: number;
  A26: number;
  A27: number;
  A28: number;
  A29: number;
  A30: number;
  A31: number;
  A32: number;
  A33: number;
  A34: number;
  A35: number;
  A36: number;
  A37: number;
  A38: number;
  A39: number;
  A40: number;
  A41: number;
  A42: number;
  A43: number;
  A44: number;
  A45: number;
  A46: number;
  A47: number;
  A48: number;
  A49: number;
  A50: number;
  A51: number;
  A52: number;
  A53: number;
  A54: number;
  A55: number;
  A56: number;
  A57: number;
  A58: number;
  A59: number;
  A60: number;
  A61: number;
  A62: number;
  A63: number;
  A64: number;
  A65: number;
  A66: number;
  A67: number;
  A68: number;
  A69: number;
  A70: number;
  A71: number;
  A72: number;
  A73: number;
  A74: number;
  A75: number;
  A76: number;
  A77: number;
  A78: number;
  A79: number;
  A80plus: number;
  Aunknown?: number;
}


export interface RKICaseTimedStatus {
  cases: number;
  cases_per_100k: number;
  cases_per_population: number;
  cases7_per_100k: number | null;
  death_rate: number;
  deaths: number;

  /**
   * Shows the timestamp when the data was inserted. May be null.
   */
  inserted?: string;

  /**
   * Shows the timestamp when the data was last updated. May be null.
   */
  last_updated?: string;


  population: number;
  timestamp: string;

  num_counties_reported: number;
  num_counties_total: number;

  cases_by_agegroup?: RKIAgeGroups;
  deaths_by_agegroup?: RKIAgeGroups;
  population_by_agegroup?: RKIAgeGroups;

  cases_survstat_by_agegroup?: SurvStatAgeGroups;
  population_survstat_by_agegroup?: SurvStatAgeGroups;
}
