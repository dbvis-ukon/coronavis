import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon, Point } from 'geojson';
import moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { HospitalUtilService } from '../services/hospital-util.service';
import { CachedRepository } from './cached.repository';
import { QualitativeAggregatedHospitalProperties, QualitativeSingleHospitalProperties, QualitativeTimedStatus } from './types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { SingleHospitalOut } from './types/out/single-hospital-out';

@Injectable({
  providedIn: 'root'
})
export class QualitativeDiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository, private hospitalUtil: HospitalUtilService) {}

  private getDiviDevelopmentCounties(refDate: Date = new Date(), dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/landkreise`, this.prepareParams(refDate, dayThreshold))
    .pipe(
      map(e => this.mapFC(e))
    )
  }

  private getDiviDevelopmentGovernmentDistricts(refDate: Date = new Date(), dayThreshold: number = 5): Observable < FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> > {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/regierungsbezirke`, this.prepareParams(refDate, dayThreshold))
    .pipe(
      map(e => this.mapFC(e))
    )
  }

  private getDiviDevelopmentStates(refDate: Date = new Date(), dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/bundeslaender`, this.prepareParams(refDate, dayThreshold))
    .pipe(
      map(e => this.mapFC(e))
    )
  }

  public getDiviDevelopmentCountries(refDate: Date = new Date(), dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QualitativeAggregatedHospitalProperties>> (`${environment.apiUrl}hospitals/development/laender`, this.prepareParams(refDate, dayThreshold))
    .pipe(
      map(e => this.mapFC(e))
    )
  }

  public getDiviDevelopmentSingleHospitals(refDate: Date = new Date(), dayThreshold: number = 5): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, QualitativeSingleHospitalProperties>> (`${environment.apiUrl}hospitals/development`, this.prepareParams(refDate, dayThreshold))
    .pipe(
      map<FeatureCollection<Point, QualitativeSingleHospitalProperties>, FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>>(e => this.mapFC(e)),
    )
    // .pipe(
    //   map(d => {
    //     if(!refDate) {
    //       return d;
    //     }

        
    //     const filteredFeatures = d.features
    //     .filter(f => moment(refDate).diff(moment(f.properties.developments[f.properties.developments.length - 1].timestamp), 'days') <= dayThreshold);

        
    //     return {
    //       type: 'FeatureCollection',
    //       features: filteredFeatures
    //     } as FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>
    //   })
    // )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel, refDate: Date = new Date(), dayThreshold: number = 5): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    switch(aggregationLevel) {
        
      case AggregationLevel.county:
        return this.getDiviDevelopmentCounties(refDate, dayThreshold);

      case AggregationLevel.governmentDistrict:
        return this.getDiviDevelopmentGovernmentDistricts(refDate, dayThreshold);

      case AggregationLevel.state:
        return this.getDiviDevelopmentStates(refDate, dayThreshold);

      default:
        throw 'No divi development endpoint for aggregation level: ' + aggregationLevel;  
    }
  }

  private prepareParams(refDate: Date = new Date(), dayThreshold: number = 5): HttpParams {
    let params = new HttpParams();

    if(!refDate) {
      refDate = new Date();
    }

    const actualRefDate = moment(refDate);


    params = params.append('refDate', actualRefDate.format('YYYY-MM-DD'));
    
    if(!dayThreshold) {
      dayThreshold = 5;
    }

    if(dayThreshold && dayThreshold >= 0) {
      params = params.append('maxDaysOld', dayThreshold+'');
    }

    return params;
  }

  private mapFC<G extends Geometry, T extends SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>>(fc: FeatureCollection<G, QualitativeSingleHospitalProperties | QualitativeAggregatedHospitalProperties>): FeatureCollection<G, T> {
    return {
      ...fc,
      features: fc.features.map(f => {
        const newProp = this.addIndex(f.properties);

        return {
          ...f,
          properties: newProp
        } as Feature<G, T>;
      })
    };
  }

  private addIndex<T extends SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>>(d: QualitativeSingleHospitalProperties | QualitativeAggregatedHospitalProperties): T {
    const first = moment(d.developments[0].timestamp).endOf('day');

    const last = moment(d.developments[d.developments.length - 1].timestamp).endOf('day');

    let cur = first.clone();

    const map: Map<string, QualitativeTimedStatus> = new Map();

    let idx = 0;
    let lastItem: QualitativeTimedStatus;
    while(cur.isSameOrBefore(last)) {
      const curStr = cur.format('YYYY-MM-DD');
      //first try by idx:
      let item = d.developments[idx];
      if(item && curStr === moment(item.timestamp).format('YYYY-MM-DD')) {
        map.set(curStr, item);
        lastItem = item;
      } else {
        item = this.hospitalUtil.getLatestTimedStatus(d.developments, cur.endOf('day').toDate());
        if(item) {
          map.set(curStr, item);
          lastItem = item;
        }
      }


      cur = cur.add(1, 'day');
      idx++;
    }

    return {...d, developmentsDayIdx: map} as T;
  }
}
