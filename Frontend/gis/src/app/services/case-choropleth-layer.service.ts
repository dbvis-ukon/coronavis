import { Injectable } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MultiPolygon } from 'geojson';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { CaseTrendCanvasLayer } from '../map/overlays/case-trend-canvas.layer';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { LabelCanvasLayer } from '../map/overlays/label-canvas.layer';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { MyLocalStorageService } from '../services/my-local-storage.service';
import { CaseChoroplethColormapService } from './case-choropleth-colormap.service';
import { CaseUtilService } from './case-util.service';
import { TooltipService } from './tooltip.service';

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethLayerService {

  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private caseRepository: CaseDevelopmentRepository,
    private tooltipService: TooltipService,
    private colormapService: CaseChoroplethColormapService,
    private matDialog: MatDialog,
    private storage: MyLocalStorageService,
    private caseUtil: CaseUtilService
  ) {}

  public getLayer(options$: BehaviorSubject<CovidNumberCaseOptions>): Observable < [CaseChoropleth, LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions> ]> {
    const options = options$.value;
    this.loading$.next(true);

    const [from, to] = this.caseUtil.getFromToTupleFromOptions(options);

    return this.caseRepository.getCasesDevelopmentForAggLevel(options.dataSource, options.aggregationLevel, from, to, false, false)
      .pipe(
        map(data =>
          {
            let lblLayer: LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions>;
            if (this.caseUtil.isLockdownMode(options)) {
              lblLayer = new CaseTrendCanvasLayer(this.getKeyCovidNumberCaseOptions(options) + '_labels', data, options.aggregationLevel, options$, this.storage, this.caseUtil);
            } else {
              lblLayer = new LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions>(this.getKeyCovidNumberCaseOptions(options) + '_labels', data, options.aggregationLevel, options$, this.storage);
            }

            return [
              new CaseChoropleth(this.getKeyCovidNumberCaseOptions(options), data, options, this.tooltipService, this.colormapService, this.matDialog, this.caseUtil),
              lblLayer
            ] as [CaseChoropleth, LabelCanvasLayer<MultiPolygon, RKICaseDevelopmentProperties, CovidNumberCaseOptions>];
          }),
        tap(() => this.loading$.next(false))
      );
  }

  public getKeyCovidNumberCaseOptions(v: CovidNumberCaseOptions) {
    return `${v.change}-${v.timeWindow}-${v.type}-${v.normalization}-${v.aggregationLevel}`;
  }


  // public getCaseData(agg: AggregationLevel): Observable < FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties> > {
  //   const total = this.rkiCaseRepository.getCasesTotalForAggLevel(agg);
  //   const yesterday = this.rkiCaseRepository.getCasesYesterdayForAggLevel(agg);
  //   const threedays = this.rkiCaseRepository.getCasesThreedaysForAggLevel(agg);

  //   return forkJoin([total, yesterday, threedays])
  //     .pipe(
  //       map(e => {
  //         const casesOverTime: Array<Feature<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties>> = [];

  //         for (let i = 0; i < e[0].features.length; i++) {
  //           const last = e[0].features[i];
  //           const y = e[1].features[i];
  //           const t = e[2].features[i];

  //           last.properties.deaths = +last.properties.deaths;
  //           last.properties.cases = +last.properties.cases;
  //           last.properties.bevoelkerung = +last.properties.bevoelkerung;

  //           y.properties.deaths = +y.properties.deaths;
  //           y.properties.cases = +y.properties.cases;
  //           y.properties.bevoelkerung = +y.properties.bevoelkerung;

  //           t.properties.deaths = +t.properties.deaths;
  //           t.properties.cases = +t.properties.cases;
  //           t.properties.bevoelkerung = +t.properties.bevoelkerung;

  //           const combined = {
  //             last: {
  //               cases: last.properties.cases,
  //               deaths: last.properties.deaths
  //             },
  //             yesterday: {
  //               cases: y.properties.cases,
  //               deaths: y.properties.deaths
  //             },
  //             threeDaysAgo: {
  //               cases: t.properties.cases,
  //               deaths: t.properties.deaths
  //             },

  //             name: last.properties.name,
  //             bevoelkerung: last.properties.bevoelkerung,
  //             until: last.properties.until

  //           } as QuantitativeAggregatedRkiCasesOverTimeProperties;

  //           casesOverTime.push({
  //             ...last,
  //             properties: combined,
  //           });
  //         }

  //         return {
  //           features: casesOverTime,
  //           type: 'FeatureCollection'
  //         } as FeatureCollection<MultiPolygon, QuantitativeAggregatedRkiCasesOverTimeProperties>;
  //       })
  //     )
  // }
}
