/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { Region } from '../repositories/types/in/region';
import { getMoment } from '../util/date-util';

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
  data: MultiLineChartDataPoint[];
  chartOptions: {
    dataSource: 'rki' | 'risklayer';
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
            "minExtent": 40,
            "maxExtent": 40
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
    private caseRepo: CaseDevelopmentRepository
  ) {}


  compileToDataAndOptions(o: CovidChartOptions, dataRequests: Region[]): Observable<MultiLineChartDataAndOptions> {
    const xExtent: [string, string] = [null, null];
    const yExtent: [number, number] = [0, 0];
    return from(dataRequests)
    .pipe(
      mergeMap(d => this.caseRepo.getCasesDevelopmentForAggLevelSingle(o.dataSource, d.aggLevel, d.id)
        .pipe(
          map(d1 => {
            const data = d1.properties.developments.map(d2 => {
              if (xExtent[0] === null || getMoment(xExtent[0]).isAfter(getMoment(d2.timestamp))) {
                xExtent[0] = d2.timestamp;
              }

              if (xExtent[1] === null || getMoment(xExtent[1]).isBefore(getMoment(d2.timestamp))) {
                xExtent[1] = d2.timestamp;
              }

              if (yExtent[0] > d2.cases7_per_100k) {
                yExtent[0] = d2.cases7_per_100k;
              }

              if (yExtent[1] < d2.cases7_per_100k) {
                yExtent[1] = d2.cases7_per_100k;
              }

              return {
                x: d2.timestamp,
                y: d2.cases7_per_100k,
                region: d1.properties.name
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
            data,
            chartOptions: {
              dataSource: o.dataSource,
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
