import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OSMRepository {

  constructor(private http: HttpClient) {
  }

  getOSMHospitals(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}osm/hospitals`);
  }

  getOSMHelipads(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${environment.apiUrl}osm/nearby_helipads`);
  }
}