/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { Region } from '../repositories/types/in/region';
import { getMoment } from '../util/date-util';
import { CaseUtilService } from './case-util.service';

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
      "values": [
      ]
    },
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "encoding": {"x": {
          "field": "x",
          "type": "temporal",
          "scale": {"domain": ["2020-01-15T00:00:00", "2021-03-26T00:00:00"]},
          "title": "",
          "timeUnit": "yearmonthdate"
        }},
    "layer": [
      {
        "encoding": {
          "color": {
            "field": "region",
            "type": "nominal",
            "legend": {"orient": "bottom", "title": null, "symbolType": "stroke", "columns": 10}
          },
          "y": {"field": "y", "type": "quantitative", "title": "", "scale": {}, "axis": {
            "minExtent": 50,
            "maxExtent": 50
          }},
          "opacity": {
            "condition": {"param": "labelhover", "value": 1},
            "value": 0.1
          }
        },
        "layer": [
          {
            "mark": "line",
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
      }
    ]
  };

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, dataRequests: Region[]): Observable<MultiLineChartDataAndOptions> {
    const xExtent: [string, string] = [null, null];
    const yExtent: [number, number] = [0, 0];
    return from(dataRequests)
    .pipe(
      mergeMap(d => this.caseRepo.getCasesDevelopmentForAggLevelSingle(o.dataSource, d.aggLevel, d.id)
        .pipe(
          mergeMap(d1 => this.caseUtil.extractXYByOptions(d1.properties, o)),
          map(xyArr => {
            const data = xyArr.filter((_, i) => i > 7).map(xy => {
              if (xExtent[0] === null || getMoment(xExtent[0]).isAfter(getMoment(xy.x))) {
                xExtent[0] = xy.x;
              }

              if (xExtent[1] === null || getMoment(xExtent[1]).isBefore(getMoment(xy.x))) {
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

    spec.layer[0].encoding.y.scale.type = chartOptions.scaleType || 'linear';

    spec.encoding.x.timeUnit = chartOptions.timeAgg || 'yearmonthdate';

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if (chartOptions.yDomain) {
      spec.layer[0].encoding.y.scale.domain = chartOptions.yDomain;
    }

    if (chartOptions.xDomain) {
      spec.encoding.x.scale.domain = chartOptions.xDomain;
    }


    const regions = new Set();
    data.forEach(d => regions.add(d.region));

    const regionsArr = [...regions].sort();

    regionsArr.forEach(d => spec.layer[1].encoding.tooltip.push({
      field: d,
      type: "quantitative",
      format: ".2f"
    }));

    // console.log(JSON.stringify(spec));

    return spec;
  }
}
