import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AggregationLevel} from '../map/options/aggregation-level';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import { ColormapService } from '../services/colormap.service';
import { GlyphState } from '../map/options/glyph-state';

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

  glyphLegendColors = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'];

  infoboxExtended = true;

  @Input()
  aggregationLevel: AggregationLevel;

  @Output()
  aggregationLevelChange: EventEmitter<AggregationLevel> = new EventEmitter();

  @Input()
  glyphState: GlyphState;

  @Output()
  glyphStateChange: EventEmitter<GlyphState> = new EventEmitter();

  @Input()
  showOsmHospitals: boolean;

  @Output()
  showOsmHospitalsChange: EventEmitter<boolean> = new EventEmitter();

  @Input()
  showOsmHeliports: boolean;

  @Output()
  showOsmHeliportsChange: EventEmitter<boolean> = new EventEmitter();

  @Input()
  caseChoroplethOptions: CovidNumberCaseOptions;

  @Output()
  caseChoroplethOptionsChange: EventEmitter<CovidNumberCaseOptions> = new EventEmitter();

  covidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  covidNumberCaseChange = CovidNumberCaseChange;

  covidNumberCaseType = CovidNumberCaseType;

  covidNumberCaseNormalization = CovidNumberCaseNormalization;

  glyphStates = GlyphState;

  aggregationLevels = AggregationLevel;

  internalGlyphState: GlyphState = GlyphState.none;

  ngOnInit(): void {
    this.glyphLegend = [
      {name: 'ICU low', state: GlyphState.icuLow, color: this.glyphLegendColors[1] , description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'}, 
      {name: 'ICU high', state: GlyphState.icuHigh, color: this.glyphLegendColors[0], description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'}, 
      {name: 'ECMO', state: GlyphState.ecmo, color: this.glyphLegendColors[2], description: 'ECMO = Zusätzlich ECMO'}
    ];
  }

  emitCaseChoroplethOptions() {
    // console.log('emit', this.caseChoroplethOptions);

    if(this.caseChoroplethOptions.change === CovidNumberCaseChange.relative) {
      this.caseChoroplethOptions.normalization = CovidNumberCaseNormalization.absolut;

      if (this.caseChoroplethOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this.caseChoroplethOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    }
    this.caseChoroplethOptionsChange.emit({...this.caseChoroplethOptions});
  }

  getGlyphColor(str: string) {
    return this.colormapService.getSingleHospitalColormap()(str);
  }

  updateGlyphState(state: GlyphState) {
    if(this.aggregationLevel === AggregationLevel.none) {
      return;
    }

    // user clicked on same glyph, disable
    if(this.internalGlyphState === state) {
      this.internalGlyphState = GlyphState.none;
    } else {
      this.internalGlyphState = state;
    }

    this.glyphStateChange.emit(this.internalGlyphState);
  }

  getBorderColor(state: GlyphState) {
    if(this.aggregationLevel === AggregationLevel.none) {
      return 'white';
    }

    return state === this.internalGlyphState ? 'gray' : 'lightgrey'
  }

}
