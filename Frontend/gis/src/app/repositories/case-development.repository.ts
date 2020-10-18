import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { getMoment, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';
import { RKICaseDevelopmentProperties } from './types/in/quantitative-rki-case-development';
import { RisklayerPrognosis } from './types/in/risklayer-prognosis';
import {aggLevelToEndpointSingle} from '../util/aggregation-level';

@Injectable({
  providedIn: 'root'
})
export class CaseDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getCasesDevelopmentForAggLevel(dataSource: 'rki' | 'risklayer', aggLevel: AggregationLevel, from: string, to: string): Observable<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'rki' ? 'cases' : 'cases-risklayer';
    return this
      .cachedRepository
      .get<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggLevel}`, this.prepareParams(from, to));
  }

  getCasesDevelopmentForAggLevelSingle(dataSource: 'rki' | 'risklayer', aggLevel: AggregationLevel, id: string): Observable<Feature<MultiPolygon, RKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'rki' ? 'cases' : 'cases-risklayer';
    const aggEndpoint = aggLevelToEndpointSingle(aggLevel);

    return this
      .cachedRepository
      .get<Feature<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggEndpoint}/${id}`);
  }

  getRisklayerPrognosis(): Observable<RisklayerPrognosis> {
    return this
      .cachedRepository
      .get<RisklayerPrognosis>(`${environment.apiUrl}cases-risklayer/prognosis`);
  }

  private prepareParams(from: string, to: string): HttpParams {
    let params = new HttpParams();

    if (!to) {
      to = 'now';
    }

    const fromDate = getMoment(from);
    const toDate = getMoment(to);


    params = params.append('from', getStrDate(fromDate));
    params = params.append('to', getStrDate(toDate));

    return params;
  }
}
