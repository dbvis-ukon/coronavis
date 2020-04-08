import { Injectable } from '@angular/core';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { QualitativeColormapService } from './qualitative-colormap.service';

@Injectable({
  providedIn: 'root'
})
export class VegaBarchartService {

  barChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "height": 100,
    "width":60,
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
    "mark": {
      "type": "bar"
    },
    "encoding": {
      "x": {
        "field": "cat",
        "type": "nominal",
        "title": "ICU Low care",
        "sort": ["Verfügbar", "Begrenzt", "Ausgelastet", "Nicht verfügbar"],
        "axis": {
          "labels": false
        }
      },
      "y": {
        "field": "num",
        "type": "quantitative",
        "title": "Anzahl Krankenhäuser",
        "scale": {
        },
        "axis": {
          "tickMinStep": 1,
          "tickCount": 5
        },
      },
      "color": {
        "field": "color",
        "type": "nominal",
        "scale": null
      }
    },
    "layer": [{
      "mark": "bar"
    }, {
      "mark": {
        "type": "text",
        "align": "center",
        "dy": -5
      },
      "encoding": {
        "text": {
          "field": "num",
          "type": "quantitative"
        }
      }
    }]
  };

  constructor(
    private colormapService: QualitativeColormapService
  ) {}


  compileChart(
    data: QualitativeTimedStatus, 
    acc: ((d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts) | string, 
    bedStati: string[] = null,
    chartOptions: {
      xAxisTitle: string,
      yAxisTitle: string,
      width: number
    }
    ): any {
    if(!data) {
      return null;
    }

    if (!bedStati) {
      bedStati = QualitativeColormapService.bedStati;
    }

    const dataValues = [];

    // fill the data object
    for (const bedStatus of bedStati) {
      let v = 0;
      if(typeof acc === 'string') {
        v = data[acc][bedStatus] || 0;
      } else {
        v = acc(data)[bedStatus] || 0;
      }

      dataValues.push({
        cat: bedStatus,
        num: v,
        color: this.colormapService.getSingleHospitalColormap()(bedStatus)
      });

    }

    const spec = JSON.parse(JSON.stringify(this.barChartTemplateSpec));

    // inject data values
    spec.data.values = dataValues;

    // also overwrite the title
    spec.encoding.x.title = chartOptions.xAxisTitle || '';

    spec.encoding.y.title = chartOptions.yAxisTitle || '';

    spec.width = chartOptions.width;

    return spec;
  }
}
