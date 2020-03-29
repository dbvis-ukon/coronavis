import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';
import { CachedRepository } from './cached.repository';

@Injectable({
  providedIn: 'root'
})
export class OSMRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  getOSMHospitals(): Observable<FeatureCollection> {
    return this.cachedRepository.get<FeatureCollection>(`${environment.apiUrl}osm/hospitals`);
  }

  getOSMHelipads(): Observable<FeatureCollection> {
    return this.cachedRepository.get<FeatureCollection>(`${environment.apiUrl}osm/nearby_helipads`);
  }
}