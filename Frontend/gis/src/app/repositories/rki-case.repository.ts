import { Injectable } from '@angular/core';
import { FeatureCollection, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { QuantitativeAggregatedRkiCasesProperties } from './types/in/quantitative-aggregated-rki-cases';

@Injectable({
  providedIn: 'root'
})
export class RKICaseRepository {
  constructor(private cachedRepository: CachedRepository) {}


  getCasesTotalForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>> {
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>>(`${environment.apiUrl}cases/${aggLevel}/total`);
  }

  getCasesYesterdayForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>> {
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>>(`${environment.apiUrl}cases/${aggLevel}/yesterday`);
  }

  getCasesThreedaysForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>> {
    return this.cachedRepository.get<FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesProperties>>(`${environment.apiUrl}cases/${aggLevel}/3daysbefore`);
  }
  
}
