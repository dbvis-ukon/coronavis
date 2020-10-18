import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FeatureCollection, MultiPolygon, Point } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { HospitalUtilService } from '../services/hospital-util.service';
import { getMoment, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';
import { QualitativeAggregatedHospitalProperties, QualitativeSingleHospitalProperties, QualitativeTimedStatus } from './types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { SingleHospitalOut } from './types/out/single-hospital-out';

@Injectable({
  providedIn: 'root'
})
export class QualitativeDiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository, private hospitalUtil: HospitalUtilService) {}

  public getDiviDevelopmentSingleHospitals(from: string, to: string, dayThreshold: number = 5): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, QualitativeSingleHospitalProperties>> (`${environment.apiUrl}hospitals/development2`, this.prepareParams(from, to, dayThreshold));
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel, from: string, to: string, dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development2/${aggregationLevel}`, this.prepareParams(from, to, dayThreshold));
  }

  private prepareParams(from: string, to: string, dayThreshold: number = 5): HttpParams {
    let params = new HttpParams();

    if (!to) {
      to = 'now';
    }

    const fromDate = getMoment(from);
    const toDate = getMoment(to);

    params = params.append('from', getStrDate(fromDate));
    params = params.append('to', getStrDate(toDate));

    if (!dayThreshold) {
      dayThreshold = 5;
    }

    if (dayThreshold && dayThreshold >= 0) {
      params = params.append('maxDaysOld', dayThreshold + '');
    }

    return params;
  }

}
