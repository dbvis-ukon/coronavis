import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getMoment, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';

export interface EbrakeData {
  last_updated: string;
  last_checked: string;
  data: EbrakeItem[];
}

export interface EbrakeItem {
  id: string;
  name: string;
  timestamp: string;
  '7_day_incidence': number;
  '7_day_cases': number;
  ebrake100: boolean;
  ebrake165: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EbrakeRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getEbrakeData(
    from?: string,
    to?: string,
  ): Observable<EbrakeData> {
    return this
      .cachedRepository
      .get<EbrakeData>(`${environment.apiUrl}federal-emergency-brake`,
      this.prepareParams(from, to));
  }

  private prepareParams(from?: string, to?: string): HttpParams {
    let params = new HttpParams();

    if (from) {
      const fromDate = getMoment(from);
      params = params.append('from', getStrDate(fromDate));
    }

    if (to) {
      const toDate = getMoment(to);
      params = params.append('to', getStrDate(toDate));
    }

    return params;
  }
}
