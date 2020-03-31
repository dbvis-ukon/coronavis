import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CachedRepository } from './cached.repository';
import { OSMHospitals } from './types/in/osm-hospitals';
import { OSMNearbyHelipads } from './types/in/osm-helipads';

@Injectable({
  providedIn: 'root'
})
export class OSMRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  getOSMHospitals(): Observable<OSMHospitals> {
    return this.cachedRepository.get<OSMHospitals>(`${environment.apiUrl}osm/hospitals`);
  }

  getOSMHelipads(): Observable<OSMNearbyHelipads> {
    return this.cachedRepository.get<OSMNearbyHelipads>(`${environment.apiUrl}osm/nearby_helipads`);
  }
}