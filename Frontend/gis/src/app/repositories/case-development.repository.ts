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
export class CaseDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getCasesDevelopmentForAggLevel(dataSource: 'rki' | 'risklayer', aggLevel: AggregationLevel): Observable<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'rki' ? 'cases' : 'cases-risklayer';
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggLevel}`);
  }
}
