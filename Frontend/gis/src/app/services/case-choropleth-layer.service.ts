import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { RKICaseRepository } from '../repositories/rki-case.repository';
import { CaseChoroplethColormapService } from './case-choropleth-colormap.service';
import { TooltipService } from './tooltip.service';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from './types/quantitative-aggregated-rki-cases-over-time';

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private rkiCaseRepository: RKICaseRepository,
    private tooltipService: TooltipService,
    private colormapService: CaseChoroplethColormapService,
    private matDialog: MatDialog
  ) {}

  public getLayer(options: CovidNumberCaseOptions): Observable < CaseChoropleth > {
    this.loading$.next(true);
    return this.getCaseData(options.aggregationLevel)
      .pipe(
        map(data => new CaseChoropleth(this.getKeyCovidNumberCaseOptions(options), data, options, this.tooltipService, this.colormapService, this.matDialog)),
        tap(() => this.loading$.next(false))
      );
  }

  public getKeyCovidNumberCaseOptions(v: CovidNumberCaseOptions) {
    return `${v.change}-${v.timeWindow}-${v.type}-${v.normalization}-${v.aggregationLevel}`;
  }


  public getCaseData(agg: AggregationLevel): Observable < FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties> > {
    const total = this.rkiCaseRepository.getCasesTotalForAggLevel(agg);
    const yesterday = this.rkiCaseRepository.getCasesYesterdayForAggLevel(agg);
    const threedays = this.rkiCaseRepository.getCasesThreedaysForAggLevel(agg);

    return forkJoin([total, yesterday, threedays])
      .pipe(
        map(e => {
          const casesOverTime: Array<Feature<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties>> = [];

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

            const combined = {
              last: {
                cases: last.properties.cases,
                deaths: last.properties.deaths
              },
              yesterday: {
                cases: y.properties.cases,
                deaths: y.properties.deaths
              },
              threeDaysAgo: {
                cases: t.properties.cases,
                deaths: t.properties.deaths
              },

              name: last.properties.name,
              bevoelkerung: last.properties.bevoelkerung,
              until: last.properties.until

            } as QuantitativeAggregatedRkiCasesOverTimeProperties;

            casesOverTime.push({
              ...last,
              properties: combined,
            });
          }

          return {
            features: casesOverTime,
            type: 'FeatureCollection'
          } as FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties>;
        })
      )
  }
}
