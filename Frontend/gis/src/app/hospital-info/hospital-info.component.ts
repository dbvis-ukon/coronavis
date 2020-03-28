import { Component, OnInit, Input } from '@angular/core';
import {DiviHospital, TimestampedValue, getLatest} from '../services/divi-hospitals.service';
import { ColormapService } from '../services/colormap.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  contactMsg: string;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: DiviHospital;

  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 180,
    "height": 100,
    "data": {
      "values": [
        { "Kategorie": "ICU - Low Care", "Datum": "2018-02-01", "Bettenauslastung (%)": 12, "Vorhersage": false },
        { "Kategorie": "ICU - Low Care", "Datum": "2018-02-02", "Bettenauslastung (%)": 28, "Vorhersage": false },
        { "Kategorie": "ICU - Low Care", "Datum": "2018-02-02", "Bettenauslastung (%)": 28, "Vorhersage": true },
        { "Kategorie": "ICU - Low Care", "Datum": "2018-02-03", "Bettenauslastung (%)": 91, "Vorhersage": true },
        { "Kategorie": "ICU - High Care", "Datum": "2018-02-01", "Bettenauslastung (%)": 81, "Vorhersage": false },
        { "Kategorie": "ICU - High Care", "Datum": "2018-02-02", "Bettenauslastung (%)": 81, "Vorhersage": false },
        { "Kategorie": "ICU - High Care", "Datum": "2018-02-02", "Bettenauslastung (%)": 81, "Vorhersage": true },
        { "Kategorie": "ICU - High Care", "Datum": "2018-02-03", "Bettenauslastung (%)": 19, "Vorhersage": true },
        { "Kategorie": "ECMO", "Datum": "2018-02-01", "Bettenauslastung (%)": 87, "Vorhersage": false },
        { "Kategorie": "ECMO", "Datum": "2018-02-02", "Bettenauslastung (%)": 87, "Vorhersage": false },
        { "Kategorie": "ECMO", "Datum": "2018-02-02", "Bettenauslastung (%)": 87, "Vorhersage": true },
        { "Kategorie": "ECMO", "Datum": "2018-02-03", "Bettenauslastung (%)": 87, "Vorhersage": true }
      ]
    }, 
    "layer": [
      {
        "mark": "line",
        "encoding": {
          "x": { 
            "field": "Datum", 
            "type": "ordinal"            
          },
          "y": { 
            "field": "Bettenauslastung (%)", 
            "type": "quantitative", 
            "axis": 
            {
              "tickMinStep": 10, 
              "tickCount": 10,
              "title": "Grade"
            }, 
            "scale": {
              "domain": [0, 120]
            }
          },
          "strokeDash": { "field": "Vorhersage", "type": "nominal" },
          "color": {"field": "Kategorie", "type": "nominal"}
        },
      },
      {
        "data": {"values": [{"ref": 100}]},
        "mark": "rule",
        "encoding": {
          "y": { "field":"ref"},
          "size": {"value": 1},
          "color": {"value": "red"},
          "strokeDash": {"signal": [8,4]}
        }
      }
    ]
  };

  specs = [];

  constructor(private colormapService: ColormapService) { }

  ngOnInit(): void {
    if(this.data.Webaddress.indexOf('http') > -1) {
      this.contact = 'http' + this.data.Webaddress.split('http')[1];
      this.url = true;

      this.contactMsg = this.data.Webaddress.replace(this.contact, '').replace('Website', '').trim();

      if(this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    } else {
      this.contact = this.data.Webaddress;
      this.url = false;

      this.contactMsg = this.data.Webaddress;
    }


    this.specs = [];

    // hack deep clone spec
    const spec = JSON.parse(JSON.stringify(this.templateSpec));

    this.specs.push(spec);
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }

  getLatest(entries: TimestampedValue[]): number {
    return getLatest(entries);
  }

}
