import {Component} from '@angular/core';
import {FeatureCollection} from 'geojson';
import {Overlay} from './map/overlays/overlay';
import {AggregationLevel} from './map/options/aggregation-level';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from './map/options/covid-number-case-options';
import { GlyphState } from './map/options/glyph-state';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  aggregationLevel: AggregationLevel = AggregationLevel.none;

  glyphState: GlyphState = GlyphState.none;

  showOsmHospitals: boolean = false;

  showOsmHeliports: boolean = false;

  caseChoroplethOptions: CovidNumberCaseOptions = {
    enabled: false,
    type: CovidNumberCaseType.cases,
    timeWindow: CovidNumberCaseTimeWindow.all,
    change: CovidNumberCaseChange.absolute,
    normalization: CovidNumberCaseNormalization.per100k
  };

  // constructor is here only used to inject services
  constructor() { }
}
