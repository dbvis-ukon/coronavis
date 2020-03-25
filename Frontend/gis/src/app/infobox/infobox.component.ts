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

  toggleBarchart() {
    this.barchart = (this.barchart === null ? this.barchartT : null)
  }

  barchart = null;

  barchartT = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "data": {
      "values": [
        {"cat": "Verfügbar", "num": 6, "color": "red"},
        {"cat": "Begrenzt", "num": 3, "color": "green"},
        {"cat": "Ausgelastet", "num": 1, "color": "blue"},
        {"cat": "Nicht verfügbar", "num": 0, "color": "yellow"}
      ]
    },
    "mark": {"type": "bar"},
    "encoding": {
      "x": {
        "field": "cat", 
        "type": "nominal", 
        "title": "ICU Low care", 
        "sort": ["Verfügbar", "Begrenzt", "Ausgelastet", "Nicht verfügbar"]
        },
      "y": {
        "field": "num", 
        "type": "quantitative", 
        "title": "Anzahl Krankenhäuser",
        "scale": {"domain": [0, 10]}
        },
      "color": {
        "field": "color", "type": "nominal", "scale": null
      }
    }
  };

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
  // because in HTML, this stuff cannot be accessed
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  eCovidNumberCaseChange = CovidNumberCaseChange;

  eCovidNumberCaseType = CovidNumberCaseType;

  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;

  eBedTypes = BedType;

  eAggregationLevels = AggregationLevel;

  ngOnInit(): void {
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
    this.mapOptionsChange.emit({...this.mo});
  }

}
