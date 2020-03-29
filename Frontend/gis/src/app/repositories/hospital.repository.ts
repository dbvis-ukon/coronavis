import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { AggregationLevel } from '../map/options/aggregation-level.enum';

@Injectable({
  providedIn: 'root'
})
export class HospitalRepository {

  constructor(private http: HttpClient) {
  }

  /**
   * Retrieves the Landkreise from the given api endpoint.
   */
  private getHospitalsLandkreise(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}hospitals/landkreise`);
  }

  /**
   * Retrieves the Regierungsbezirke from the given api endpoint.
   */
  private getHospitalsRegierungsbezirke(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}hospitals/regierungsbezirke`);
  }

  /**
   * Retrieves the Bundeslaender from the given api endpoint.
   */
  private getHospitalsBundeslaender(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}hospitals/bundeslander`);
  }

  public getHospitalsForAggregationLevel(aggregationLevel: AggregationLevel) : Observable<FeatureCollection> {
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