/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { CovidChartOptions, TimeGranularity } from '../cases-dod/covid-chart-options';
import { CovidNumberCaseTimeWindow, CovidNumberCaseType, CovidNumberCaseNormalization } from '../map/options/covid-number-case-options';
import { AggregatedRKICaseDevelopmentProperties, RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from './case-util.service';

export interface PixelChartDataPoint {
  x: string;
  y: string;
  val: number;
}

export interface PixelChartDataAndOptions {
  data: PixelChartDataPoint[];
  chartOptions: {
    titleRegions: string[];
    xAxisTitle: string;
    yAxisTitle: string;
    zAxisTitle: string;
    width: number | 'container';
    height: number;
    scaleType: string;
    timeAgg: string;
    domain?: [number, number];
    xDomain?: [string, string];
  };
}

@Injectable({
  providedIn: 'root'
})
export class VegaPixelchartService {

  _ageGroups: {[key: string]: [number, number][] | null} = {
    all: null,
    fiveyears: [
      [0, 4],
      [5, 9],
      [10, 14],
      [15, 19],
      [20, 24],
      [25, 29],
      [30, 34],
      [35, 39],
      [40, 44],
      [45, 49],
      [50, 54],
      [55, 59],
      [60, 64],
      [65, 69],
      [70, 74],
      [75, 79],
      [80, 80],
    ],
    rki: [
      [0, 4],
      [5, 14],
      [15, 34],
      [35, 59],
      [60, 79],
      [80, 80]
    ]
  };

  template = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "height": 100,
    "width": 60,
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "data": {
      "values": [{
          "cat": "Verfügbar",
          "num": 6,
          "color": "red"
        },
        {
          "cat": "Begrenzt",
          "num": 3,
          "color": "green"
        },
        {
          "cat": "Ausgelastet",
          "num": 1,
          "color": "blue"
        },
        {
          "cat": "Nicht verfügbar",
          "num": 0,
          "color": "yellow"
        }
      ]
    },
    "config": {
        "view": {
            "strokeWidth": 0,
            "step": 18
        },
        "axis": {
            "domain": false
        }
    },
  "mark": {
    "type": "rect",
    "tooltip": true
  },
  "encoding": {
      "x": {
          "field": "x",
          "timeUnit": "yearmonthdate",
          "type": "temporal",
          "title": "Day",
          "axis": {
              "labelAngle": 45,
          },
          "scale": {}
      },
      "y": {
          "field": "y",
          "type": "ordinal",
          "title": "Month",
          "axis": {
            "minExtent": 40,
            "maxExtent": 40
          }
      },
      "color": {
          "field": "val",
          "type": "quantitative",
          "legend": {
              "title": null,
              "orient": "bottom"
          },
          "scale": {
            "type": "linear"
          }
      },
      "tooltip": [
        {
          "field": "x", "type": "temporal", "title": "Day"
        },
        {
          "field": "y", "type": "ordinal", "title": "Agegroup"
        },
        {
          "field": "val", "title": "Cases per 100", "type": "quantitative", "format": ",.2f"
        }
      ]
    }
  };

  constructor(
    private caseUtils: CaseUtilService
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, fullData: RKICaseDevelopmentProperties | AggregatedRKICaseDevelopmentProperties, autoConfig: boolean) {
    let idxDiff = 1;
    switch (o.timeWindow) {
      case CovidNumberCaseTimeWindow.twentyFourhours:
        idxDiff = 1;
        o.timeAgg = TimeGranularity.yearmonthdate;
        break;

      case CovidNumberCaseTimeWindow.seventyTwoHours:
        idxDiff = 3;
        o.timeAgg = TimeGranularity.yearmonthdate;
        break;

      case CovidNumberCaseTimeWindow.sevenDays:
        idxDiff = 7;
        if (autoConfig) {
          o.timeAgg = TimeGranularity.yearweek;
        }
        break;

      default:
        idxDiff = 7;
    }

    // let ageGroupAccessor: ((s: RKICaseTimedStatus) => RKIAgeGroups);

    // switch (o.type) {
    //   case CovidNumberCaseType.cases:
    //     ageGroupAccessor = ((s: RKICaseTimedStatus) => s.cases_survstat_by_agegroup);
    //     break;

    //   case CovidNumberCaseType.deaths:
    //     ageGroupAccessor = ((s: RKICaseTimedStatus) => s.deaths_by_agegroup);
    //     break;
    // }

    const ageGroups: [number, number][] = this._ageGroups[o.ageGroupBinning];

    const data: PixelChartDataPoint[] = [];
    let maxDiff = 0;
    let numberOfAgeGroups = 0;

    const converted = [];

    for (let i = 0; i < idxDiff; i++) {
      let agNow;
      switch (o.type) {
        case CovidNumberCaseType.cases:
          agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
          converted[i] = agNow;

          o.timeAgg = TimeGranularity.yearweek;
          idxDiff = 7;

          break;

        case CovidNumberCaseType.deaths:
          agNow = fullData.developments[i].deaths_by_agegroup;
          break;
      }
      converted[i] = agNow;
    }

    for (let i = idxDiff; i < fullData.developments.length; i++) {
      let agNow;
      let agPop;
      switch (o.type) {
        case CovidNumberCaseType.cases:
          agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
          agPop = this.caseUtils.groupAgeStatus(fullData.developments[i].population_survstat_by_agegroup, ageGroups);
          break;

        case CovidNumberCaseType.deaths:
          agNow = fullData.developments[i].deaths_by_agegroup;
          agPop = fullData.developments[i].population_by_agegroup;
          break;
      }

      converted[i] = agNow;
      const agOld = converted[i - idxDiff];

      // const agNow: RKIAgeGroups = ageGroupAccessor(fullData.developments[i]);
      // const agOld: RKIAgeGroups = ageGroupAccessor(fullData.developments[i - idxDiff]);
      numberOfAgeGroups = Object.keys(agNow).length;

      for (const k of Object.keys(agNow)) {
        if (o.normalization === CovidNumberCaseNormalization.per100k && k === 'Aunknown') {
          continue;
        }
        let diff = (agNow[k] - agOld[k]);

        if (o.normalization === CovidNumberCaseNormalization.per100k) {
          diff = diff / agPop[k] * 100000;
        }

        if (diff > maxDiff) {
          maxDiff = diff;
        }

        data.push({
          x: fullData.developments[i].timestamp,
          y: k,
          val: diff
        });
      }
    }

    const yAxis = "";

    const xAxis = "";

    const zAxis = "";

    return {
      data,
      chartOptions: {
        titleRegions: (fullData as AggregatedRKICaseDevelopmentProperties).name,
        xAxisTitle: xAxis,
        yAxisTitle: yAxis,
        zAxisTitle: zAxis,
        width: 'container',
        height: numberOfAgeGroups * 9,
        scaleType: o.scaleType.toString(),
        timeAgg: o.timeAgg.toString(),
        domain: [0, maxDiff],
        xDomain: [data[0].x, data[data.length-1].x]
      }
    } as PixelChartDataAndOptions;
  }


  compileChart(
    data: PixelChartDataPoint[],
    chartOptions: {
      xAxisTitle: string;
      yAxisTitle: string;
      zAxisTitle: string;
      width: number | 'container';
      height: number;
      scaleType: string;
      timeAgg: string;
      domain?: [number, number];
      xDomain?: [string, string];
    }
    ): any {
    if (!data) {
      return null;
    }

    const spec = JSON.parse(JSON.stringify(this.template));

    // inject data values
    spec.data.values = data;

    // also overwrite the title
    spec.encoding.x.title = chartOptions.xAxisTitle || '';

    spec.encoding.y.title = chartOptions.yAxisTitle || '';

    spec.encoding.tooltip[0].title = chartOptions.xAxisTitle || '';
    spec.encoding.tooltip[1].title = chartOptions.yAxisTitle || '';
    spec.encoding.tooltip[2].title = chartOptions.zAxisTitle || '';

    spec.encoding.color.scale.type = chartOptions.scaleType || 'linear';

    spec.encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if (chartOptions.domain) {
      spec.encoding.color.scale.domain = chartOptions.domain;
    }

    if (chartOptions.xDomain) {
      spec.encoding.x.scale.domain = chartOptions.xDomain;
    }

    return spec;
  }
}
