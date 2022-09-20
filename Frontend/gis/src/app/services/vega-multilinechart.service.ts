/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseDataSource, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { EbrakeRepository } from '../repositories/ebrake.repository';
import { Region } from '../repositories/types/in/region';
import { getDateTime, getStrDate, isBetweenDaysInclusive } from '../util/date-util';
import { CaseUtilService } from './case-util.service';
import { MultiLineChartItem } from './chart.service';
import { ExportCsvService } from './export-csv.service';
import { TranslationService } from './translation.service';

export interface MultiLineChartDataPoint {
  /**
   * timestamp
   */
  x: string;
  y: number;
  /**
   * nominal, e.g., county name
   */
  region: string;
}

export interface MultiLineChartDataAndOptions {
  config: CovidChartOptions;
  data: MultiLineChartDataPoint[];
  chartOptions: {
    title: string;
    xAxisTitle: string;
    yAxisTitle: string;
    width: number | 'container';
    height: number;
    scaleType: string;
    timeAgg: string;
    xDomain?: [string, string];
    yDomain?: [number, number];
  };
}

@Injectable({
  providedIn: 'root'
})
export class VegaMultiLineChartService {

  template = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "height": 300,
    "width": "container",
    "background": "transparent",
    "data": {
      "values": []
    },
    "transform": [
      {
        "filter": {
          "field": "x",
          "timeUnit": "yearmonthdate",
          "range": []
        }
      },
      {"filter": {"field": "y", "range": []}}
    ],
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "encoding": {
      "x": {
        "field": "x",
        "type": "temporal",
        "scale": {"domain": []},
        "title": "",
        "timeUnit": "yearmonthdate"
      }
    },
    "layer": [
      {
        "encoding": {
          "color": {
            "field": "region",
            "type": "nominal",
            "legend": {
              "orient": "bottom",
              "title": null,
              "symbolType": "stroke",
              "columns": 10
            }
          },
          "y": {
            "field": "y",
            "type": "quantitative",
            "title": "",
            "scale": {},
            "axis": {
              "minExtent": 50,
              "maxExtent": 50,
              "orient": "left"
            }
          },
          "opacity": {
            "condition": {"param": "labelhover", "value": 1},
            "value": 0.1
          }
        },
        "layer": [
          {
            "mark": {"type": "line", "clip": true},
            "params": [
              {
                "name": "labelhover",
                "select": {"type": "point", "fields": ["region"]},
                "bind": {"legend": "mouseover"}
              }
            ]
          },
          {
            "transform": [{"filter": {"param": "hover", "empty": false}}],
            "mark": "point"
          }
        ]
      },
      {
        "transform": [{"pivot": "region", "value": "y", "groupby": ["x"]}],
        "mark": "rule",
        "encoding": {
          "opacity": {
            "condition": {"value": 0.3, "param": "hover", "empty": false},
            "value": 0
          },
          "tooltip": [
            {"field": "x", "type": "temporal", "title": "Date"}
          ]
        },
        "params": [
          {
            "name": "hover",
            "select": {
              "type": "point",
              "fields": ["x"],
              "nearest": true,
              "on": "mouseover",
              "clear": "mouseout"
            }
          }
        ]
      },
      {
        "mark": "point",
        "encoding": {
          "y": {
            "field": "y",
            "type": "quantitative",
            "title": "Bed occupancy (%)",
            "scale": {"type": "linear", "domain": [0, 100]},
            "axis": {"minExtent": 50, "maxExtent": 50, "orient": "right"}
          },
          "opacity": {
            "value": 0
          }
        }
      }
    ]
  };

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService,
    private exportCsv: ExportCsvService,
    private ebrakeRepo: EbrakeRepository,
    private translate: TranslationService
  ) {}

  dataComparisonCompileToDataAndOptions(o: CovidChartOptions, dataRequest: Region): Observable<MultiLineChartDataAndOptions> {
    const xExtent: [string, string] = [null, null];
    const yExtent: [number, number] = [0, 0];

    let manXExtent: [string, string] = null;
    if (o.temporalExtent.type === 'manual') {
      if (o.temporalExtent.manualLastDays > 0) {
        manXExtent = [getStrDate(getDateTime('now').minus({days: o.temporalExtent.manualLastDays})), getStrDate(getDateTime('now'))];
      } else {
        manXExtent = o.temporalExtent.manualExtent;
      }
    }

    const dataSources = [CovidNumberCaseDataSource.rki, CovidNumberCaseDataSource.risklayer];
    if (o.type === CovidNumberCaseType.cases && o.timeWindow === CovidNumberCaseTimeWindow.sevenDays && dataRequest.aggLevel === AggregationLevel.county) {
      dataSources.push(CovidNumberCaseDataSource.rki_incidences);
    }

    return from(dataSources)
    .pipe(
      mergeMap(d => {
        if (d !== CovidNumberCaseDataSource.rki_incidences) {
          return this.caseRepo.getCasesDevelopmentForAggLevelSingle(d, dataRequest.aggLevel, dataRequest.id, false, true)
          .pipe(
            mergeMap(d1 => this.caseUtil.extractXYByOptions(d1.properties, o)),
            map(d1 => d1.map(d2 => ({...d2, region: d2.region + '_' + d})))
          );
        } else {
          return this.ebrakeRepo.getEbrakeData()
          .pipe(
            map(d1 => d1.data
              .filter(d2 => d2.id === dataRequest.id)
              .map(d2 => ({x: d2.timestamp, y: d2['7_day_incidence'], y2: null, region: dataRequest.name + '_rki-bundesnotbremse'})))
          );
        }
      }),
      map(xyArr => {
        const data = xyArr
        .filter((_, i) => i > 7)
        .filter(d2 => {
          if (manXExtent !== null && !isBetweenDaysInclusive(d2.x, manXExtent[0], manXExtent[1])) {
            return false;
          }

          return true;
        })
        .map(xy => {
          if (xExtent[0] === null || getDateTime(xExtent[0]) > getDateTime(xy.x)) {
            xExtent[0] = xy.x;
          }

          if (xExtent[1] === null || getDateTime(xExtent[1]) < getDateTime(xy.x)) {
            xExtent[1] = xy.x;
          }

          if (yExtent[0] > xy.y) {
            yExtent[0] = xy.y;
          }

          if (yExtent[1] < xy.y) {
            yExtent[1] = xy.y;
          }

          return {
            x: xy.x,
            y: xy.y,
            region: xy.region
          } as MultiLineChartDataPoint;
        });

        return data;
      }),
      toArray(),
      map(arr => {
        const data: MultiLineChartDataPoint[] = [].concat(...arr);
        data.sort((a, b) => a.x.localeCompare(b.x));
        return {
          config: o,
          data,
          chartOptions: {
            title: this.caseUtil.getChartTitle(o),
            yAxisTitle: this.caseUtil.getChartTitle(o, null, true),
            width: 'container',
            height: 200,
            timeAgg: o.timeAgg,
            scaleType: o.scaleType,
            xDomain: xExtent,
            yDomain: yExtent
          }
        } as MultiLineChartDataAndOptions;
      })
    );
  }

  compileToDataAndOptions(o: CovidChartOptions, dataRequests: Region[]): Observable<MultiLineChartDataAndOptions> {
    const xExtent: [string, string] = [null, null];
    const yExtent: [number, number] = [0, 0];

    let manXExtent: [string, string] = null;
    if (o.temporalExtent.type === 'manual') {
      if (o.temporalExtent.manualLastDays > 0) {
        manXExtent = [getStrDate(getDateTime('now').minus({days: o.temporalExtent.manualLastDays})), getStrDate(getDateTime('now'))];
      } else {
        manXExtent = o.temporalExtent.manualExtent;
      }
    }

    let itTemplate: {request: Region; options: CovidChartOptions; suffix: string}[] = [];

    // default behavior
    if (o.type !== CovidNumberCaseType.bedOccupancy) {
      itTemplate = dataRequests.map(d => ({request: d, options: o, suffix: null}));
    } else {
      itTemplate = [];
      dataRequests.forEach(d => {
        const o1: CovidChartOptions = JSON.parse(JSON.stringify(o));
        const o2: CovidChartOptions = JSON.parse(JSON.stringify(o));
        // const o3: CovidChartOptions = JSON.parse(JSON.stringify(o));
        o1.type = CovidNumberCaseType.bedsOccupied;
        o2.type = CovidNumberCaseType.bedsTotal;
        // o3.type = CovidNumberCaseType.bedsFree;

        itTemplate.push({request: d, options: o1, suffix: this.translate.translate('Betten') + ' ' + this.translate.translate('belegt')});
        itTemplate.push({request: d, options: o2, suffix: this.translate.translate('Betten') + ' ' + this.translate.translate('gesamt')});
        // itTemplate.push({request: d, options: o3, suffix: 'beds_free'});
      });
    }

    return from(itTemplate)
    .pipe(
      mergeMap(d => this.caseRepo.getCasesDevelopmentForAggLevelSingle(o.dataSource, d.request.aggLevel, d.request.id, false, true)
        .pipe(
          mergeMap(d1 => this.caseUtil.extractXYByOptions(d1.properties, d.options, d.suffix)),
          map(xyArr => {
            const data = xyArr
            .filter((_, i) => i > 7)
            .filter(d2 => {
              if (manXExtent !== null && !isBetweenDaysInclusive(d2.x, manXExtent[0], manXExtent[1])) {
                return false;
              }

              return true;
            })
            .map(xy => {
              if (xExtent[0] === null || getDateTime(xExtent[0]) > getDateTime(xy.x)) {
                xExtent[0] = xy.x;
              }

              if (xExtent[1] === null || getDateTime(xExtent[1]) < getDateTime(xy.x)) {
                xExtent[1] = xy.x;
              }

              if (yExtent[0] > xy.y) {
                yExtent[0] = xy.y;
              }

              if (yExtent[1] < xy.y) {
                yExtent[1] = xy.y;
              }

              return {
                x: xy.x,
                y: xy.y,
                region: xy.region
              } as MultiLineChartDataPoint;
            });

            return data;
          })
        )),
        toArray(),
        map(arr => {
          const data: MultiLineChartDataPoint[] = [].concat(...arr);
          data.sort((a, b) => a.x.localeCompare(b.x));
          return {
            config: o,
            data,
            chartOptions: {
              title: this.caseUtil.getChartTitle(o),
              yAxisTitle: this.caseUtil.getChartTitle(o, null, true),
              width: 'container',
              height: 200,
              timeAgg: o.timeAgg,
              scaleType: o.scaleType,
              xDomain: xExtent,
              yDomain: yExtent
            }
          } as MultiLineChartDataAndOptions;
        })
      );

  }


  compileChart(dataAndOptions: MultiLineChartDataAndOptions): any {
    if (!dataAndOptions) {
      return null;
    }

    const data = dataAndOptions.data;
    const chartOptions = dataAndOptions.chartOptions;

    const spec = JSON.parse(JSON.stringify(this.template));

    // inject data values
    spec.data.values = data;

    // also overwrite the title
    spec.encoding.x.title = chartOptions.xAxisTitle || '';

    spec.layer[0].encoding.y.title = chartOptions.yAxisTitle || '';
    spec.layer[2].encoding.y.title = chartOptions.yAxisTitle || '';

    spec.layer[0].encoding.y.scale.type = chartOptions.scaleType || 'linear';
    spec.layer[2].encoding.y.scale.type = chartOptions.scaleType || 'linear';

    spec.encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if (chartOptions.yDomain) {
      spec.layer[0].encoding.y.scale.domain = chartOptions.yDomain;
      spec.layer[2].encoding.y.scale.domain = chartOptions.yDomain;
      spec.transform[1].filter.range = chartOptions.yDomain;
    }

    if (chartOptions.xDomain) {
      spec.encoding.x.scale.domain = chartOptions.xDomain;
      spec.transform[0].filter.range = chartOptions.xDomain;
    }


    const regions = new Set();
    data.forEach(d => regions.add(d.region));

    const regionsArr = [...regions].sort();

    regionsArr.forEach(d => spec.layer[1].encoding.tooltip.push({
      field: d,
      type: "quantitative",
      format: ".2f"
    }));

    return spec;
  }

  downloadCsv(item: MultiLineChartItem): void {
    const data = item._compiled.data;
    const fileName = item._compiled.chartOptions.title.toLowerCase().replace(/ /ig, '-');

    const m: Map<string, {[key: string]: string}> = new Map();

    const cols: Set<string> = new Set();

    data.forEach(d => {
      if (!m.has(d.x)) {
        m.set(d.x, {});
      }

      m.get(d.x)[d.region] = d.y + '';

      cols.add(d.region);
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
