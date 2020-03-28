import { Component, OnInit, Input } from '@angular/core';
import {DiviHospital, TimestampedValue, getLatest} from '../services/divi-hospitals.service';
import { ColormapService } from '../services/colormap.service';
import {domain} from "vega-lite/build/src/compile/selection/transforms/scales";

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
      ]
    },
    "layer": [
      {
        "mark": "line",
        "encoding": {
          "x": { "field": "Datum", "type": "ordinal" },
          "y": { "field": "Bettenauslastung (%)", "type": "quantitative", "axis": {"tickMinStep": 10, "tickCount": 10, "domain": [0,120]}, },
          "strokeDash": { "field": "Vorhersage", "type": "nominal" },
          "strokeWidth": {"value":1},
          "color": {"field": "Kategorie", "type": "nominal"}
        },
      },
      {
        "data": {"values": [{"ref": 100}, {"domain": [0,120]}]},
        "mark": "rule",
        "encoding": {
          "y": { "field":"ref"},
          "size": {"value": 1},
          "color": {"value": "black"},
          "strokeDash": {"signal": [8,4]}
        }
      }
    ]
  };

  specs = [];
  bedAccessors = ['icu_low_care', 'icu_high_care', 'icu_ecmo_care'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'icu_ecmo_care': 'ECMO'};

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
    const dataValues = [];

    for(const bedAccessor of this.bedAccessors) {
      const freeBeds = this.data[bedAccessor+"_frei"];
      const occupiedBeds = this.data[bedAccessor+"_belegt"];
      const prediction = this.data[bedAccessor+"_einschaetzung"][0];

      const entryLength = this.data[bedAccessor+"_frei"].length;
      const totalBeds = freeBeds[entryLength-1].value + occupiedBeds[entryLength-1].value;

      let i = 0;
      for(const free of freeBeds){
        let occupied = occupiedBeds[i];
        const rate = (occupied.value / (free.value + occupied.value) * 100)  || 0;
        dataValues.push({"Kategorie": this.bedAccessorsMapping[bedAccessor], "Datum": free.timestamp.split("T")[0],
          "Bettenauslastung (%)": rate, "Vorhersage": false});
        i++;
      }

      // FIXME should the timestamp for the prediction be the following day? and should the predicted value be added to the occupied beds value?
      const predictedRate = ((occupiedBeds[entryLength-1].value + prediction.value) / totalBeds * 100) || 0;
      dataValues.push({"Kategorie": this.bedAccessorsMapping[bedAccessor], "Datum": prediction.timestamp.split("T")[0]+"pred",
        "Bettenauslastung (%)": predictedRate, "Vorhersage": false});
      dataValues.push({"Kategorie": this.bedAccessorsMapping[bedAccessor], "Datum": prediction.timestamp.split("T")[0]+"pred",
        "Bettenauslastung (%)": predictedRate, "Vorhersage": true});
    }

      // hack deep clone spec
      const spec = JSON.parse(JSON.stringify(this.templateSpec));

      // inject data values
      spec.data.values = dataValues;

      this.specs.push(spec);
  }

  getCapacityStateColor(capacityState: string): string {
    return this.colormapService.getSingleHospitalColormap()(capacityState);
  }

  getLatest(entries: TimestampedValue[]): number {
    return getLatest(entries);
  }

}
