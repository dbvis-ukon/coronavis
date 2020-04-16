import { BreakpointObserver } from "@angular/cdk/layout";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Feature, MultiPolygon, Point } from 'geojson';
import { LatLngLiteral } from 'leaflet';
import moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, flatMap, map, toArray } from 'rxjs/operators';
import { BedTooltipComponent } from '../bed-tooltip/bed-tooltip.component';
import { HospitalSearchFeatureCollectionPermissible } from '../hospital-search/hospital-search.component';
import { FlyTo } from '../map/events/fly-to';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import { CountryAggregatorService } from '../services/country-aggregator.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { HospitalUtilService } from '../services/hospital-util.service';
import { OSMLayerService } from '../services/osm-layer.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { TooltipService } from '../services/tooltip.service';
import { TranslationService } from '../services/translation.service';
import { QualitativeTimedStatusAggregation } from '../services/types/qualitateive-timed-status-aggregation';

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

    if(!mo) {
      return;
    }

    this.refDay$.next(mo.bedGlyphOptions.date);
  }

  get mo(): MapOptions {
    return this._mo;
  }


  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  @Input('mapLocationSettings')
  mls: MapLocationSettings;

  @Output()
  flyTo = new EventEmitter<FlyTo>();
  
  aggregatedDiviStatistics: QualitativeTimedStatusAggregation;

  aggregatedRkiStatistics: QuantitativeAggregatedRkiCasesProperties;

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

  hospitals: HospitalSearchFeatureCollectionPermissible;
  resetHospitalSearch: number;

  numUnfilteredHospitals: number;

  private refDay$: BehaviorSubject<string> = new BehaviorSubject('now');

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
    private hospitalUtils: HospitalUtilService
  ) { }

  ngOnInit(): void {

    //close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if(isSmallScreen){
      this.mo.extendInfobox = false;
    }

    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);  

    this.refDay$
    .pipe(
      distinctUntilChanged(),
      map(s => s === 'now' ? new Date() : moment(s).endOf('day').toDate())
    )
    .subscribe(date => {
      this.updateHospitalStatistics(date);
    })


    this.countryAggregatorService.rkiAggregationForCountry()
    .subscribe(r => {
      this.aggregatedRkiStatistics = r;
    });

    this.updateHospitals();
  }

  updateHospitalStatistics(refDate: Date) {
    console.log('date updated', refDate);

    this.countryAggregatorService.diviAggregationForCountry(refDate)
    .subscribe(r => {
      this.aggregatedDiviStatistics = r;

      this.glyphLegend = [
        {name: 'ICU low', accessor: 'showIcuLow', accFunc: (r) => r.icu_low_care, description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
        {name: 'ICU high', accessor: 'showIcuHigh', accFunc: (r) => r.icu_high_care, description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
        {name: 'ECMO', accessor: 'showEcmo', accFunc: (r) => r.ecmo_state, description: 'ECMO = Zusätzlich ECMO'}
      ];
    });

    this.hospitalRepo.getDiviDevelopmentSingleHospitals(null)
    .pipe(
      flatMap(fc => fc.features),
      this.hospitalUtils.filterByDate(refDate),
      toArray()
    )
    .subscribe(d => this.numUnfilteredHospitals = d.length);
  }

  updateHospitals() {
    this.resetHospitalSearch = Math.random();
    if(this.mo.bedGlyphOptions.enabled === false) {
      return;
    }
    
    if(this.mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      this.hospitalRepo.getDiviDevelopmentSingleHospitals()
        .subscribe(d => this.hospitals = d);
    } else {
      this.hospitalRepo.getDiviDevelopmentForAggLevel(this.mo.bedGlyphOptions.aggregationLevel).subscribe(d => this.hospitals = d);
    }
  }

  openBedTooltip(evt, glypLegendEntity) {

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

    if(this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      this.mo.covidNumberCaseOptions.normalization = CovidNumberCaseNormalization.absolut;

      if (this.mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this.mo.covidNumberCaseOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    }

    this.emitMapOptions();
  }

  getGlyphColor(str: string) {
    return this.colormapService.getSingleHospitalColormap()(str);
  }

  updateBedBackgroundBedType(state: BedType) {
    if(this.mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return;
    }

    this.mo.bedBackgroundOptions.bedType = state;

    this.emitMapOptions();
  }

  updateBedGlyphAggregationLevel(lvl: AggregationLevel) {
    this.mo.bedGlyphOptions.aggregationLevel = lvl;

    if(lvl === AggregationLevel.none) {
      this.mo.bedBackgroundOptions.enabled = false;
    } else {
      this.mo.bedBackgroundOptions.aggregationLevel = lvl;
    }

    this.emitMapOptions();
  }

  updateCovidNumberCaseOptionsEnabled(enabled: boolean) {
    this.mo.covidNumberCaseOptions.enabled = enabled;

    if(enabled) {
      this.mo.bedBackgroundOptions.enabled = false;
    }

    this.emitMapOptions()
  }

  updateBedBackgroundOptionsEnabled(enabled: boolean) {
    this.mo.bedBackgroundOptions.enabled = enabled;

    if(enabled) {
      this.mo.covidNumberCaseOptions.enabled = false;
    }

    this.emitMapOptions()
  }

  emitMapOptions() {
    this.updateHospitals();
    this.mapOptionsChange.emit({...this.mo});
  }

  searchHospitalSelected(h: Feature<Point, SingleHospitalOut<any>> | Feature<MultiPolygon, AggregatedHospitalOut<any>>) {
    if(this.hospitalUtils.isSingleHospitalFeature(h)) {
      this.flyTo.emit({
        loc: {
          lat: h.geometry.coordinates[1],
          lng: h.geometry.coordinates[0]
        },
  
        zoom: 12
      });
    } else {
      const loc: LatLngLiteral = {
        lat: h.properties.centroid.coordinates[1],
        lng: h.properties.centroid.coordinates[0]
      };

      let zoom = 12;
      switch(this.mo.bedGlyphOptions.aggregationLevel){
        case AggregationLevel.county:
          zoom = 11;
          break;

        case AggregationLevel.governmentDistrict:
          zoom = 9;
          break;

        case AggregationLevel.state:
          zoom = 8;
          break;
      }

      this.flyTo.emit({
        loc,
        zoom
      });
    }

    
  }
}
