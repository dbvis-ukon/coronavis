/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VegaPixelchartService {

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
          }
      },
      "y": {
          "field": "y",
          "type": "ordinal",
          "title": "Month"
      },
      "color": {
          "field": "val",
          "type": "quantitative",
          "legend": {
              "title": null
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
  ) {}


  compileChart(
    data: {x: string; y: string; val: number}[],
    chartOptions: {
      xAxisTitle: string;
      yAxisTitle: string;
      zAxisTitle: string;
      width: number | 'container';
      height: number;
      scaleType: string;
      timeAgg: string;
      domain?: [number, number];
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

    return spec;
  }
}
