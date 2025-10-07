import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DateTime, Duration } from 'luxon';
import { BehaviorSubject, firstValueFrom, forkJoin, interval, merge, Observable, of } from 'rxjs';
import { distinct, distinctUntilChanged, filter, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { BedTooltipComponent } from '../bed-tooltip/bed-tooltip.component';
import { FlyTo } from '../map/events/fly-to';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { StatusWithCache } from '../map/overlays/case-trend-canvas.layer';
import { CaseChoropleth } from '../map/overlays/casechoropleth';
import { CachedRepository } from '../repositories/cached.repository';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import { CaseUtilService } from '../services/case-util.service';
import { CountryAggregatorService } from '../services/country-aggregator.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { HospitalUtilService } from '../services/hospital-util.service';
import { OSMLayerService } from '../services/osm-layer.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { TooltipService } from '../services/tooltip.service';
import { TranslationService } from '../services/translation.service';
import { Searchable } from '../shared/hospital-search/hospital-search.component';
import { getDateTime, getStrDate } from '../util/date-util';

interface GlyphEntity {
  name: string;
  accessor: string;
  accFunc: (d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts;
  color: string;
  description: string;
}

interface CombinedStatistics {
  diviFiltered: QualitativeTimedStatus;
  diviUnfiltered: QualitativeTimedStatus;
  rki: RKICaseTimedStatus;

  rkiOutdated: boolean;

  glyphData: GlyphEntity[];

  casesCountiesAvailable?: number;
  casesCountiesTotal?: number;

  risklayerPrognosis?: number;
}

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  glyphLegend;

  glyphLegendColors = QualitativeColormapService.bedStati;

  _mo: MapOptions;

  @Input()
  set mapOptions(mo: MapOptions) {
    this._mo = mo;

    if (!mo) {
      return;
    }

    this.refDay$.next(mo.bedGlyphOptions.date);
  }

  get mapOptions(): MapOptions {
    return this._mo;
  }


  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('mapLocationSettings')
  mls: MapLocationSettings;

  @Output()
  flyTo = new EventEmitter<FlyTo>();

  @Input()
  choroplethLayer$: Observable<CaseChoropleth>;

  aggregateStatisticsLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // ENUM MAPPING
  // because in HTML, this stuff cannot be accessed
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  eCovidNumberCaseChange = CovidNumberCaseChange;

  eCovidNumberCaseType = CovidNumberCaseType;

  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;

  eBedTypes = BedType;

  eAggregationLevels = AggregationLevel;


  glyphLoading = false;
  bedChoroplethLoading = false;
  caseChoroplethLoading = false;
  osmLoading = false;

  searchData$: Observable<Searchable[]>;
  resetHospitalSearch: number;

  private refDay$: BehaviorSubject<string> = new BehaviorSubject('now');

  combinedStats$: Observable<CombinedStatistics>;

  private aggregatedDiviStatistics: QualitativeTimedStatus;

  nextLiveUpdatePercentage: number;
  nextLiveUpdate: string;

  noUiSliderConfigTrend: any = {
    connect: true,
    tooltips: true,
    range: {
      min: 0,
      max: 1
    },
    step: 0.1
  };

  constructor(
    public colormapService: QualitativeColormapService,
    private osmLayerService: OSMLayerService,
    private glyphLayerService: GlyphLayerService,
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private caseChoroplethLayerService: CaseChoroplethLayerService,
    private breakPointObserver: BreakpointObserver,
    private countryAggregatorService: CountryAggregatorService,
    public tooltipService: TooltipService,
    private translationService: TranslationService,
    private hospitalRepo: QualitativeDiviDevelopmentRepository,
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService,
    private cache: CachedRepository,
    private hospitalUtil: HospitalUtilService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // const cron: CronJob = new CronJob(
    //   '0,30 5-21 * * *', 
    //   () => {

    //     if (this._mo.covidNumberCaseOptions.dataSource !== 'risklayer') {
    //       return;
    //     }

    //     setTimeout(() => {
    //       this.cache.empty();

    //       this.emitMapOptions();

    //       this.updateStatistics();

    //     }, 30000);
    //   }, 
    //   null, //onComplete
    //   true, // start
    //   'UTC' //timeZone
    // );

    const initTime = getDateTime('now');

    interval(5000)
      .subscribe(() => {
        const nextDate: DateTime = getDateTime('now').plus({minutes: 30});

        // try {
        //   nextDate = cron.nextDate() as DateTime;
        // } catch (e) {
        //   console.warn('Could not determine next cron. Fall back to now + 30 min.');
        // }

        const diffNext = nextDate.diff(getDateTime('now')).milliseconds + 30000;

        const diffTotal = nextDate.diff(initTime).milliseconds;

        this.nextLiveUpdate = Duration.fromMillis(diffNext).minutes + ' minutes';

        this.nextLiveUpdatePercentage = ((diffNext / diffTotal)) * 100;
      });


    // close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if (isSmallScreen){
      this._mo.extendInfobox = false;
    }

    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);

    this.combinedStats$ = this.refDay$
    .pipe(
      distinctUntilChanged(),
      this.combinedStatsOperator()
    );

    this.activatedRoute.params.subscribe(() => this.updateStatistics());


    this.updateSearch();


    this.choroplethLayer$
    .pipe(
      filter(l => l !== null),
    )
    .subscribe(async l => {
      if (!l) {
        return;
      }
      const trendMinMax: [number, number] = [10000, -10000];

      for(const f of l.featureCollection.features) {
        const t = this.caseUtil.getTimedStatusWithOptions(f.properties, this._mo.covidNumberCaseOptions) as StatusWithCache;
        if (t?._regression?.rotation) {
          const r = t._regression;
          if (r.m < trendMinMax[0]) {
            trendMinMax[0] = r.m;
          }
          if (r.m > trendMinMax[1]) {
            trendMinMax[1] = r.m;
          }
        } else {
          const r = await firstValueFrom(this.caseUtil.getTrendForCase7DaysPer100k(f.properties, this._mo.covidNumberCaseOptions));
          if (r.m < trendMinMax[0]) {
            trendMinMax[0] = r.m;
          }
          if (r.m > trendMinMax[1]) {
            trendMinMax[1] = r.m;
          }
        }
      }

      this.noUiSliderConfigTrend.range.min = Math.floor(trendMinMax[0]);
      this.noUiSliderConfigTrend.range.max = Math.ceil(trendMinMax[1]);

      if (!this._mo.covidNumberCaseOptions.trendRange) {
        this._mo.covidNumberCaseOptions.trendRange = [this.noUiSliderConfigTrend.range.min, this.noUiSliderConfigTrend.range.max];
      }

    });
  }

  updateSearch() {
    this.resetHospitalSearch = Math.random();

    merge(
      this.hospitalSearchResult(),
      this.bedBackgroundSearchResult(),
      this.caseSearchResult()
    )
    .pipe(
      filter(d => d?.name !== undefined),
      distinct(d => d.name + '' + d.addition),
      toArray(),
    )
    .subscribe(d => this.searchData$ = of(d));
  }

  updateStatistics() {
    this.combinedStats$ = of(this._mo.covidNumberCaseOptions.date)
      .pipe(this.combinedStatsOperator());
  }

  private hospitalSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel();

    const [from, to] = this.hospitalUtil.getFromToTupleFromOptions(this._mo.bedGlyphOptions);

    if (this._mo.bedGlyphOptions.enabled && this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return this.hospitalRepo
      .getDiviDevelopmentSingleHospitals(from, to, false)
      .pipe(
        mergeMap(d => d.features),
        map(d => ({
            name: d.properties.name,
            addition: d.properties.address,
            point: {
              lat: d.geometry.coordinates[1],
              lng: d.geometry.coordinates[0]
            },
            zoom
          } as Searchable)),
      );
    } else if (this._mo.bedGlyphOptions.enabled && this._mo.bedGlyphOptions.aggregationLevel !== AggregationLevel.none) {
      return this.hospitalRepo
      .getDiviDevelopmentForAggLevel(this._mo.bedBackgroundOptions.aggregationLevel, from, to, true)
      .pipe(
        mergeMap(d => d.features),
        map(d => ({
            name: d.properties.name,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable))
      );
    }

    return of();
  }

  private bedBackgroundSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel();
    if (this._mo.bedBackgroundOptions.enabled && this._mo.bedBackgroundOptions.aggregationLevel !== AggregationLevel.none) {
      const [from, to] = this.hospitalUtil.getFromToTupleFromOptions(this._mo.bedBackgroundOptions);
      return this.hospitalRepo
      .getDiviDevelopmentForAggLevel(this._mo.bedBackgroundOptions.aggregationLevel, from, to, true)
      .pipe(
        mergeMap(d => d.features),
        map(d => ({
            name: d.properties.name,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable))
      );
    }

    return of();
  }

  private caseSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel();
    if (this._mo.covidNumberCaseOptions.enabled) {
      const [from, to] = this.caseUtil.getFromToTupleFromOptions(this._mo.covidNumberCaseOptions);

      return this.caseRepo
      .getCasesDevelopmentForAggLevel(this._mo.covidNumberCaseOptions.dataSource, this._mo.covidNumberCaseOptions.aggregationLevel, from, to, false, true)
      .pipe(
        mergeMap(d => d.features),
        map(d => ({
            name: d.properties.name,
            addition: d.properties.description,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable))
      );
    }

    return of();
  }

  private getZoomForAggLevel(): number {
    let zoom: number;

    switch (this._mo.bedGlyphOptions.aggregationLevel){
      case AggregationLevel.county:
        zoom = 11;
        break;

      case AggregationLevel.governmentDistrict:
        zoom = 9;
        break;

      case AggregationLevel.state:
        zoom = 8;
        break;

      case AggregationLevel.country:
        zoom = 6;
        break;

      default:
        zoom = 12;
    }

    return zoom;
  }

  openBedTooltip(evt, glypLegendEntity: GlyphEntity) {
      const t = this.tooltipService.openAtElementRef(BedTooltipComponent, evt.target, null, [
        {
          overlayX: 'center',
          overlayY: 'bottom',
          originX: 'center',
          originY: 'top',
        }
      ]);

      t.data = this.aggregatedDiviStatistics;
      t.bedName = glypLegendEntity.name;

      t.explanation = this.translationService.translate(glypLegendEntity.description);

      t.accessorFunc = glypLegendEntity.accFunc;
  }

  emitCaseChoroplethOptions() {

    if (this._mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      this._mo.covidNumberCaseOptions.normalization = CovidNumberCaseNormalization.absolut;

      if (this._mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this._mo.covidNumberCaseOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    }

    this.emitMapOptions();
  }

  updateBedBackgroundBedType(state: BedType) {
    if (this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return;
    }

    this._mo.bedBackgroundOptions.bedType = state;

    this.emitMapOptions();
  }

  updateBedGlyphAggregationLevel(lvl: AggregationLevel) {
    this._mo.bedGlyphOptions.aggregationLevel = lvl;

    if (lvl === AggregationLevel.none) {
      this._mo.bedBackgroundOptions.enabled = false;
    } else {
      this._mo.bedBackgroundOptions.aggregationLevel = lvl;
    }

    this.emitMapOptions();
  }

  updateCovidNumberCaseOptionsEnabled(enabled: boolean) {
    this._mo.covidNumberCaseOptions.enabled = enabled;

    if (enabled) {
      this._mo.bedBackgroundOptions.enabled = false;
    }

    this.emitMapOptions();
  }

  updateBedBackgroundOptionsEnabled(enabled: boolean) {
    this._mo.bedBackgroundOptions.enabled = enabled;

    if (enabled) {
      this._mo.covidNumberCaseOptions.enabled = false;
    }

    this.emitMapOptions();
  }

  emitMapOptions() {
    if (this._mo.bedGlyphOptions.enabled) {
      this._mo.bedBackgroundOptions.showLabels = false;
      this._mo.covidNumberCaseOptions.showLabels = false;
      this._mo.covidNumberCaseOptions.showTrendGlyphs = false;
    } else {
      this._mo.bedBackgroundOptions.showLabels = true;
      this._mo.covidNumberCaseOptions.showLabels = true;
      this._mo.covidNumberCaseOptions.showTrendGlyphs = true;
    }

    this.updateSearch();
    this.mapOptionsChange.emit({...this._mo});
  }

  searchSelected(h: Searchable) {
    if (!h) {
      return;
    }

    this.flyTo.emit({
      loc: h.point,
      zoom: h.zoom
    });
  }

  isEBreakModePossible(): boolean {
    return this.caseUtil.isEBreakModePossible(this._mo.covidNumberCaseOptions);
  }

  isLockDownMode(): boolean {
    return this.caseUtil.isLockdownMode(this._mo.covidNumberCaseOptions);
  }

  trendSliderChanged() {
    this.emitMapOptions();
  }

  private combinedStatsOperator(): (input$: Observable<string>) => Observable<CombinedStatistics> {
    return (input$: Observable<string>) => input$.pipe(
      tap(() => this.aggregateStatisticsLoading$.next(true)),
      map(s => getStrDate(getDateTime(s).endOf('day'))),
      mergeMap(refDate => {
        const filtered = this.countryAggregatorService.diviAggregationForCountry(refDate);
        const unfiltered = this.countryAggregatorService.diviAggregationForCountryUnfiltered(refDate);

        const rki = this.countryAggregatorService.rkiAggregationForCountry(this._mo.covidNumberCaseOptions.dataSource, refDate);

        const prognosis = this.caseRepo.getRisklayerPrognosis();

        return forkJoin([filtered, unfiltered, rki, prognosis, of(refDate)]);
      }),
      map(([diviFiltered, diviUnfiltered, rki, prognosis, refDate]) => {
        this.aggregatedDiviStatistics = diviFiltered;

        let rkiOutdated: boolean;

        if (rki) {
          rkiOutdated = getDateTime(refDate).endOf('day').minus({days: 1}) > getDateTime(rki.timestamp);
        }

        const combinedStats = {
          diviFiltered,
          diviUnfiltered,
          rki,
          rkiOutdated,
          glyphData: [
            {name: 'ICU low', accessor: 'showIcuLow', accFunc: (d: QualitativeTimedStatus) => d.icu_low_state, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.icu_low_state), description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
            {name: 'ICU high', accessor: 'showIcuHigh', accFunc: (d: QualitativeTimedStatus) => d.icu_high_state, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.icu_high_state), description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
            {name: 'ECMO', accessor: 'showEcmo', accFunc: (d: QualitativeTimedStatus) => d.ecmo_state, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.ecmo_state), description: 'ECMO = Zusätzlich ECMO'}
          ],
          casesCountiesAvailable: rki?.num_counties_reported,
          casesCountiesTotal: rki?.num_counties_total,
          risklayerPrognosis: Math.round(prognosis.prognosis)
        } as CombinedStatistics;


        return combinedStats;
      }),
      tap(() => this.aggregateStatisticsLoading$.next(false))
    );
  }
}
