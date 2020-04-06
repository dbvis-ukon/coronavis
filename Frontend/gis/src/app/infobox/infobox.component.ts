import { BreakpointObserver } from "@angular/cdk/layout";
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { APP_CONFIG_KEY } from "../../constants";
import { AboutComponent } from '../about/about.component';
import { BedTooltipComponent } from '../bed-tooltip/bed-tooltip.component';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { ImpressumComponent } from '../impressum/impressum.component';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapOptions } from '../map/options/map-options';
import { QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import { CountryAggregatorService } from '../services/country-aggregator.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { I18nService, SupportedLocales } from '../services/i18n.service';
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

  constructor(
    public colormapService: QualitativeColormapService,
    private dialogService: MatDialog,
    private osmLayerService: OSMLayerService,
    private glyphLayerService: GlyphLayerService,
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private caseChoroplethLayerService: CaseChoroplethLayerService,
    private i18nService: I18nService,
    private breakPointObserver: BreakpointObserver,
    private countryAggregatorService: CountryAggregatorService,
    public tooltipService: TooltipService,
    private translationService: TranslationService
  ) { }

  glyphLegend;

  glyphLegendColors = QualitativeColormapService.bedStati;

  infoboxExtended = true;

  @Input('mapOptions')
  mo: MapOptions;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

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


  supportedLocales: string[];

  selectedLocale: SupportedLocales;


  glyphLoading = false;
  bedChoroplethLoading = false;
  caseChoroplethLoading = false;
  osmLoading = false;

  ngOnInit(): void {

    //close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if(isSmallScreen){
      this.infoboxExtended = false;
    }

    this.supportedLocales = this.i18nService.getSupportedLocales();

    this.i18nService.currentLocale().subscribe(l => {
      this.selectedLocale = l;
    })

    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);

    


    this.countryAggregatorService.diviAggregationForCountry()
    .subscribe(r => {
      this.aggregatedDiviStatistics = r;

      this.glyphLegend = [
        {name: 'ICU low', accessor: 'showIcuLow', accFunc: (r) => r.icu_low_care, description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
        {name: 'ICU high', accessor: 'showIcuHigh', accFunc: (r) => r.icu_high_care, description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
        {name: 'ECMO', accessor: 'showEcmo', accFunc: (r) => r.ecmo_state, description: 'ECMO = Zusätzlich ECMO'}
      ];
    });

    this.countryAggregatorService.rkiAggregationForCountry()
    .subscribe(r => {
      this.aggregatedRkiStatistics = r;
    })
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
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(this.mo));
    this.mapOptionsChange.emit({...this.mo});
  }

  openAbout() {
    this.dialogService.open(AboutComponent, {
		panelClass: 'popup-panel-white-glass-background'
	});
  }

  openImpressum() {
    this.dialogService.open(ImpressumComponent);
  }

  openVideo() {
    window.open('https://video.coronavis.dbvis.de', '_blank');
    // location.href = 'https://video.coronavis.dbvis.de';
  }

  changeLocale(evt) {
    this.i18nService.updateLocale(evt.value);

    const url = evt.value.slice(0,2);

    location.href = `/${url}/`;
  }


  openHelp() {
    this.dialogService.open(HelpDialogComponent);
  }
}
