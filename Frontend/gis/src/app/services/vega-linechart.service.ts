import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VegaLinechartService {

  barChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "data": {"values": [
      {"x": "2020-01-01", "y": 50},
      {"x": "2020-01-02", "y": 60},
      {"x": "2020-01-03", "y": 20}
    ]},
    "layer": [
      {
        "mark": "rule",
        "encoding": {
          "y": {
            "datum": 50
          },
          "color": {"value": "red"}
        }
      },
     {
      "mark": {
        "type": "line"
      },
      "encoding": {
        "x": {"field": "x", "type": "temporal"},
        "y": {"field": "y", "type": "quantitative"}
      }
     },
     {
      "mark": {
        "type": "circle",
        "tooltip": true
      },
      "encoding": {
        "x": {"field": "x", "type": "temporal", "title": "Date", "axis": {"title": null}},
        "y": {"field": "y", "type": "quantitative", "title": "Cases per 100k in the last 7 days"}
      }
     }
    ]
  };

  constructor() {}


  compileChart(
    data: {x: string, y: number}[], 
    chartOptions: {
      xAxisTitle: string,
      yAxisTitle: string,
      width: number,
      height: number
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

    return spec;
  }
}
