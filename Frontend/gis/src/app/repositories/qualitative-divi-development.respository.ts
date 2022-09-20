import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { aggLevelToEndpointSingle } from '../util/aggregation-level';
import { getDateTime, getStrDate } from '../util/date-util';
import { CachedRepository } from './cached.repository';
import { QualitativeAggregatedHospitalProperties, QualitativeSingleHospitalProperties, QualitativeTimedStatus } from './types/in/qualitative-hospitals-development';
import { Region } from './types/in/region';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { SingleHospitalOut } from './types/out/single-hospital-out';
import { prepareAggParams } from './utils';

@Injectable({
  providedIn: 'root'
})
export class QualitativeDiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  public getDiviDevelopmentSingleHospitals(from: string, to: string, nogeom: boolean, dayThreshold: number = 5): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this
    .cachedRepository
    .get <FeatureCollection<Point, QualitativeSingleHospitalProperties>> (
      `${environment.apiUrl}hospitals/development`,
      this.prepareParams(from, to, nogeom, dayThreshold)
    );
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel, from: string, to: string, nogeom: boolean, dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this
      .cachedRepository
      .get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (
        `${environment.apiUrl}hospitals/development/${aggregationLevel}`,
        this.prepareParams(from, to, nogeom, dayThreshold)
      );
  }

  public getDiviDevelopmentSingleHospital(id: string, from: string, to: string, nogeom: boolean, dayThreshold: number = 5): Observable <Feature<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this
    .cachedRepository
    .get <Feature<Point, QualitativeSingleHospitalProperties>> (
      `${environment.apiUrl}hospitals/development/${id}`,
      this.prepareParams(from, to, nogeom, dayThreshold)
    );
  }

  public getDiviDevelopmentForAggLevelSingle(aggregationLevel: AggregationLevel, id: string, from: string, to: string, nogeom: boolean, dayThreshold: number = 5): Observable <Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    const ep = aggLevelToEndpointSingle(aggregationLevel);
    return this
    .cachedRepository
    .get <Feature<MultiPolygon, QualitativeAggregatedHospitalProperties>> (
      `${environment.apiUrl}hospitals/development/${ep}/${id}`,
      this.prepareParams(from, to, nogeom, dayThreshold)
    );
  }

  public getDiviDevelopmentAggregated(dataRequests: Region[], nogeom: boolean): Observable<Feature<MultiPolygon, QualitativeAggregatedHospitalProperties>> {
    return this
      .cachedRepository
      .get<Feature<MultiPolygon, QualitativeAggregatedHospitalProperties>>(`${environment.apiUrl}hospitals/development/aggregated`,
      prepareAggParams(dataRequests, false, nogeom));
  }

  private prepareParams(from: string, to: string, nogeom: boolean, dayThreshold: number = 5): HttpParams {
    let params = new HttpParams();



    if (from) {
      const fromDate = getDateTime(from);
      params = params.append('from', getStrDate(fromDate));
    }




    if (to) {
      const toDate = getDateTime(to);
      params = params.append('to', getStrDate(toDate));
    }


    if (!dayThreshold) {
      dayThreshold = 5;
    }

    if (dayThreshold && dayThreshold >= 0) {
      params = params.append('maxDaysOld', dayThreshold + '');
    }

    if (nogeom) {
      params = params.append('nogeom', 'true');
    }

    return params;
  }

}
