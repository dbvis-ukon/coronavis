import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HelipadLayer } from '../map/overlays/helipads';
import { HospitalLayer } from '../map/overlays/hospital';
import { OSMRepository } from '../repositories/osm.repository';
import { TooltipService } from './tooltip.service';

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
      map(d => new HospitalLayer('OSM Hospitals', d, this.tooltipService)),
      tap(() => this.loading$.next(false))
    );
  }

  getOSMHeliportLayer(): Observable<HelipadLayer> {
    this.loading$.next(true);
    return this.osmRespository.getOSMHelipads()
    .pipe(
      map(d => new HelipadLayer('OSM Helipads', d, this.tooltipService)),
      tap(() => this.loading$.next(false))
    );
  }
}
