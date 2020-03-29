import {
  AggregationLevel
} from '../map/options/aggregation-level.enum';
import {
  Observable,
  forkJoin
} from 'rxjs';
import {
  FeatureCollection
} from 'geojson';
import {
  RKICaseRepository
} from '../repositories/rki-case.repository';
import {
  map, tap
} from 'rxjs/operators';
import {
  CaseChoropleth
} from '../map/overlays/casechoropleth';
import {
  CovidNumberCaseOptions
} from '../map/options/covid-number-case-options';
import { ColormapService } from './colormap.service';
import { TooltipService } from './tooltip.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethLayerService {

  constructor(
    private rkiCaseRepository: RKICaseRepository,
    private tooltipService: TooltipService,
    private colormapService: ColormapService
  ) {}

  public getLayer(options: CovidNumberCaseOptions): Observable < CaseChoropleth > {
    return this.getCaseData(options.aggregationLevel)
      .pipe(
        tap(() => console.log('load case choropleth layer')),
        map(data => new CaseChoropleth(this.getKeyCovidNumberCaseOptions(options), data, options, this.tooltipService, this.colormapService))
      );
  }

  public getKeyCovidNumberCaseOptions(v: CovidNumberCaseOptions) {
    return `${v.change}-${v.timeWindow}-${v.type}-${v.normalization}-${v.aggregationLevel}`;
  }


  private getCaseData(agg: AggregationLevel): Observable < FeatureCollection > {
    const total = this.rkiCaseRepository.getCasesTotalForAggLevel(agg);
    const yesterday = this.rkiCaseRepository.getCasesYesterdayForAggLevel(agg);
    const threedays = this.rkiCaseRepository.getCasesThreedaysForAggLevel(agg);

    return forkJoin([total, yesterday, threedays])
      .pipe(
        map(e => {
          for (let i = 0; i < e[0].features.length; i++) {
            const last = e[0].features[i];
            const y = e[1].features[i];
            const t = e[2].features[i];

            last.properties.deaths = +last.properties.deaths;
            last.properties.cases = +last.properties.cases;
            last.properties.bevoelkerung = +last.properties.bevoelkerung;

            y.properties.deaths = +y.properties.deaths;
            y.properties.cases = +y.properties.cases;
            y.properties.bevoelkerung = +y.properties.bevoelkerung;

            t.properties.deaths = +t.properties.deaths;
            t.properties.cases = +t.properties.cases;
            t.properties.bevoelkerung = +t.properties.bevoelkerung;

            e[0].features[i].properties.combined = [last.properties, y.properties, t.properties]
          }
          return e[0];
        })
      )
  }
}
