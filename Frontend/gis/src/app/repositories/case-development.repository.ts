import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseDataSource } from '../map/options/covid-number-case-options';
import { aggLevelToEndpointSingle } from '../util/aggregation-level';
import { getMoment, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';
import { AggregatedRKICaseDevelopmentProperties, RKICaseDevelopmentProperties } from './types/in/quantitative-rki-case-development';
import { Region } from './types/in/region';
import { RisklayerPrognosis } from './types/in/risklayer-prognosis';
import { prepareAggParams } from './utils';

@Injectable({
  providedIn: 'root'
})
export class CaseDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getCasesDevelopmentForAggLevel(
    dataSource: CovidNumberCaseDataSource,
    aggLevel: AggregationLevel,
    from: string,
    to: string,
    ageGroups: boolean
  ): Observable<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'risklayer' ? 'cases-risklayer' : 'cases';
    return this
      .cachedRepository
      .get<FeatureCollection<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggLevel}`,
      this.prepareParams(from, to, ageGroups));
  }

  getCasesDevelopmentForAggLevelSingle(
    dataSource: CovidNumberCaseDataSource,
    aggLevel: AggregationLevel,
    id: string,
    ageGroups: boolean,
    to?: string,
  ): Observable<Feature<MultiPolygon, RKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'risklayer' ? 'cases-risklayer' : 'cases';
    const aggEndpoint = aggLevelToEndpointSingle(aggLevel);

    return this
      .cachedRepository
      .get<Feature<MultiPolygon, RKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/${aggEndpoint}/${id}`,
      this.prepareParams(null, to, ageGroups));
  }

  getRisklayerPrognosis(): Observable<RisklayerPrognosis> {
    return this
      .cachedRepository
      .get<RisklayerPrognosis>(`${environment.apiUrl}cases-risklayer/prognosis`);
  }

  getCasesDevelopmentAggregated(
    dataSource: CovidNumberCaseDataSource,
    dataRequests: Region[],
    ageGroups: boolean
  ): Observable<Feature<MultiPolygon, AggregatedRKICaseDevelopmentProperties>> {
    const endpoint = dataSource === 'risklayer' ? 'cases-risklayer' : 'cases';
    return this
      .cachedRepository
      .get<Feature<MultiPolygon, AggregatedRKICaseDevelopmentProperties>>(`${environment.apiUrl}${endpoint}/development/aggregated`,
      prepareAggParams(dataRequests, ageGroups));
  }

  private prepareParams(from?: string, to?: string, ageGroups?: boolean): HttpParams {
    let params = new HttpParams();

    if (from) {
      const fromDate = getMoment(from);
      params = params.append('from', getStrDate(fromDate));
    }

    if (to) {
      const toDate = getMoment(to);
      params = params.append('to', getStrDate(toDate));
    }

    if (ageGroups) {
      params = params.append('agegroups', 'true');
    }

    return params;
  }
}
