import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import { BedType } from '../map/options/bed-type.enum';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { MapOptions } from '../map/options/map-options';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { ImpressumComponent } from '../impressum/impressum.component';
import { OSMLayerService } from '../services/osm-layer.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import {APP_CONFIG_KEY} from "../../constants";
import { QuantitativeColormapService } from '../services/quantitative-colormap.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor(
    private colormapService: QualitativeColormapService,
    private dialogService: MatDialog,
    private osmLayerService: OSMLayerService,
    private glyphLayerService: GlyphLayerService,
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private caseChoroplethLayerService: CaseChoroplethLayerService
  ) { }

  glyphLegend;

  glyphLegendColors = QualitativeColormapService.bedStati;

  infoboxExtended = true;

  @Input('mapOptions')
  mo: MapOptions;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

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

  ngOnInit(): void {
    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);


    this.glyphLegend = [
      {name: 'ICU low', accessor: 'showIcuLow', color: this.glyphLegendColors[1] , description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
      {name: 'ICU high', accessor: 'showIcuHigh', color: this.glyphLegendColors[0], description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
      {name: 'ECMO', accessor: 'showEcmo', color: this.glyphLegendColors[2], description: 'ECMO = Zusätzlich ECMO'}
    ];
  }

  emitCaseChoroplethOptions() {
    // console.log('emit', this.caseChoroplethOptions);

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

}
