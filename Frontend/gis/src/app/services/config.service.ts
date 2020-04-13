import { Injectable } from '@angular/core';
import { merge } from 'lodash-es';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private defaultMapOptions: MapOptions = {
    hideInfobox: false,

    extendInfobox: true,

    showHelpOnStart: true,

    bedGlyphOptions: {
      date: 'now',
      aggregationLevel: AggregationLevel.none,
      enabled: true,
      showEcmo: true,
      showIcuHigh: true,
      showIcuLow: true,
      forceDirectedOn: true
    },

    bedBackgroundOptions: {
      date: 'now',
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
  };

  private defaultMapLocationSettings: MapLocationSettings = {

    center: {
      lat: 48.6813312,
      lng: 9.0088299
    },

    zoom: 9,

    allowPanning: true,

    allowZooming: true
  };

  constructor() { }


  getDefaultMapOptions(): MapOptions {
    return JSON.parse(JSON.stringify(this.defaultMapOptions));
  }

  overrideMapOptions(override: RecursivePartial<MapOptions>, override2: RecursivePartial<MapOptions> = null): MapOptions {
    if(!override2) {
      return merge<MapOptions, RecursivePartial<MapOptions>>(this.getDefaultMapOptions(), override);
    }

    return merge<MapOptions, RecursivePartial<MapOptions>, RecursivePartial<MapOptions>>(this.getDefaultMapOptions(), override, override2);
  }


  getDefaultMapLocationSettings(): MapLocationSettings {
    return JSON.parse(JSON.stringify(this.defaultMapLocationSettings));
  }

  overrideMapLocationSettings(override: RecursivePartial<MapLocationSettings>, override2: RecursivePartial<MapLocationSettings> = null): MapLocationSettings {
    if(!override2) {
      return merge<MapLocationSettings, RecursivePartial<MapLocationSettings>>(this.getDefaultMapLocationSettings(), override);
    }

    return merge<MapLocationSettings, RecursivePartial<MapLocationSettings>, RecursivePartial<MapLocationSettings>>(this.getDefaultMapLocationSettings(), override, override2);
  }
}
