import {
  Injectable
} from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TooltipService } from './tooltip.service';
import { HospitalLayer } from '../map/overlays/hospital';
import { OSMRepository } from '../repositories/osm.repository';
import { HelipadLayer } from '../map/overlays/helipads';

@Injectable({
  providedIn: 'root'
})
export class OSMLayerService {

  constructor(
    private osmRespository: OSMRepository,
    private tooltipService: TooltipService
  ) {}

  
  getOSMHospitalLayer(): Observable<HospitalLayer> {
    return this.osmRespository.getOSMHospitals()
    .pipe(
      tap(() => console.log('load osm hospital layers')),
      map(d => new HospitalLayer('OSM Hospitals', d, this.tooltipService))
    )
  }

  getOSMHeliportLayer(): Observable<HelipadLayer> {
    return this.osmRespository.getOSMHelipads()
    .pipe(
      tap(() => console.log('load osm helipad layers')),
      map(d => new HelipadLayer('OSM Helipads', d, this.tooltipService))
    )
  }
}
