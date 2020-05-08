import { Injectable } from '@angular/core';
import { getMoment } from '../util/date-util';

@Injectable({
  providedIn: 'root'
})
export class VegaLinechartService {

  barChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "data": {
      "values": [
        {"x": "2020-03-30T00:00:00", "y": 28.13285741916196},
        {"x": "2020-03-31T00:00:00", "y": 38.682678951347796},
        {"x": "2020-04-01T00:00:00", "y": 33.9938693814874},
        {"x": "2020-04-02T00:00:00", "y": 31.063363400324697},
        {"x": "2020-04-03T00:00:00", "y": 39.8548813438128},
        {"x": "2020-04-04T00:00:00", "y": 36.924375362650196},
        {"x": "2020-04-05T00:00:00", "y": 59.1962208194867},
        {"x": "2020-04-06T00:00:00", "y": 63.885030389347094},
        {"x": "2020-04-07T00:00:00", "y": 49.232500483533705},
        {"x": "2020-04-08T00:00:00", "y": 45.12979210990591},
        {"x": "2020-04-09T00:00:00", "y": 49.2325004835333},
        {"x": "2020-04-10T00:00:00", "y": 48.646399287300596},
        {"x": "2020-04-11T00:00:00", "y": 53.92131005339381},
        {"x": "2020-04-12T00:00:00", "y": 36.33827416641729},
        {"x": "2020-04-13T00:00:00", "y": 35.16607177395289},
        {"x": "2020-04-14T00:00:00", "y": 33.99386938148699},
        {"x": "2020-04-15T00:00:00", "y": 33.99386938148699},
        {"x": "2020-04-16T00:00:00", "y": 28.132857419161994},
        {"x": "2020-04-17T00:00:00", "y": 18.75523827944201},
        {"x": "2020-04-18T00:00:00", "y": 21.685744260603997},
        {"x": "2020-04-19T00:00:00", "y": 29.305059811627018},
        {"x": "2020-04-20T00:00:00", "y": 28.718958615394},
        {"x": "2020-04-21T00:00:00", "y": 26.960655026696998},
        {"x": "2020-04-22T00:00:00", "y": 26.960655026696998},
        {"x": "2020-04-23T00:00:00", "y": 29.305059811627018},
        {"x": "2020-04-24T00:00:00", "y": 29.891161007858983},
        {"x": "2020-04-25T00:00:00", "y": 19.927440671905998},
        {"x": "2020-04-26T00:00:00", "y": 13.480327513348982},
        {"x": "2020-04-27T00:00:00", "y": 11.722023924651012},
        {"x": "2020-04-28T00:00:00", "y": 12.308125120883005},
        {"x": "2020-04-29T00:00:00", "y": 12.308125120883005},
        {"x": "2020-04-30T00:00:00", "y": 10.549821532186002},
        {"x": "2020-05-01T00:00:00", "y": 9.37761913972102},
        {"x": "2020-05-02T00:00:00", "y": 9.377619139720991},
        {"x": "2020-05-03T00:00:00", "y": 4.102708373628019},
        {"x": "2020-05-04T00:00:00", "y": 2.9305059811630088},
        {"x": "2020-05-05T00:00:00", "y": 2.9305059811630088},
        {"x": "2020-05-06T00:00:00", "y": 2.9305059811630088},
        {"x": "2020-05-07T00:00:00", "y": 1.75830358869762}
      ]
    },
    "layer": [
      {
        "mark": "rule",
        "encoding": {"y": {"datum": 50}, "color": {"value": "firebrick"}}
      },
      {
        "mark": {"type": "line"},
        "encoding": {
          "x": {"field": "x", "type": "temporal", "title": ""},
          "y": {"field": "y", "type": "quantitative", "title": "Cases per 100"}
        }
      },
      {
        "mark": {"type": "circle", "tooltip": true},
        "encoding": {
          "x": {
            "field": "x",
            "type": "temporal",
            "title": "Date",
            "axis": {"title": null}
          },
          "y": {"field": "y", "type": "quantitative", "title": "Cases per 100"},
          "color": {
            "condition": {
              "test": "datum.y < 50"
            },
            "value": "firebrick"
          }
        }
      },

    ],
    "width": 400,
    "height": 100
  };

  constructor() {}


  compileChart(
    data: {x: string, y: number}[], 
    chartOptions: {
      xAxisTitle: string,
      yAxisTitle: string,
      width: number,
      height: number,
      regression?: {
        from: string;
        to: string;
      }
    }
    ): any {
    if(!data) {
      return null;
    }

    const spec = JSON.parse(JSON.stringify(this.barChartTemplateSpec));

    // inject data values
    spec.data.values = data;

    // also overwrite the title
    spec.layer[1].encoding.x.title = chartOptions.xAxisTitle || '';

    spec.layer[1].encoding.y.title = chartOptions.yAxisTitle || '';
    spec.layer[2].encoding.y.title = chartOptions.yAxisTitle || '';

    spec.width = chartOptions.width;
    spec.height = chartOptions.height;

    if(chartOptions.regression) {
      const from = getMoment(chartOptions.regression.from).valueOf();
      const to = getMoment(chartOptions.regression.to).valueOf();
      spec.layer.push({
        "mark": {"type": "line", "color": "black"},
        "transform": [
          {"filter": {"field": "x", "gte": ''+from}},
          {"filter": {"field": "x", "lte": ''+to}},
          {"regression": "y", "on": "x", "extent": [from, to]}
          // {"regression": "y", "on": "x"}
        ],
        "encoding": {
          "x": {"field": "x", "type": "temporal"},
          "y": {"field": "y", "type": "quantitative"}
        }
      });

      // spec.layer.push(
      //   {
      //     "transform": [
      //       {"filter": {"field": "x", "gte": ''+from}},
      //       {"filter": {"field": "x", "lte": ''+to}},
      //       {
      //         "regression": "y",
      //         "on": "x",
      //         "params": true,
      //         "extent": [from, to]
      //       },
      //       {"calculate": "'R²: '+format(datum.rSquared, '.2f')", "as": "R2"}
      //     ],
      //     "mark": {
      //       "type": "text",
      //       "color": "firebrick",
      //       "x": "width",
      //       "align": "right",
      //       "y": -5
      //     },
      //     "encoding": {"text": {"type": "nominal", "field": "R2"}}
      //   });
    }

    return spec;
  }
}
