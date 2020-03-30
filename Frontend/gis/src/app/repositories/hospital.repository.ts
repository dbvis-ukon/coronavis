import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { QualitativeAggregatedHospitals } from './types/in/qualitative-aggregated-hospitals';

@Injectable({
  providedIn: 'root'
})
export class HospitalRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  private getHospitalsLandkreise(): Observable<QualitativeAggregatedHospitals> {
    return this.cachedRepository.get<QualitativeAggregatedHospitals>(`${environment.apiUrl}hospitals/landkreise`);
  }

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  private getHospitalsRegierungsbezirke(): Observable<QualitativeAggregatedHospitals> {
    return this.cachedRepository.get<QualitativeAggregatedHospitals>(`${environment.apiUrl}hospitals/regierungsbezirke`);
  }

  /**
   * Retrieves the Bundeslaender from the given api endpoint.
   */
  private getHospitalsBundeslaender(): Observable<QualitativeAggregatedHospitals> {
    return this.cachedRepository.get<QualitativeAggregatedHospitals>(`${environment.apiUrl}hospitals/bundeslander`);
  }

  public getHospitalsForAggregationLevel(aggregationLevel: AggregationLevel) : Observable<QualitativeAggregatedHospitals> {
    switch(aggregationLevel) {
      case AggregationLevel.county:
        return this.getHospitalsLandkreise();

      case AggregationLevel.governmentDistrict:
        return this.getHospitalsRegierungsbezirke();

      case AggregationLevel.state:
        return this.getHospitalsBundeslaender();

      default:
        throw 'Nope for aggregation level' + aggregationLevel;
    }
  }
}