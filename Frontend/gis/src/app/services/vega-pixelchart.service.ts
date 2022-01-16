/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AgeGroupBinning, CovidChartOptions, TimeGranularity } from '../cases-dod/covid-chart-options';
import { CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { AggregatedRKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { Region } from '../repositories/types/in/region';
import { getMoment, getStrDate } from '../util/date-util';
import { CaseUtilService } from './case-util.service';
import { PixelChartItem } from './chart.service';
import { ConfigService } from './config.service';
import { ExportCsvService } from './export-csv.service';

export interface PixelChartDataPoint {
  yearisoweek: string;
  x: string;
  y: string;
  /**
   * used in pixel chart
   */
  val: number;
  /**
   * used in tooltip
   */
  incidence: number;
  /**
   * used in tooltip
   */
  absval: number;
  /**
   * used in tooltip
   */
  population: number;
}

export interface PixelChartOptions {
  title: string;
  xAxisTitle: string;
  yAxisTitle: string;
  incidenceTitle: string;
  absValueTitle: string;
  populationTitle: string;
  width: number | 'container';
  height: number;
  scaleType: string;
  timeAgg: string;
  domain?: [number, number];
  xDomain?: [string, string];
}

export interface PixelChartDataAndOptions {
  config: CovidChartOptions;
  data: PixelChartDataPoint[];
  chartOptions: PixelChartOptions;
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
    "transform": [
      {"filter": {"field": "x", "timeUnit": "yearmonthdate", "range": []}}
    ],
    "encoding": {
      "x": {
        "field": "yearisoweek",
        "type": "ordinal",
        "title": "",
        "axis": {"labelAngle": 45, "grid": false},
        "bandPosition": 0.5
      },
      "y": {
        "field": "y",
        "type": "ordinal",
        "title": "Altersgruppe",
        "axis": {"orient": "left", "minExtent": 50, "maxExtent": 50}
      }
    },
    "layer": [
      {
        "transform": [{"filter": "day(datum.x) >= 0"}],
        "mark": {"type": "rect", "tooltip": true},
        "encoding": {
          "y": {
            "field": "y",
            "type": "ordinal",
            "title": "Altersgruppe",
            "axis": {"minExtent": 50, "maxExtent": 50, "orient": "right"}
          },
          "color": {
            "field": "val",
            "type": "quantitative",
            "legend": {
              "title": null,
              "orient": "bottom",
              "gradientLength": {"signal": "width * 0.35"}
            },
            "scale": {
              "type": "linear",
              "domain": [0, 451.83815978640376],
              "scheme": "inferno"
            }
          },
          "tooltip": [
            {"field": "x", "type": "temporal", "title": "Woche"},
            {"field": "y", "type": "ordinal", "title": "Altersgruppe"},
            {
              "field": "incidence",
              "title": "7-Tage-Inzidenz",
              "type": "quantitative",
              "format": ",.0f"
            },
            {
              "field": "absval",
              "title": "Anzahl positiv getestet",
              "type": "quantitative",
              "format": ",.0f"
            },
            {
              "field": "population",
              "title": "Population",
              "type": "quantitative",
              "format": ",.0f"
            }
          ]
        }
      },
      {
        "transform": [
          {
            "filter": "day(datum.x) == 0 || (dayofyear(peek(data('data')).x) == dayofyear(datum.x) && year(peek(data('data')).x) == year(datum.x))"
          }
        ],
        "mark": {
          "type": "text",
          "fontWeight": "lighter",
          "fontSize": {"expr": "datum.val < 1000 ? 9 : 8"}
        },
        "encoding": {
          "text": {"field": "val", "type": "quantitative", "format": ".0f"},
          "color": {
            "condition": [
              {"value": "black", "test": "datum.val > 271"},
              {"value": "grey", "test": "datum.val == 0"}
            ],
            "value": "lightgrey"
          },
          "tooltip": [
            {"field": "x", "type": "temporal", "title": "Woche"},
            {"field": "y", "type": "ordinal", "title": "Altersgruppe"},
            {
              "field": "incidence",
              "title": "7-Tage-Inzidenz",
              "type": "quantitative",
              "format": ",.0f"
            },
            {
              "field": "absval",
              "title": "Anzahl positiv getestet",
              "type": "quantitative",
              "format": ",.0f"
            },
            {
              "field": "population",
              "title": "Population",
              "type": "quantitative",
              "format": ",.0f"
            }
          ]
        }
      }
    ],
    "config": {"axis": {"grid": false, "tickBand": "extent"}}
  };

  constructor(
    private caseUtils: CaseUtilService,
    private caseRepo: CaseDevelopmentRepository,
    private exportCsv: ExportCsvService,
    private configService: ConfigService
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, dataRequest: Region[], autoConfig: boolean): Observable<PixelChartDataAndOptions> {
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

    let ageGroups: [number, number][];
    if (o.ageGroupBinning !== AgeGroupBinning.manual) {
      ageGroups = this._ageGroups[o.ageGroupBinning];
    } else {
      ageGroups = this.configService.parseCustomAgeGroups(o.ageGroupBinningCustom);
    }

    const data: PixelChartDataPoint[] = [];
    let maxDiff = 0;
    let numberOfAgeGroups = 0;

    let manXExtent: [string, string] = null;
    if (o.temporalExtent.type === 'manual') {
      if (o.temporalExtent.manualLastDays > 0) {
        manXExtent = [getStrDate(getMoment('now')
          .subtract(o.temporalExtent.manualLastDays, 'days')
          .startOf('week')
          ),
          getStrDate(getMoment('now').endOf('week'))];
      } else {
        manXExtent = [getStrDate(getMoment(o.temporalExtent.manualExtent[0]).startOf('week')), getStrDate(getMoment(o.temporalExtent.manualExtent[1]).endOf('week'))];
      }
    }

    return this.caseRepo.getCasesDevelopmentAggregated(
      CovidNumberCaseDataSource.rki,
      dataRequest,
      true,
      true
    ).pipe(
      map(d => d.properties),
      map(fullData => {
        const converted = [];

        for (let i = 0; i < idxDiff; i++) {
          let agNow;
          switch (o.type) {
            case CovidNumberCaseType.cases:
              if (o.timeAgg === TimeGranularity.yearmonthdate && o.ageGroupBinning === AgeGroupBinning.rki) {
                agNow = this.caseUtils.addTotalRow(fullData.developments[i].cases_by_agegroup);
              } else {
                agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
                o.timeAgg = TimeGranularity.yearweek;
              }

              converted[i] = agNow;

              // o.timeAgg = TimeGranularity.yearweek;
              idxDiff = 7;

              break;

            case CovidNumberCaseType.deaths:
              agNow = this.caseUtils.addTotalRow(fullData.developments[i].deaths_by_agegroup);
              break;
          }
          converted[i] = agNow;
        }

        for (let i = idxDiff; i < fullData.developments.length; i++) {

          if (manXExtent !== null && !getMoment(fullData.developments[i].timestamp).isBetween(getMoment(manXExtent[0]), getMoment(manXExtent[1]), 'day', '[]')) {
            continue;
          }

          let agNow;
          let agPop;
          switch (o.type) {
            case CovidNumberCaseType.cases:
              if (o.timeAgg === TimeGranularity.yearmonthdate && o.ageGroupBinning === AgeGroupBinning.rki) {
                agNow = this.caseUtils.addTotalRow(fullData.developments[i].cases_by_agegroup);
                agPop = this.caseUtils.addTotalRow(fullData.developments[i].population_by_agegroup);
              } else {
                agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
                agPop = this.caseUtils.groupAgeStatus(fullData.developments[i].population_survstat_by_agegroup, ageGroups);
              }
              break;

            case CovidNumberCaseType.deaths:
              agNow = this.caseUtils.addTotalRow(fullData.developments[i].deaths_by_agegroup);
              agPop = this.caseUtils.addTotalRow(fullData.developments[i].population_by_agegroup);
              break;
          }

          converted[i] = agNow;
          const agOld = converted[i - idxDiff];
          if (!agOld) {
            continue;
          }

          // const agNow: RKIAgeGroups = ageGroupAccessor(fullData.developments[i]);
          // const agOld: RKIAgeGroups = ageGroupAccessor(fullData.developments[i - idxDiff]);
          numberOfAgeGroups = Object.keys(agNow).length;

          for (const k of Object.keys(agNow)) {
            if (o.normalization === CovidNumberCaseNormalization.per100k && k === 'Aunknown') {
              continue;
            }
            let diff = (agNow[k] - agOld[k]);

            const incidence = Math.round(diff / agPop[k] * 100000);

            if (o.normalization === CovidNumberCaseNormalization.per100k) {
              diff = diff / agPop[k] * 100000;
            }

            if (diff > maxDiff) {
              maxDiff = diff;
            }

            const ts = getMoment(fullData.developments[i].timestamp);

            data.push({
              yearisoweek: ts.format('GGGG [W]WW'),
              x: fullData.developments[i].timestamp,
              y: k,
              val: diff,
              incidence,
              absval: (agNow[k] - agOld[k]),
              population: agPop[k]
            });
          }
        }

        const yAxis = "Altersgruppe";

        const xAxis = "Woche";

        const xDomain: [string, string] = [
          getStrDate(getMoment(data[0].x).startOf('week')),
          getStrDate(getMoment(data[data.length - 1].x).endOf('week'))
        ];

        const ret: PixelChartDataAndOptions = {
          config: o,
          data,
          chartOptions: {
            title: this.caseUtils.getChartTitle(o, (fullData as AggregatedRKICaseDevelopmentProperties).name),
            xAxisTitle: xAxis,
            yAxisTitle: yAxis,
            incidenceTitle: '7-Tage-Inzidenz',
            absValueTitle: 'Anzahl positiv getestet',
            populationTitle: 'Population',
            width: 'container',
            height: numberOfAgeGroups * 20,
            scaleType: o.scaleType.toString(),
            timeAgg: o.timeAgg.toString(),
            domain: [0, maxDiff],
            xDomain
          }
        };

        return ret;
      })
    );
  }


  compileChart(
    data: PixelChartDataPoint[],
    chartOptions: PixelChartOptions
    ): any {
    if (!data) {
      return null;
    }

    const spec = JSON.parse(JSON.stringify(this.template));

    // inject data values
    spec.data.values = data;

    // also overwrite the title
    // spec.encoding.x.title = chartOptions.xAxisTitle || '';
    spec.encoding.x.title = '';

    spec.encoding.y.title = chartOptions.yAxisTitle || '';
    spec.layer[0].encoding.y.title = chartOptions.yAxisTitle || '';

    for (const i of [0, 1]) {
      spec.layer[i].encoding.tooltip[0].title = chartOptions.xAxisTitle || '';
      spec.layer[i].encoding.tooltip[1].title = chartOptions.yAxisTitle || '';
      spec.layer[i].encoding.tooltip[2].title = chartOptions.incidenceTitle || '';
      spec.layer[i].encoding.tooltip[3].title = chartOptions.absValueTitle || '';
      spec.layer[i].encoding.tooltip[4].title = chartOptions.populationTitle || '';
    }

    spec.layer[0].encoding.color.scale.type = chartOptions.scaleType || 'linear';

    if (chartOptions.timeAgg === 'yearweek') {
      spec.encoding.x.field = 'yearisoweek';
      spec.encoding.x.type = 'ordinal';
    } else {
      spec.encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';
      spec.encoding.x.field = 'x';
      spec.encoding.x.type = 'temporal';
    }

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if (chartOptions.domain) {
      spec.layer[0].encoding.color.scale.domain = chartOptions.domain;
    }

    if (chartOptions.xDomain) {
      spec.transform[0].filter.range = chartOptions.xDomain;
    }

    const colorBreakpoint = chartOptions.domain[1] * 0.6;
    spec.layer[1].encoding.color.condition[0].test = "datum.val > " + Math.round(colorBreakpoint);

    return spec;
  }

  downloadCsv(item: PixelChartItem): void {
    const data = item._compiled.data;

    const fileName = item._compiled.chartOptions.title.toLowerCase().replace(/ /ig, '-');

    const m: Map<string, {[key: string]: string}> = new Map();

    const cols: Set<string> = new Set();

    data.forEach(d => {
      if (!m.has(d.x)) {
        m.set(d.x, {});
      }

      m.get(d.x)[d.y] = d.val + '';

      cols.add(d.y);
    });

    const dateArr: string[] = [];

    for (const date of m.keys()) {
      dateArr.push(date);
    }

    dateArr.sort();


    const records = dateArr.map(d => {

      const record: Record<string, string> = {
        'Date': d,
        ...m.get(d)
      };

      return record;
    });

    const sortedCols = [...cols].sort();

    const colsArr: string[] = ['Date', ...sortedCols];

    this.exportCsv.exportToCsv(records, fileName, colsArr);
  }
}
