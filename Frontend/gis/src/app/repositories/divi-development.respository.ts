import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { tap } from 'rxjs/operators';
import { CachedRepository } from './cached.repository';
import { AggregatedHospitals } from './types/in/aggregated-hospital';
import { SingleHospitals } from './types/in/single-hospitals';

@Injectable({
  providedIn: 'root'
})
export class DiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  private getDiviDevelopmentCounties(): Observable <AggregatedHospitals> {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/landkreise`);
  }

  private getDiviDevelopmentGovernmentDistricts(): Observable < AggregatedHospitals > {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/regierungsbezirke`);
  }

  private getDiviDevelopmentStates(): Observable <AggregatedHospitals> {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/bundeslaender`);
  }

  public getDiviDevelopmentSingleHospitals(): Observable <SingleHospitals> {
    return this.cachedRepository.get <SingleHospitals> (`${environment.apiUrl}divi/development`)
    .pipe(
      tap(c => console.log('repo single', c))
    )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel): Observable<AggregatedHospitals> {
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
