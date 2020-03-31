import { Component, OnInit, Input } from '@angular/core';
import {DiviAggregatedHospital, DiviHospital} from '../services/divi-hospitals.service';
import { ColormapService } from '../services/colormap.service';
import * as d3 from "d3";

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
  data: DiviHospital | DiviAggregatedHospital;

  templateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 300, "height": 50,
    "data": {"values":[
      ]},
    "mark": {"type": "area", "interpolate": "step"},
    "encoding": {
      "x": {
        "field": "Datum", "type": "temporal",
        "axis": {"domain": false, "format": "%Y-%m-%d", "tickSize": 0}
      },
      "y": {
        "field": "num", "type": "quantitative",
        "axis": null,
        "stack": "center"
      },
     "color": {"field":"Kategorie", "scale":{"domain": [], "range": []}}
    }
  };

  specs = [];

  bedAccessors = ['icu_low_care', 'icu_high_care', 'ecmo_state'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'ecmo_state': 'ECMO'};

  isSingleHospital: boolean = false;
  singleHospital: DiviHospital;

  latestDevelopment: QualitativeTimedStatus;

  constructor(private colormapService: QuantitativeColormapService) {}

  ngOnInit(): void {
    if((this.data as DiviHospital).Adress){
      this.isSingleHospital = true;
      this.singleHospital = this.data as DiviHospital;

    if(this.singleHospital.Kontakt.indexOf('http')>-1){
      this.contact = 'http' + this.singleHospital.Kontakt.split('http')[1];
      this.url = true;

      this.contactMsg = this.singleHospital.Kontakt.replace(this.contact, '').replace('Website', '').trim();

      if (this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    }else{
      this.contact = this.singleHospital.Kontakt;
      this.url = false;

      this.contactMsg = this.singleHospital.Kontakt;
    }
    }


    var data = [{"development" : {"timestamp" : "2020-03-27T14:49:00", "icu_low_care" : {"Begrenzt" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-28T09:42:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-29T10:38:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-30T09:18:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Begrenzt" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-31T09:04:00", "icu_low_care" : {"Begrenzt" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}];
    const bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet']; //FIXME add "Nicht verfügbar" if should be displayed

    var colors = [];
    for (const bedStatus of bedStati) {
     colors.push(this.getCapacityStateColor(bedStatus));
    }

    console.log(this.data);
    this.specs = [];
    let maxNum = 0;

    for(const bedAccessor of this.bedAccessors) {
      let summedbedcounts = 0;
      const dataValues = [];

      for( const d of data) {
        const development = d.development;

        // fill the data object
        for (const bedStatus of bedStati) {
          const v = development[bedAccessor][bedStatus] || 0;
          if(development[bedAccessor][bedStatus]) {
            summedbedcounts++;
          }

          dataValues.push(
            {
              Kategorie: bedStatus,
              num: v,
              color: this.getCapacityStateColor(bedStatus),
              Datum: development.timestamp
            }
          );
          if (v > maxNum) {
            maxNum = v;
          }
        }
      }


      // hack deep clone spec
      const spec = JSON.parse(JSON.stringify(this.templateSpec));

      // inject data values
      spec.data.values = dataValues;

      // also overwrite the title
      spec.encoding.x.title = this.bedAccessorsMapping[bedAccessor];

      if(summedbedcounts > 0) {
        this.specs.push({
          title: this.bedAccessorsMapping[bedAccessor],
          chart: spec
        });

      }
    }

    // set the max value
    this.specs.forEach(spec => {
      spec.chart.encoding.color.scale.domain = bedStati;
      spec.chart.encoding.color.scale.range = colors;
      //spec.encoding.color.range = Math.min(maxNum+1, 5);
    });
  }

  getTrendIcon(entries: TimestampedValue[]): string {
    const latest = getLatest(entries);
    return latest >= 0 ? (latest == 0 ? 'trending_flat' : 'trending_up') : 'trending_down';
  }

}
