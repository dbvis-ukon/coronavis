import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {forkJoin, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {FeatureCollection} from 'geojson';
import {environment} from 'src/environments/environment';
import {AggregationLevel} from '../map/options/aggregation-level.enum';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class RKICaseRepository {
  constructor(private http: HttpClient) {}

  getCasesTotalForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/total`);
  }

  getCasesYesterdayForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/yesterday`);
  }

  getCasesThreedaysForAggLevel(aggLevel: AggregationLevel): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}cases/${aggLevel}/3daysbefore`);
  }
  

  


}
