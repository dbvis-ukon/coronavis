import { Injectable } from '@angular/core';
import { Feature, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { D3ChoroplethMapData } from '../overview/d3-choropleth-map/d3-choropleth-map.component';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { RKICaseDevelopmentRepository } from '../repositories/rki-case-development.repository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { CaseChoroplethColormapService } from './case-choropleth-colormap.service';
import { QualitativeColormapService } from './qualitative-colormap.service';

@Injectable({
  providedIn: 'root'
})
export class D3ChoroplethDataService {

  constructor(
    private bedRepo: QualitativeDiviDevelopmentRepository,
    private caseRepo: RKICaseDevelopmentRepository,
    private bedColorMap: QualitativeColormapService,
    private caseColorMap: CaseChoroplethColormapService
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

            fillFn: (d1: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>) => this.bedColorMap.getLatestBedStatusColor(d1.properties, mo.bedBackgroundOptions.bedType)
          }
        })
      );
    } 
    else if(mo.covidNumberCaseOptions.enabled) {
      return this.caseRepo.getCasesDevelopmentForAggLevel(mo.covidNumberCaseOptions.aggregationLevel)
      .pipe(
        map(d => {
          const scale = this.caseColorMap.getScale(d, mo.covidNumberCaseOptions);

          return {
            data: d,

            width: 400,

            height: 600,

            fillFn: (d: Feature<MultiPolygon, RKICaseDevelopmentProperties>) => this.caseColorMap.getColor(scale, d, mo.covidNumberCaseOptions)
          }
        })
      );
    }
  }
}
