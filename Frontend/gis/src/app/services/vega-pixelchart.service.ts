/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { CovidChartOptions, TimeGranularity } from '../cases-dod/covid-chart-options';
import { CovidNumberCaseTimeWindow, CovidNumberCaseType, CovidNumberCaseNormalization } from '../map/options/covid-number-case-options';
import { AggregatedRKICaseDevelopmentProperties, RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { getMoment, getStrDate } from '../util/date-util';
import { CaseUtilService } from './case-util.service';

export interface PixelChartDataPoint {
  x: string;
  y: string;
  val: number;
}

export interface PixelChartDataAndOptions {
  config: CovidChartOptions;
  data: PixelChartDataPoint[];
  chartOptions: {
    title: string;
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
    "height": 300,
    "width": "container",
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "data": {
      "name": "data",
      "values": []
    },
    "encoding": {
      "x": {
        "field": "x",
        "timeUnit": "yearweek",
        "type": "temporal",
        "title": "Woche",
        "axis": {"labelAngle": 45},
        "bandPosition": 0.5,
        "scale": {}
      },
      "y": {"field": "y", "type": "ordinal", "title": "Altersgruppe", "axis": {
        "minExtent": 50,
        "maxExtent": 50
      }}
    },
    "layer": [
      {
        "transform": [
          {"filter": "day(datum.x) >= 0"}
        ],
        "mark": {"type": "rect", "tooltip": true},
        "encoding": {
          "color": {
            "field": "val",
            "type": "quantitative",
            "legend": {"title": null, "orient": "bottom", "gradientLength": {"signal": "width - 600"}},
            "scale": {"type": "linear", "domain": [0, 579.7865331400711], "scheme": "inferno"}
          },
          "tooltip": [
            {"field": "x", "type": "temporal", "title": "Woche"},
            {"field": "y", "type": "ordinal", "title": "Altersgruppe"},
            {
              "field": "val",
              "title": "7-Tages-Inzidenz",
              "type": "quantitative",
              "format": ",.2f"
            }
          ]
        }
      },
      {
        "transform": [
          {"filter": "day(datum.x) == 6 || dayofyear(peek(data('data')).x) == dayofyear(datum.x)"}
        ],
        "mark": {"type": "text", "fontWeight": "lighter", "fontSize": 10},
        "encoding": {
          "text": {"field": "val", "type": "quantitative", "format": ",.0f"},
          "color": {
            "condition": {"test": "datum['val'] > 300", "value": "black"},
            "value": "lightgrey"
          },
          "tooltip": [
            {"field": "x", "type": "temporal", "title": "Woche"},
            {"field": "y", "type": "ordinal", "title": "Altersgruppe"},
            {
              "field": "val",
              "title": "7-Tages-Inzidenz",
              "type": "quantitative",
              "format": ",.2f"
            }
          ]
        }
      }
    ],
    "config": {
      "axis": {"grid": true, "tickBand": "extent"}
    }
  };

  constructor(
    private caseUtils: CaseUtilService
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, fullData: RKICaseDevelopmentProperties | AggregatedRKICaseDevelopmentProperties, autoConfig: boolean): PixelChartDataAndOptions {
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

    const yAxis = "Altersgruppe";

    const xAxis = "Woche";

    const zAxis = "7-Tage-Inzidenz";

    const xDomain = [
      getStrDate(getMoment(data[0].x).startOf('week')),
      getStrDate(getMoment(data[data.length-1].x).endOf('week'))
    ];

    return {
      config: o,
      data,
      chartOptions: {
        title: this.caseUtils.getChartTitle(o, (fullData as AggregatedRKICaseDevelopmentProperties).name),
        xAxisTitle: xAxis,
        yAxisTitle: yAxis,
        zAxisTitle: zAxis,
        width: 'container',
        height: numberOfAgeGroups * 20,
        scaleType: o.scaleType.toString(),
        timeAgg: o.timeAgg.toString(),
        domain: [0, maxDiff],
        xDomain
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

    for (const i of [0, 1]) {
      spec.layer[i].encoding.tooltip[0].title = chartOptions.xAxisTitle || '';
      spec.layer[i].encoding.tooltip[1].title = chartOptions.yAxisTitle || '';
      spec.layer[i].encoding.tooltip[2].title = chartOptions.zAxisTitle || '';
    }

    spec.layer[0].encoding.color.scale.type = chartOptions.scaleType || 'linear';

    spec.encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if (chartOptions.domain) {
      spec.layer[0].encoding.color.scale.domain = chartOptions.domain;
    }

    if (chartOptions.xDomain) {
      spec.encoding.x.scale.domain = chartOptions.xDomain;
    }

    const colorBreakpoint = chartOptions.domain[1] * 0.75;
    spec.layer[1].encoding.color.condition.text = "datum.val > " + colorBreakpoint;

    return spec;
  }
}
