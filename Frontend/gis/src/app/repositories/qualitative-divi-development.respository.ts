import { Injectable } from '@angular/core';
import { FeatureCollection, MultiPolygon, Point } from 'geojson';
import moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { QualitativeTimedStatus } from './types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { SingleHospitalOut } from './types/out/single-hospital-out';

@Injectable({
  providedIn: 'root'
})
export class QualitativeDiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  private getDiviDevelopmentCounties(): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> (`${environment.apiUrl}hospitals/development/landkreise`);
  }

  private getDiviDevelopmentGovernmentDistricts(): Observable < FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>> > {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> (`${environment.apiUrl}hospitals/development/regierungsbezirke`);
  }

  private getDiviDevelopmentStates(): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> (`${environment.apiUrl}hospitals/development/bundeslaender`);
  }

  public getDiviDevelopmentSingleHospitals(filter: boolean = true): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> (`${environment.apiUrl}hospitals/development`)
    .pipe(
      map(d => {
        if(!filter) {
          return d;
        }

        
        const filteredFeatures = d.features
        .filter(f => moment().diff(moment(f.properties.developments[f.properties.developments.length - 1].timestamp), 'days') <= 5);

        
        return {
          type: 'FeatureCollection',
          features: filteredFeatures
        } as FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>
      })
    )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>> {
    switch(aggregationLevel) {
        
      case AggregationLevel.county:
        return this.getDiviDevelopmentCounties();

      case AggregationLevel.governmentDistrict:
        return this.getDiviDevelopmentGovernmentDistricts();

      case AggregationLevel.state:
        return this.getDiviDevelopmentStates();

      default:
        throw 'No divi development endpoint for aggregation level: ' + aggregationLevel;  
    }
  }
}
