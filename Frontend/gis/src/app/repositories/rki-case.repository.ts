import {Injectable} from '@angular/core';
import { Observable} from 'rxjs';
import {FeatureCollection} from 'geojson';
import {environment} from 'src/environments/environment';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';

@Injectable({
  providedIn: 'root'
})
export class RKICaseRepository {
  constructor(private cachedRepository: CachedRepository) {}


  getCasesTotalForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.cachedRepository.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/total`);
  }

  getCasesYesterdayForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.cachedRepository.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/yesterday`);
  }

  getCasesThreedaysForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.cachedRepository.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/3daysbefore`);
  }
  
}
