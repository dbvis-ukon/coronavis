import { Injectable } from '@angular/core';
import { FeatureCollection, Point } from 'geojson';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CachedRepository } from './cached.repository';
import { OSMHelipadProperties } from './types/in/osm-helipads';
import { OSMHospitalProperties } from './types/in/osm-hospitals';

@Injectable({
  providedIn: 'root'
})
export class OSMRepository {

  constructor(private cachedRepository: CachedRepository) {
  }

  getOSMHospitals(): Observable<FeatureCollection<Point, OSMHospitalProperties>> {
    return this.cachedRepository.get<FeatureCollection<Point, OSMHospitalProperties>>(`${environment.apiUrl}osm/hospitals`);
  }

  getOSMHelipads(): Observable<FeatureCollection<Point, OSMHelipadProperties>> {
    return this.cachedRepository.get<FeatureCollection<Point, OSMHelipadProperties>>(`${environment.apiUrl}osm/nearby_helipads`);
  }
}