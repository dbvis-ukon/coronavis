import { Injectable } from '@angular/core';
import { Feature, MultiPolygon } from 'geojson';
import { forkJoin, of } from 'rxjs';
import { RKIAgeGroups, RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';

export interface AggRKICaseTimedStatus {
  cases_sum: number;
  deaths_sum: number;

  /**
   * Shows the timestamp when the data was inserted. May be null.
   */
  inserted?: string[];

  /**
   * Shows the timestamp when the data was last updated. May be null.
   */
  last_updated?: string[];


  population_sum: number;
  timestamps: string[];

  cases_by_agegroup_sum?: RKIAgeGroups;
  deaths_by_agegroup_sum?: RKIAgeGroups;
  population_by_agegroup_sum?: RKIAgeGroups;
}

export interface AggRKICaseDevelopmentProperties {
  /**
   * An object where the keys are dates in form of YYYY-MM-DD
   */
  developmentDays: {[key: string]: AggRKICaseTimedStatus};
  developments: AggRKICaseTimedStatus[];

  ids: string[];

  /**
   * Name of the county, district, state
   */
  names: string[];

  /**
   * A description e.g. "Landkreis", "Kreis", "Kreisfreie Stadt"
   * Only available for counties
   */
  descriptions?: string[];

}

@Injectable({
  providedIn: 'root'
})
export class CasesRegionAggregatorService {

  constructor() { }

  public aggregate(data: Feature<MultiPolygon, RKICaseDevelopmentProperties>[]): AggRKICaseDevelopmentProperties {

    const ret: AggRKICaseDevelopmentProperties = {
      ids: data.map(d => d.properties.id),
      names: data.map(d => d.properties.name),
      descriptions: data.map(d => d.properties.description),
      developments: null,
      developmentDays: null
    };

    return ret;
  }

  private _aggregateDevelopments(data: Feature<MultiPolygon, RKICaseDevelopmentProperties>[]): AggRKICaseTimedStatus[] {
    const maxLength = data.map(d => d.properties.developments.length).reduce((prev, now) => Math.max(prev, now), 0);
    for(let i = 0; i < maxLength; i++) {

    }
  }

  private _aggregateDevelopment(data: RKICaseTimedStatus[]): AggRKICaseTimedStatus {
    return {
      cases_sum: data.map(d => d.cases).reduce((p, n) => p + n, 0),
      deaths_sum: data.map(d => d.deaths).reduce((p, n) => p + n, 0),
      population_sum: data.map(d => d.population).reduce((p, n) => p + n, 0),
      timestamps: data.map(d => d.timestamp),
      inserted: data.map(d => d.inserted),
      last_updated: data.map(d => d.last_updated),
      cases_by_agegroup_sum: this._aggregateAgeGroups(data.map(d => d.cases_by_agegroup)),
      deaths_by_agegroup_sum: this._aggregateAgeGroups(data.map(d => d.deaths_by_agegroup)),
      population_by_agegroup_sum: this._aggregateAgeGroups(data.map(d => d.population_by_agegroup)),
    };
  }

  private _aggregateAgeGroups(data: RKIAgeGroups[]): RKIAgeGroups {
    const ret: RKIAgeGroups = {
      A00_A04: 0,
      A05_A14: 0,
      A15_A34: 0,
      A35_A59: 0,
      A60_A79: 0,
      A80plus: 0
    };

    data.forEach(d => {
      for (const key of Object.keys(d)) {
        if(!ret[key]) {
          ret[key] = 0;
        }
        ret[key] += d[key];
      }
    });

    return ret;
  }
}
