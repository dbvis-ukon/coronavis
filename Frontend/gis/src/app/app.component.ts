import {Component, OnInit} from '@angular/core';
import {FeatureCollection} from 'geojson';
import {Overlay} from './map/overlays/overlay';
import {AggregationLevel} from './map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from './map/options/covid-number-case-options';
import {BedType} from './map/options/bed-type.enum';
import {CaseChoropleth} from './map/overlays/casechoropleth';
import {MapOptions} from './map/options/map-options';
import { environment } from 'src/environments/environment';
import {APP_CONFIG_KEY} from "../constants";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay<FeatureCollection>> = new Array<Overlay<FeatureCollection>>();

  mapOptions: MapOptions = JSON.parse(localStorage.getItem(APP_CONFIG_KEY)) as MapOptions || {
    bedGlyphOptions: {
      aggregationLevel: AggregationLevel.none,
      enabled: true,
      showEcmo: true,
      showIcuHigh: true,
      showIcuLow: true
    },

    bedBackgroundOptions: {
      bedType: BedType.icuLow,
      enabled: false,
      aggregationLevel: AggregationLevel.county
    },

    covidNumberCaseOptions: {
      change: CovidNumberCaseChange.absolute,
      normalization: CovidNumberCaseNormalization.absolut,
      timeWindow: CovidNumberCaseTimeWindow.all,
      type: CovidNumberCaseType.cases,
      enabled: false,
      aggregationLevel: AggregationLevel.county
    },

    showOsmHeliports: false,

    showOsmHospitals: false
  }

  currentCaseChoropleth: CaseChoropleth;

  siteId: number;

  // constructor is here only used to inject services
  constructor() { }

  ngOnInit(): void {
    const trackingPixelSiteIDMapping = {
      'production': 1,
      'staging': 3,
      'review': 4,
      'development': 5
    };

    this.siteId = trackingPixelSiteIDMapping[environment.env];
  }
}
