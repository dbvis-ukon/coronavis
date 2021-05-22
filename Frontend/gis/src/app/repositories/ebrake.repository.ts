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
  holiday: string | null;
  '7_day_incidence': number;
  '7_day_cases': number;
  ebrake100: boolean | null;
  ebrake150: boolean | null;
  ebrake165: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class EbrakeRepository {

  constructor(private cachedRepository: CachedRepository) {}

  getEbrakeData(
    from?: string,
    to?: string,
    ids?: string[]
  ): Observable<EbrakeData> {
    return this
      .cachedRepository
      .get<EbrakeData>(`${environment.apiUrl}federal-emergency-brake`,
      this.prepareParams(from, to, ids));
  }

  private prepareParams(from?: string, to?: string, ids?: string[]): HttpParams {
    let params = new HttpParams();

    if (from) {
      const fromDate = getMoment(from);
      params = params.append('from', getStrDate(fromDate));
    }

    if (to) {
      const toDate = getMoment(to);
      params = params.append('to', getStrDate(toDate));
    }

    if (ids && ids.length > 0) {
      params = params.append('ids', ids.join(','));
    }

    return params;
  }
}
