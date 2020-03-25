import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import { ColormapService } from '../services/colormap.service';
import { BedType } from '../map/options/bed-type.enum';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { MapOptions } from '../map/options/map-options';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor(
    private colormapService: ColormapService
  ) { }

  glyphLegend;

  glyphLegendColors = ColormapService.bedStati;

  infoboxExtended = true;

  @Input('mapOptions')
  mo: MapOptions;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  // ENUM MAPPING
  covidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  covidNumberCaseChange = CovidNumberCaseChange;

  covidNumberCaseType = CovidNumberCaseType;

  covidNumberCaseNormalization = CovidNumberCaseNormalization;

  glyphStates = BedType;

  aggregationLevels = AggregationLevel;

  internalBedType: BedType = BedType.none;

  ngOnInit(): void {
    this.glyphLegend = [
      {name: 'ICU low', state: BedType.icuLow, accessor: 'showIcuLow', color: this.glyphLegendColors[1] , description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'}, 
      {name: 'ICU high', state: BedType.icuHigh, accessor: 'showIcuHigh', color: this.glyphLegendColors[0], description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'}, 
      {name: 'ECMO', state: BedType.ecmo, accessor: 'showEcmo', color: this.glyphLegendColors[2], description: 'ECMO = Zusätzlich ECMO'}
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

    // user clicked on same glyph, disable
    if(this.internalBedType === state) {
      this.internalBedType = BedType.none;
    } else {
      this.internalBedType = state;
    }

    this.mo.bedBackgroundOptions.bedType = this.internalBedType;

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

  getBorderColor(state: BedType) {
    if(this.mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return 'white';
    }

    return state === this.internalBedType ? 'gray' : 'lightgrey'
  }

  emitMapOptions() {
    console.log('emit map options', this.mo);
    this.mapOptionsChange.emit({...this.mo});
  }

}
