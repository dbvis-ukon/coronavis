import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { tap } from 'rxjs/operators';
import { CachedRepository } from './cached.repository';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { QualitativeTimedStatus } from './types/in/qualitative-hospitals-development';
import { SingleHospitalOut } from './types/out/single-hospital-out';
import { MultiPolygon, FeatureCollection, Point } from 'geojson';

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

  public getDiviDevelopmentSingleHospitals(): Observable <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, SingleHospitalOut<QualitativeTimedStatus>>> (`${environment.apiUrl}hospitals/development`);
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
