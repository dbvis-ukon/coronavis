import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import * as d3 from 'd3';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';

@Component({
  selector: 'app-aggregated-glyph-tooltip',
  templateUrl: './aggregated-glyph-tooltip.component.html',
  styleUrls: ['./aggregated-glyph-tooltip.component.less'],
  animations: [
    trigger('tooltip', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(300, style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate(300, style({ opacity: 0 })),
      ]),
    ]),
  ],
})


export class AggregatedGlyphTooltipComponent implements OnInit {

  @Input()
  diviAggregatedHospital: AggregatedHospitalOut<QualitativeTimedStatus>;
  name: string;


  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "description": "A simple bar chart with rounded corners at the end of the bar.",
    "data": {
      "values": [
        {"cat": "Verfügbar", "num": 6, "color": "red"},
        {"cat": "Begrenzt", "num": 3, "color": "green"},
        {"cat": "Ausgelastet", "num": 1, "color": "blue"},
        {"cat": "Nicht verfügbar", "num": 0, "color": "yellow"}
      ]
    },
    "mark": {"type": "bar"},
    "encoding": {
      "x": {
        "field": "cat",
        "type": "nominal",
        "title": "ICU Low care",
        "sort": ["Verfügbar", "Begrenzt", "Ausgelastet", "Nicht verfügbar"]
        },
      "y": {
        "field": "num",
        "type": "quantitative",
        "title": "Anzahl Krankenhäuser",
        "scale": {"domain": [0, 10]},
        "axis": {"tickMinStep": 1, "tickCount": 5},
        },
      "color": {
        "field": "color", "type": "nominal", "scale": null
      }
    }, "layer": [{
    "mark": "bar"
  }, {
    "mark": {
      "type": "text",
      "align": "center",
      "dy": -5
    },
    "encoding": {
      "text": {"field": "num", "type": "quantitative"}
    }
  }]
  };

  specs = [];


  readonly backgroundColScale =
    d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(['white', '#333', 'white', 'white']);

  bedAccessors = ['icu_low_care', 'icu_high_care', 'ecmo_state'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'ecmo_state': 'ECMO'};

  latestDevelopment: QualitativeTimedStatus;

  constructor(private colormapService: QualitativeColormapService) {
  }

  ngOnInit() {
    const bedStati = QualitativeColormapService.bedStati;


    if(this.diviAggregatedHospital.developments) {
      this.latestDevelopment = this.diviAggregatedHospital.developments[this.diviAggregatedHospital.developments.length - 1];
    } else {
      return;
    }

    console.log('latest development', this.latestDevelopment);


    this.specs = [];
    let maxNum = 0;

    for(const bedAccessor of this.bedAccessors) {
      const dataValues = [];

      // fill the data object
      for(const bedStatus of bedStati) {
        const v = this.latestDevelopment[bedAccessor][bedStatus] || 0;

        dataValues.push(
          {
            cat: bedStatus,
            num: v,
            color: this.getCapacityStateColor(bedStatus)
          }
        );

        if(v > maxNum) {
          maxNum = v;
        }
      }


      // hack deep clone spec
      const spec = JSON.parse(JSON.stringify(this.templateSpec));

      // inject data values
      spec.data.values = dataValues;

      // also overwrite the title
      spec.encoding.x.title = this.bedAccessorsMapping[bedAccessor];

      this.specs.push(spec);
    }

    // set the max value
    this.specs.forEach(spec => {
      spec.encoding.y.scale.domain = [0, maxNum+1];
      spec.encoding.y.axis.tickCount = Math.min(maxNum+1, 5);
    });
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }
}
