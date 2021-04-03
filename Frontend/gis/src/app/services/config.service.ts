import { Injectable } from '@angular/core';
import { merge } from 'lodash-es';
import { AgeGroupBinning, CovidChartOptions, ScaleType, TimeGranularity } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { BedType } from '../map/options/bed-type.enum';
import { CovidNumberCaseChange, CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { MapLocationSettings } from '../map/options/map-location-settings';
import { MapOptions } from '../map/options/map-options';

type RecursivePartial<T> = {
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
      aggregationLevel: AggregationLevel.county,
      showLabels: false
    },

    covidNumberCaseOptions: {
      date: 'now',
      dataSource: CovidNumberCaseDataSource.rki,
      daysForTrend: 7,
      change: CovidNumberCaseChange.absolute,
      normalization: CovidNumberCaseNormalization.absolut,
      timeWindow: CovidNumberCaseTimeWindow.all,
      type: CovidNumberCaseType.cases,
      enabled: false,
      aggregationLevel: AggregationLevel.county,
      showLabels: false,
      showTrendGlyphs: false,
      showOnlyAvailableCounties: false
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
    if (!override2) {
      return merge<MapOptions, RecursivePartial<MapOptions>>(this.getDefaultMapOptions(), override);
    }

    return merge<MapOptions, RecursivePartial<MapOptions>, RecursivePartial<MapOptions>>(this.getDefaultMapOptions(), override, override2);
  }

  getLockDownMapOptions(live: boolean): MapOptions {
    return this.overrideMapOptions({
      bedGlyphOptions: {
        enabled: false
      },
      bedBackgroundOptions: {
        enabled: false,
        showLabels: true
      },
      covidNumberCaseOptions: {
        enabled: true,
        dataSource: (live ? CovidNumberCaseDataSource.risklayer : CovidNumberCaseDataSource.rki),
        aggregationLevel: AggregationLevel.county,
        change: CovidNumberCaseChange.absolute,
        date: 'now',
        normalization: CovidNumberCaseNormalization.per100k,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        type: CovidNumberCaseType.cases,
        showLabels: true,
        showTrendGlyphs: true
      }
    });
  }

  getICUMapOptions(): MapOptions {
    return this.overrideMapOptions({
      bedGlyphOptions: {
        enabled: true,
        aggregationLevel: AggregationLevel.none,
        date: 'now',
        forceDirectedOn: true,
        showIcuLow: true,
        showIcuHigh: true,
        showEcmo: true
      },
      bedBackgroundOptions: {
        enabled: false,
      },
      covidNumberCaseOptions: {
        enabled: false
      }
    });
  }


  getDefaultMapLocationSettings(): MapLocationSettings {
    return JSON.parse(JSON.stringify(this.defaultMapLocationSettings));
  }

  overrideMapLocationSettings(override: RecursivePartial<MapLocationSettings>, override2: RecursivePartial<MapLocationSettings> = null): MapLocationSettings {
    if (!override2) {
      return merge<MapLocationSettings, RecursivePartial<MapLocationSettings>>(this.getDefaultMapLocationSettings(), override);
    }

    return merge<MapLocationSettings, RecursivePartial<MapLocationSettings>, RecursivePartial<MapLocationSettings>>(this.getDefaultMapLocationSettings(), override, override2);
  }

  getDefaultChartConfig(chartType: 'multiline' | 'pixel' | 'table' | 'stackedareaicu'): CovidChartOptions {
    if (chartType === 'multiline') {
      return {
        type: CovidNumberCaseType.cases,
        dataSource: CovidNumberCaseDataSource.rki,
        normalization: CovidNumberCaseNormalization.per100k,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        timeAgg: TimeGranularity.yearmonthdate,
        ageGroupBinning: null,
        scaleType: ScaleType.linear,
        date: 'now',
        showTrendGlyphs: true,
        daysForTrend: 7,
        change: CovidNumberCaseChange.absolute,
        showLabels: true,
        showOnlyAvailableCounties: false,
        temporalExtent: {
          type: 'global',
          manualExtent: [null, null],
          manualLastDays: null
        },
        valueExtent: {
          type: 'local',
          manualExtent: [0, 0]
        }
      };
    } else if (chartType === 'pixel') {
      return {
        type: CovidNumberCaseType.cases,
        dataSource: CovidNumberCaseDataSource.survstat,
        normalization: CovidNumberCaseNormalization.per100k,
        timeWindow: CovidNumberCaseTimeWindow.sevenDays,
        timeAgg: TimeGranularity.yearweek,
        ageGroupBinning: AgeGroupBinning.fiveyears,
        scaleType: ScaleType.linear,
        date: 'now',
        showTrendGlyphs: true,
        daysForTrend: 7,
        change: CovidNumberCaseChange.absolute,
        showLabels: true,
        showOnlyAvailableCounties: false,
        temporalExtent: {
          type: 'global',
          manualExtent: [null, null],
          manualLastDays: null
        },
        valueExtent: {
          type: 'global',
          manualExtent: [0, 0]
        }
      };
    } else if (chartType === 'table') {
        return {
          type: CovidNumberCaseType.cases,
          dataSource: CovidNumberCaseDataSource.rki,
          normalization: CovidNumberCaseNormalization.per100k,
          timeWindow: CovidNumberCaseTimeWindow.sevenDays,
          timeAgg: TimeGranularity.yearweek,
          ageGroupBinning: null,
          scaleType: ScaleType.linear,
          date: 'now',
          showTrendGlyphs: true,
          daysForTrend: 7,
          change: CovidNumberCaseChange.absolute,
          showLabels: true,
          showOnlyAvailableCounties: false,
          temporalExtent: {
            type: 'global',
            manualExtent: [null, null],
            manualLastDays: null
          },
          valueExtent: {
            type: 'local',
            manualExtent: [0, 0]
          }
        };
    } else if (chartType === 'stackedareaicu') {
        return {
          type: CovidNumberCaseType.cases,
          dataSource: CovidNumberCaseDataSource.divi,
          normalization: CovidNumberCaseNormalization.absolut,
          timeWindow: CovidNumberCaseTimeWindow.all,
          timeAgg: TimeGranularity.yearmonthdate,
          ageGroupBinning: null,
          scaleType: ScaleType.linear,
          date: 'now',
          showTrendGlyphs: true,
          daysForTrend: 7,
          change: CovidNumberCaseChange.absolute,
          showLabels: true,
          showOnlyAvailableCounties: false,
          temporalExtent: {
            type: 'global',
            manualExtent: [null, null],
            manualLastDays: null
          },
          valueExtent: {
            type: 'local',
            manualExtent: [0, 0]
          }
        };
    } else {
      throw new Error('ChartType ' + chartType + ' unknown.');
    }
  }

  parseConfig(cfg: CovidChartOptions | CovidNumberCaseOptions, chartType: 'multiline' | 'pixel' | 'table' | 'stackedareaicu', autoConfig = false): {config: CovidChartOptions; disabled: Set<string>; hidden: Set<string>} {
    const ret: {
      config: CovidChartOptions;
      disabled: Set<string>;
      hidden: Set<string>;
    } = {config: null, disabled: new Set<string>(), hidden: new Set<string>()};

    ret.config = merge(this.getDefaultChartConfig(chartType), cfg);

    if ((ret.config.temporalExtent.manualExtent[0] as any) instanceof Date) {
      ret.config.temporalExtent.manualExtent[0] = (ret.config.temporalExtent.manualExtent[0] as unknown as Date).toISOString();
    }

    if ((ret.config.temporalExtent.manualExtent[1] as any) instanceof Date) {
      ret.config.temporalExtent.manualExtent[1] = (ret.config.temporalExtent.manualExtent[1] as unknown as Date).toISOString();
    }


    if (ret.config.type === CovidNumberCaseType.patients
      || ret.config.type === CovidNumberCaseType.patientsVentilated
      || ret.config.type === CovidNumberCaseType.bedOccupancyPercent) {
      ret.config.dataSource = CovidNumberCaseDataSource.divi;
      ret.disabled.add('dataSource');

      ret.config.ageGroupBinning = null;
      ret.disabled.add('ageGroupBinning');

      if (autoConfig) {
        ret.config.timeWindow = CovidNumberCaseTimeWindow.all;
        if (ret.config.type !== CovidNumberCaseType.bedOccupancyPercent) {
          ret.config.normalization = CovidNumberCaseNormalization.per100k;
        } else {
          ret.config.normalization = CovidNumberCaseNormalization.absolut;
        }
      }
    }


    if (chartType === 'multiline') {
      ret.config.ageGroupBinning = null;
      ret.disabled.add('ageGroupBinning');

      if (ret.config.type === CovidNumberCaseType.cases || ret.config.type === CovidNumberCaseType.deaths) {
        ret.disabled.add('dataSource.divi');
        ret.disabled.add('dataSource.survstat');
      }
    }

    if (ret.config.type === CovidNumberCaseType.bedOccupancyPercent) {
      ret.disabled.add('normalization.per100k');
    }


    if (chartType === 'pixel') {
      ret.disabled.add('type.patients');
      ret.disabled.add('type.patientsVentilated');
      ret.disabled.add('type.bedOccupancyPercent');
      ret.disabled.add('dataSource.risklayer');
      ret.disabled.add('dataSource.divi');

      if (ret.config.type !== CovidNumberCaseType.deaths) {
        ret.config.type = CovidNumberCaseType.cases;
        ret.config.dataSource = CovidNumberCaseDataSource.survstat;
      } else {
        ret.config.type = CovidNumberCaseType.deaths;
        ret.config.dataSource = CovidNumberCaseDataSource.rki;
      }

      if (autoConfig) {
        ret.config.normalization = CovidNumberCaseNormalization.per100k;
        ret.config.timeAgg = TimeGranularity.yearweek;
        ret.config.timeWindow = CovidNumberCaseTimeWindow.sevenDays;

        if (ret.config.type === CovidNumberCaseType.cases) {
          ret.config.dataSource = CovidNumberCaseDataSource.survstat;
          ret.config.ageGroupBinning = AgeGroupBinning.fiveyears;
        } else {
          ret.config.dataSource = CovidNumberCaseDataSource.rki;
          ret.config.ageGroupBinning = AgeGroupBinning.rki;
        }
      }

      if (ret.config.type === CovidNumberCaseType.deaths) {
        ret.config.dataSource = CovidNumberCaseDataSource.rki;
        ret.disabled.add('dataSource.survstat');
      }

      if (ret.config.dataSource === CovidNumberCaseDataSource.rki) {
        ret.config.ageGroupBinning = AgeGroupBinning.rki;
        ret.disabled.add('ageGroupBinning.all');
        ret.disabled.add('ageGroupBinning.fiveyears');
      }
    }

    if (chartType === 'table') {
      ret.hidden.add('type');
      ret.disabled.add('dataSource.divi');
      ret.disabled.add('dataSource.survstat');
      ret.hidden.add('normalization');
      ret.hidden.add('timeWindow');
      ret.hidden.add('timeAgg');
      ret.hidden.add('ageGroupBinning');
      ret.hidden.add('scaleType');

      ret.hidden.add('temporalExtent');
      ret.hidden.add('valueExtent');
    }

    if (chartType === 'stackedareaicu') {
      ret.hidden.add('type');
      ret.disabled.add('dataSource.rki');
      ret.disabled.add('dataSource.survstat');
      ret.disabled.add('dataSource.risklayer');
      ret.hidden.add('normalization');
      ret.hidden.add('timeWindow');
      ret.hidden.add('timeAgg');
      ret.hidden.add('ageGroupBinning');
      ret.hidden.add('scaleType');
    }

    if (autoConfig) {
      const autoCfg = this.getAutoConfig(ret.config, chartType);
      if (autoCfg !== null) {
        ret.config = autoCfg;
      }
    }

    return ret;
  }

  getAutoConfig(cur: CovidChartOptions, chartType: 'multiline' | 'pixel' | 'table' | 'stackedareaicu'): CovidChartOptions | null {
    const copy: CovidChartOptions = JSON.parse(JSON.stringify(cur));
    if (chartType === 'table') {
      return null;
    }

    if (chartType === 'pixel') {
      if (cur.type === CovidNumberCaseType.cases) {
        copy.dataSource = CovidNumberCaseDataSource.survstat;
        copy.normalization = CovidNumberCaseNormalization.per100k;
        copy.timeWindow = CovidNumberCaseTimeWindow.sevenDays;
        copy.timeAgg = TimeGranularity.yearweek;
        copy.ageGroupBinning = AgeGroupBinning.fiveyears;
        copy.scaleType = ScaleType.linear;

        return copy;
      }

      if (cur.type === CovidNumberCaseType.deaths) {
        copy.dataSource = CovidNumberCaseDataSource.rki;
        copy.normalization = CovidNumberCaseNormalization.per100k;
        copy.timeWindow = CovidNumberCaseTimeWindow.sevenDays;
        copy.timeAgg = TimeGranularity.yearweek;
        copy.ageGroupBinning = AgeGroupBinning.rki;
        copy.scaleType = ScaleType.linear;

        return copy;
      }
    }

    if (chartType === 'multiline') {
      if (cur.type === CovidNumberCaseType.cases || cur.type === CovidNumberCaseType.deaths) {
        copy.dataSource = CovidNumberCaseDataSource.rki;
        copy.normalization = CovidNumberCaseNormalization.per100k;
        copy.timeWindow = CovidNumberCaseTimeWindow.sevenDays;
        copy.timeAgg = TimeGranularity.yearmonthdate;
        copy.ageGroupBinning = AgeGroupBinning.fiveyears;
        copy.scaleType = ScaleType.linear;

        return copy;
      }

      if (cur.type === CovidNumberCaseType.patients || cur.type === CovidNumberCaseType.patientsVentilated) {
        copy.dataSource = CovidNumberCaseDataSource.divi;
        copy.normalization = CovidNumberCaseNormalization.per100k;
        copy.timeWindow = CovidNumberCaseTimeWindow.all;
        copy.timeAgg = TimeGranularity.yearmonthdate;
        copy.ageGroupBinning = AgeGroupBinning.fiveyears;
        copy.scaleType = ScaleType.linear;

        return copy;
      }

      if (cur.type === CovidNumberCaseType.bedOccupancyPercent) {
        copy.dataSource = CovidNumberCaseDataSource.divi;
        copy.normalization = CovidNumberCaseNormalization.absolut;
        copy.timeWindow = CovidNumberCaseTimeWindow.all;
        copy.timeAgg = TimeGranularity.yearmonthdate;
        copy.ageGroupBinning = AgeGroupBinning.fiveyears;
        copy.scaleType = ScaleType.linear;

        return copy;
      }
    }

    if (chartType === 'stackedareaicu') {
      copy.dataSource = CovidNumberCaseDataSource.divi;
      copy.normalization = CovidNumberCaseNormalization.absolut;
      copy.timeWindow = null;
      copy.timeAgg = TimeGranularity.yearmonthdate;
      copy.ageGroupBinning = null;
      copy.scaleType = ScaleType.linear;

      return copy;
    }

    return null;
  }
}
