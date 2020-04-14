import { Injectable } from '@angular/core';
import { Feature, MultiPolygon } from 'geojson';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { D3ChoroplethMapData } from '../overview/d3-choropleth-map/d3-choropleth-map.component';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { CaseChoroplethColormapService } from './case-choropleth-colormap.service';
import { CaseChoroplethLayerService } from './case-choropleth-layer.service';
import { QualitativeColormapService } from './qualitative-colormap.service';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from './types/quantitative-aggregated-rki-cases-over-time';

@Injectable({
  providedIn: 'root'
})
export class D3ChoroplethDataService {

  constructor(
    private bedRepo: QualitativeDiviDevelopmentRepository,
    private caseRepo: CaseChoroplethLayerService,
    private bedColorMap: QualitativeColormapService,
    private caseColorMap: CaseChoroplethColormapService
  ) { }


  public get(mo: MapOptions, mls: MapLocationSettings): Observable<D3ChoroplethMapData> {
    console.log('get d3 data');
    if(mo.bedBackgroundOptions.enabled) {
      console.log('get for agg elvel');
      return this.bedRepo.getDiviDevelopmentForAggLevel(mo.bedBackgroundOptions.aggregationLevel)
      .pipe(
        tap(d => console.log('data', d)),
        map(d => {
          return null;
          // return {
          //   data: d,

          //   width: 200,

          //   height: 200,

          //   fillFn: (d: Feature<MultiPolygon, AggregatedHospitalOut<QualitativeTimedStatus>>) => this.bedColorMap.getLatestBedStatusColor(d.properties.developments, mo.bedBackgroundOptions.bedType)
          // }
        })
      );
    } 
    else if(mo.covidNumberCaseOptions.enabled) {
      return this.caseRepo.getCaseData(mo.covidNumberCaseOptions.aggregationLevel)
      .pipe(
        map(d => {
          const scale = this.caseColorMap.getScale(d, mo.covidNumberCaseOptions);

          console.log('case data', d);

          return {
            data: d,

            width: 400,

            height: 600,

            fillFn: (d: Feature<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties>) => this.caseColorMap.getColor(scale, d, mo.covidNumberCaseOptions)
          }
        })
      );
    }
  }
}
