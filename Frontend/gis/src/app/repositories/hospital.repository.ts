import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CachedRepository } from './cached.repository';
import { FeatureCollection, Polygon } from 'geojson';
import { QualitativeAggregatedHospitalProperties } from './types/in/qualitative-hospitals-development';

@Injectable({
  providedIn: 'root'
})
export class HospitalRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  private getHospitalsLandkreise(): Observable<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>> {
    return this.cachedRepository.get<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>>(`${environment.apiUrl}hospitals/landkreise`);
  }

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  private getHospitalsRegierungsbezirke(): Observable<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>> {
    return this.cachedRepository.get<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>>(`${environment.apiUrl}hospitals/regierungsbezirke`);
  }

  /**
   * Retrieves the Bundeslaender from the given api endpoint.
   */
  private getHospitalsBundeslaender(): Observable<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>> {
    return this.cachedRepository.get<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>>(`${environment.apiUrl}hospitals/bundeslander`);
  }

  public getHospitalsForAggregationLevel(aggregationLevel: AggregationLevel) : Observable<FeatureCollection<Polygon, QualitativeAggregatedHospitalProperties>> {
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