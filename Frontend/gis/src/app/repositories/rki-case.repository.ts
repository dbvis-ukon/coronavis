import {Injectable} from '@angular/core';
import { Observable} from 'rxjs';
import {FeatureCollection} from 'geojson';
import {environment} from 'src/environments/environment';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { QuantitativeAggregatedRkiCases } from './types/in/quantitative-aggregated-rki-cases';

@Injectable({
  providedIn: 'root'
})
export class RKICaseRepository {
  constructor(private cachedRepository: CachedRepository) {}


  getCasesTotalForAggLevel(aggLevel: AggregationLevel): Observable<QuantitativeAggregatedRkiCases> {
    return this.cachedRepository.get<QuantitativeAggregatedRkiCases>(`${environment.apiUrl}cases/${aggLevel}/total`);
  }

  getCasesYesterdayForAggLevel(aggLevel: AggregationLevel): Observable<QuantitativeAggregatedRkiCases> {
    return this.cachedRepository.get<QuantitativeAggregatedRkiCases>(`${environment.apiUrl}cases/${aggLevel}/yesterday`);
  }

  getCasesThreedaysForAggLevel(aggLevel: AggregationLevel): Observable<QuantitativeAggregatedRkiCases> {
    return this.cachedRepository.get<QuantitativeAggregatedRkiCases>(`${environment.apiUrl}cases/${aggLevel}/3daysbefore`);
  }
  
}
