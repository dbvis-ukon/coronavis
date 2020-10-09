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

  private getDiviDevelopmentCounties(refDate: string = 'now', dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/landkreise`, this.prepareParams(refDate, dayThreshold));
  }

  private getDiviDevelopmentGovernmentDistricts(refDate: string = 'now', dayThreshold: number = 5): Observable < FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> > {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/regierungsbezirke`, this.prepareParams(refDate, dayThreshold));
  }

  private getDiviDevelopmentStates(refDate: string = 'now', dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/bundeslaender`, this.prepareParams(refDate, dayThreshold));
  }

  public getDiviDevelopmentCountries(refDate: string = 'now', dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/laender`, this.prepareParams(refDate, dayThreshold));
  }

  public getDiviDevelopmentSingleHospitals(refDate: string = 'now', dayThreshold: number = 5): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, QualitativeSingleHospitalProperties>> (`${environment.apiUrl}hospitals/development`, this.prepareParams(refDate, dayThreshold));
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel, refDate: string = 'now', dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    switch (aggregationLevel) {

      case AggregationLevel.county:
        return this.getDiviDevelopmentCounties(refDate, dayThreshold);

      case AggregationLevel.governmentDistrict:
        return this.getDiviDevelopmentGovernmentDistricts(refDate, dayThreshold);

      case AggregationLevel.state:
        return this.getDiviDevelopmentStates(refDate, dayThreshold);

      case AggregationLevel.country:
        return this.getDiviDevelopmentCountries(refDate, dayThreshold);

      default:
        throw new Error('No divi development endpoint for aggregation level: ' + aggregationLevel);
    }
  }

  private prepareParams(refDate: string = 'now', dayThreshold: number = 5): HttpParams {
    let params = new HttpParams();

    if (!refDate) {
      refDate = 'now';
    }

    const actualRefDate = getMoment(refDate);


    params = params.append('refDate', getStrDate(actualRefDate));

    if (!dayThreshold) {
      dayThreshold = 5;
    }

    if (dayThreshold && dayThreshold >= 0) {
      params = params.append('maxDaysOld', dayThreshold + '');
    }

    return params;
  }

}
