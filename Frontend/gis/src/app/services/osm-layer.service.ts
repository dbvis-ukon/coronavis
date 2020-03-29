import {
  Injectable
} from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TooltipService } from './tooltip.service';
import { HospitalLayer } from '../map/overlays/hospital';
import { OSMRepository } from '../repositories/osm.repository';
import { HelipadLayer } from '../map/overlays/helipads';

@Injectable({
  providedIn: 'root'
})
export class OSMLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private osmRespository: OSMRepository,
    private tooltipService: TooltipService
  ) {}

  
  getOSMHospitalLayer(): Observable<HospitalLayer> {
    this.loading$.next(true);
    return this.osmRespository.getOSMHospitals()
    .pipe(
      tap(() => console.log('load osm hospital layers')),
      map(d => new HospitalLayer('OSM Hospitals', d, this.tooltipService)),
      tap(() => this.loading$.next(false))
    )
  }

  getOSMHeliportLayer(): Observable<HelipadLayer> {
    this.loading$.next(true);
    return this.osmRespository.getOSMHelipads()
    .pipe(
      tap(() => console.log('load osm helipad layers')),
      map(d => new HelipadLayer('OSM Helipads', d, this.tooltipService)),
      tap(() => this.loading$.next(false))
    )
  }
}
