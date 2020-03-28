import { Component, OnInit, Input } from '@angular/core';
import { DiviHospital } from '../services/divi-hospitals.service';
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
  data: DiviHospital

  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 180,
    "height": 100,
    "data": {
      "values": [
        { "Kategorie": "ICU - Low Care", "Datum": "A", "Bettenauslastung (%)": 12, "Vorhersage": false },
        { "Kategorie": "ICU - Low Care", "Datum": "B", "Bettenauslastung (%)": 28, "Vorhersage": false },
        { "Kategorie": "ICU - Low Care", "Datum": "B", "Bettenauslastung (%)": 28, "Vorhersage": true },
        { "Kategorie": "ICU - Low Care", "Datum": "C", "Bettenauslastung (%)": 91, "Vorhersage": true },
        { "Kategorie": "ICU - High Care", "Datum": "A", "Bettenauslastung (%)": 81, "Vorhersage": false },
        { "Kategorie": "ICU - High Care", "Datum": "B", "Bettenauslastung (%)": 81, "Vorhersage": false },
        { "Kategorie": "ICU - High Care", "Datum": "B", "Bettenauslastung (%)": 81, "Vorhersage": true },
        {"Kategorie": "ICU - High Care", "Datum": "C", "Bettenauslastung (%)": 19, "Vorhersage": true },
        { "Kategorie": "ECMO", "Datum": "A", "Bettenauslastung (%)": 87, "Vorhersage": false },
        { "Kategorie": "ECMO", "Datum": "B", "Bettenauslastung (%)": 87, "Vorhersage": false },
        { "Kategorie": "ECMO", "Datum": "B", "Bettenauslastung (%)": 87, "Vorhersage": true },
        { "Kategorie": "ECMO", "Datum": "C", "Bettenauslastung (%)": 87, "Vorhersage": true }
      ]
    }
    ,
    "mark": "line"
    ,
    "encoding": {
      "x": { "field": "Datum", "type": "ordinal" },
      "y": { "field": "Bettenauslastung (%)", "type": "quantitative", "axis": {"tickMinStep": 10, "tickCount": 10}, },
      "strokeDash": { "field": "Vorhersage", "type": "nominal" },
      "color": {"field": "Kategorie", "type": "nominal"}
    }
  };

  specs = [];

  constructor(private colormapService: ColormapService) { }

  ngOnInit(): void {
    if(this.data.Kontakt.indexOf('http')>-1){
      this.contact = 'http' + this.data.Kontakt.split('http')[1];
      this.url = true;

      this.contactMsg = this.data.Kontakt.replace(this.contact, '').replace('Website', '').trim();

      if(this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    }else{
      this.contact = this.data.Kontakt;
      this.url = false;

      this.contactMsg = this.data.Kontakt;
    }


    this.specs = [];

    // hack deep clone spec
    const spec = JSON.parse(JSON.stringify(this.templateSpec));

    this.specs.push(spec);
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }

}
