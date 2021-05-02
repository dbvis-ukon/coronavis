import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, mergeMap, toArray } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { Region } from './types/in/region';

@Injectable({
  providedIn: 'root'
})
export class RegionRepository {

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<Region[]> {
    return this.http.get<Region[]>(`${environment.apiUrl}regions`);
  }

  getByIds(ids: string[]): Observable<Region[]> {
    return this.getAll()
        .pipe(
          mergeMap(d => d),
          filter(reg => ((reg.id.length === 2 && reg.aggLevel === AggregationLevel.state) || reg.id.length !==2) && ids.find(r1 => r1 === reg.id) !== undefined),
          toArray()
        );
  }
}
