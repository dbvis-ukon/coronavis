import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, forkJoin, merge, Observable, of } from 'rxjs';
import { distinct, distinctUntilChanged, filter, map, mergeMap, tap, toArray } from 'rxjs/operators';
import { BedTooltipComponent } from '../bed-tooltip/bed-tooltip.component';
import { Searchable } from '../hospital-search/hospital-search.component';
import { FlyTo } from '../map/events/fly-to';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
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
import { getMoment, getStrDate } from '../util/date-util';

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
}

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  glyphLegend;

  glyphLegendColors = QualitativeColormapService.bedStati;

  private _mo: MapOptions;

  @Input('mapOptions')
  set mo(mo: MapOptions) {
    this._mo = mo;

    if (!mo) {
      return;
    }

    this.refDay$.next(mo.bedGlyphOptions.date);
  }

  get mo(): MapOptions {
    return this._mo;
  }


  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  // tslint:disable-next-line:no-input-rename
  @Input('mapLocationSettings')
  mls: MapLocationSettings;

  @Output()
  flyTo = new EventEmitter<FlyTo>();

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
    private caseUtil: CaseUtilService
  ) { }

  ngOnInit(): void {
    // close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if (isSmallScreen){
      this.mo.extendInfobox = false;
    }

    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);

    this.combinedStats$ = this.refDay$
    .pipe(
      distinctUntilChanged(),
      tap(() => this.aggregateStatisticsLoading$.next(true)),
      map(s => getStrDate(getMoment(s).endOf('day'))),
      // tap(refDate => console.log('refdate', refDate)),
      mergeMap(refDate => {
        const filtered = this.countryAggregatorService.diviAggregationForCountry(refDate);
        const unfiltered = this.countryAggregatorService.diviAggregationForCountryUnfiltered(refDate);

        const rki = this.countryAggregatorService.rkiAggregationForCountry(this._mo.covidNumberCaseOptions.dataSource, refDate);

        const aggLevelData = this.caseRepo.getCasesDevelopmentForAggLevel(
          this._mo.covidNumberCaseOptions.dataSource,
          this._mo.covidNumberCaseOptions.aggregationLevel,
          getStrDate(getMoment(refDate)),
          getStrDate(getMoment(refDate).add(1, 'day')));

        return forkJoin([filtered, unfiltered, rki, aggLevelData, of(refDate)]);
      }),
      map(([diviFiltered, diviUnfiltered, rki, aggLevelData, refDate]) => {
        this.aggregatedDiviStatistics = diviFiltered;

        const rkiOutdated = getMoment(refDate).endOf('day').subtract(1, 'day').isAfter(getMoment(rki.timestamp));

        const availableCounties = aggLevelData.features
          .map(d => d.properties.developments[d.properties.developments.length - 1])
          .filter(d => d.last_updated)
          .length;

        const combinedStats = {
          diviFiltered,
          diviUnfiltered,
          rki,
          rkiOutdated,
          glyphData: [
            {name: 'ICU low', accessor: 'showIcuLow', accFunc: (d: QualitativeTimedStatus) => d.icu_low_care, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.icu_low_care), description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
            {name: 'ICU high', accessor: 'showIcuHigh', accFunc: (d: QualitativeTimedStatus) => d.icu_high_care, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.icu_high_care), description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
            {name: 'ECMO', accessor: 'showEcmo', accFunc: (d: QualitativeTimedStatus) => d.ecmo_state, color: this.colormapService.getBedStatusColor(diviFiltered, (d) => d.ecmo_state), description: 'ECMO = Zusätzlich ECMO'}
          ],
          casesCountiesAvailable: availableCounties,
          casesCountiesTotal: aggLevelData.features.length
        } as CombinedStatistics;


        return combinedStats;
      }),
      tap(() => this.aggregateStatisticsLoading$.next(false))
    );


    this.updateSearch();
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

  private hospitalSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel(this._mo.bedGlyphOptions.aggregationLevel);

    if (this._mo.bedGlyphOptions.enabled && this._mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return this.hospitalRepo
      .getDiviDevelopmentSingleHospitals()
      .pipe(
        mergeMap(d => d.features),
        map(d => {
          return {
            name: d.properties.name,
            addition: d.properties.address,
            point: {
              lat: d.geometry.coordinates[1],
              lng: d.geometry.coordinates[0]
            },
            zoom
          } as Searchable;
        }),
      );
    } else if (this._mo.bedGlyphOptions.enabled && this._mo.bedGlyphOptions.aggregationLevel !== AggregationLevel.none) {
      return this.hospitalRepo
      .getDiviDevelopmentForAggLevel(this.mo.bedBackgroundOptions.aggregationLevel)
      .pipe(
        mergeMap(d => d.features),
        map(d => {
          return {
            name: d.properties.name,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable;
        })
      );
    }

    return of();
  }

  private bedBackgroundSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel(this._mo.bedBackgroundOptions.aggregationLevel);
    if (this._mo.bedBackgroundOptions.enabled && this._mo.bedBackgroundOptions.aggregationLevel !== AggregationLevel.none) {
      return this.hospitalRepo
      .getDiviDevelopmentForAggLevel(this.mo.bedBackgroundOptions.aggregationLevel)
      .pipe(
        mergeMap(d => d.features),
        map(d => {
          return {
            name: d.properties.name,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable;
        })
      );
    }

    return of();
  }

  private caseSearchResult(): Observable<Searchable> {
    const zoom = this.getZoomForAggLevel(this.mo.covidNumberCaseOptions.aggregationLevel);
    if (this._mo.covidNumberCaseOptions.enabled) {
      const [from, to] = this.caseUtil.getFromToTupleFromOptions(this._mo.covidNumberCaseOptions);

      return this.caseRepo
      .getCasesDevelopmentForAggLevel(this._mo.covidNumberCaseOptions.dataSource, this.mo.covidNumberCaseOptions.aggregationLevel, from, to)
      .pipe(
        mergeMap(d => d.features),
        map(d => {
          return {
            name: d.properties.name,
            addition: d.properties.description,
            point: {
              lat: d.properties.centroid.coordinates[1],
              lng: d.properties.centroid.coordinates[0]
            },
            zoom
          } as Searchable;
        })
      );
    }

    return of();
  }

  private getZoomForAggLevel(lvl: AggregationLevel): number {
    let zoom;

    switch (this.mo.bedGlyphOptions.aggregationLevel){
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

    if (this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      this.mo.covidNumberCaseOptions.normalization = CovidNumberCaseNormalization.absolut;

      if (this.mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this.mo.covidNumberCaseOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    }

    this.emitMapOptions();
  }

  updateBedBackgroundBedType(state: BedType) {
    if (this.mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return;
    }

    this.mo.bedBackgroundOptions.bedType = state;

    this.emitMapOptions();
  }

  updateBedGlyphAggregationLevel(lvl: AggregationLevel) {
    this.mo.bedGlyphOptions.aggregationLevel = lvl;

    if (lvl === AggregationLevel.none) {
      this.mo.bedBackgroundOptions.enabled = false;
    } else {
      this.mo.bedBackgroundOptions.aggregationLevel = lvl;
    }

    this.emitMapOptions();
  }

  updateCovidNumberCaseOptionsEnabled(enabled: boolean) {
    this.mo.covidNumberCaseOptions.enabled = enabled;

    if (enabled) {
      this.mo.bedBackgroundOptions.enabled = false;
    }

    this.emitMapOptions();
  }

  updateBedBackgroundOptionsEnabled(enabled: boolean) {
    this.mo.bedBackgroundOptions.enabled = enabled;

    if (enabled) {
      this.mo.covidNumberCaseOptions.enabled = false;
    }

    this.emitMapOptions();
  }

  emitMapOptions() {
    if (this.mo.bedGlyphOptions.enabled) {
      this.mo.bedBackgroundOptions.showLabels = false;
      this.mo.covidNumberCaseOptions.showLabels = false;
      this.mo.covidNumberCaseOptions.showTrendGlyphs = false;
    } else {
      this.mo.bedBackgroundOptions.showLabels = true;
      this.mo.covidNumberCaseOptions.showLabels = true;
      this.mo.covidNumberCaseOptions.showTrendGlyphs = true;
    }

    this.updateSearch();
    this.mapOptionsChange.emit({...this.mo});
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
}
