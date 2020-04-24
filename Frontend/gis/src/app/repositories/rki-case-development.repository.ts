import { Injectable } from '@angular/core';
import { FeatureCollection, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { RKICaseDevelopmentProperties } from './types/in/quantitative-rki-case-development';

@Injectable({
  providedIn: 'root'
})
export class RKICaseDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getCasesDevelopmentForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>> {
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}cases/development/${aggLevel}`);
  }

  getCasesDevelopmentForCountries(): Observable<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>> {
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}cases/development/laender`);
  }
}