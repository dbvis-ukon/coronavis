import { Injectable } from '@angular/core';
import { Feature, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { D3ChoroplethMapData } from '../d3-choropleth-map/d3-choropleth-map.component';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseRepository } from '../repositories/rki-case.repository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QualitativeColormapService } from './qualitative-colormap.service';

@Injectable({
  providedIn: 'root'
})
export class D3ChoroplethDataService {

  constructor(
    private bedRepo: QualitativeDiviDevelopmentRepository,
    private caseRepo: RKICaseRepository,
    private bedColorMap: QualitativeColormapService
  ) { }


  public get(mo: MapOptions, mls: MapLocationSettings): Observable<D3ChoroplethMapData> {
    if(mo.bedBackgroundOptions.enabled) {
      return this.bedRepo.getDiviDevelopmentForAggLevel(mo.bedBackgroundOptions.aggregationLevel)
      .pipe(
        map(d => {
          return {
            data: d,

            width: 200,

            height: 200,

            fillFn: (d: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>) => this.bedColorMap.getLatestBedStatusColor(d.properties.developments, mo.bedBackgroundOptions.bedType)
          }
        })
      );
    } 
    // else if(mo.covidNumberCaseOptions.enabled) {
    //   return this.caseRepo.getCasesTotalForAggLevel(mo.covidNumberCaseOptions.aggregationLevel)
    //   .pipe(
    //     map(d => {
    //       return {
    //         data: d,

    //         width: 400,

    //         height: 600,

    //         fillFn: (d: Feature<Polygon, QuantitativeAggregatedRkiCasesProperties>) => this.bedColorMap.getChoroplethCaseColor()
    //       }
    //     })
    //   );
    // }
  }
}
