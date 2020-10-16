import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { exception } from 'console';
import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { getMoment, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';
import { RKICaseDevelopmentProperties } from './types/in/quantitative-rki-case-development';

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
    let aggEndpoint = '';
    switch (aggLevel) {
      case AggregationLevel.county:
        aggEndpoint = 'landkreis';
        break;

      case AggregationLevel.governmentDistrict:
        aggEndpoint = 'regierungsbezirk';
        break;

      case AggregationLevel.state:
        aggEndpoint = 'bundesland';
        break;

      case AggregationLevel.country:
        aggEndpoint = 'land';
        break;

      default:
        throw new Error('Aggregation level ' + aggLevel + ' unknown');
    }

    return this
      .cachedRepository
      .get<Feature<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggEndpoint}/${id}`);
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
