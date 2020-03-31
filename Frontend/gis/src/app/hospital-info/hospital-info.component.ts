import { Component, OnInit, Input } from '@angular/core';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import {BedType} from "../map/options/bed-type.enum";
import * as moment from 'moment';
import { QuantitativeColormapService } from '../services/quantitative-colormap.service';

@Component({
  selector: 'app-hospital-info',
  templateUrl: './hospital-info.component.html',
  styleUrls: ['./hospital-info.component.less']
})
export class HospitalInfoComponent implements OnInit {

  contact: string;
  url: boolean;

  contactMsg: string;

  public eBedType = BedType;

  @Input()
  mode: 'dialog' | 'tooltip';
  @Input()
  data: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>;

  glyphLegendColors = QualitativeColormapService.bedStati.filter(f => f !== 'Keine Information');

  temporalChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 320, "height": 50,
    "data": {"values":[
      ]},
    "mark": {"type": "area", "interpolate": "step-before"},
    "encoding": {
      "x": {
        "field": "Datum", "type": "temporal",
        "axis": {"domain": false, "format": "%d.%m", "tickSize": 3, "tickCount": 7}
      },
      "y": {
        "field": "num", "type": "quantitative",
        "axis": {"title": "Anzahl KH", "tickMinStep": 1}
      },
     "color": {"type": "nominal", "field":"Kategorie", "scale":{"domain": [], "range": []}, "legend": false}
    }
  };

  barChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "height": 100,
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
        "sort": ["Verfügbar", "Begrenzt", "Ausgelastet", "Nicht verfügbar"],
        "axis": {
          "labels": false
        }
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

  barChartSpecs = [];

  bedAccessors = ['icu_low_care', 'icu_high_care', 'ecmo_state'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'ecmo_state': 'ECMO'};

  isSingleHospital: boolean = false;
  singleHospital: SingleHospitalOut<QualitativeTimedStatus>;

  latestDevelopment: QualitativeTimedStatus;

  lastUpdate: Date;

  firstTimestamp: Date;

  warnOfOutdatedData: boolean;

  totalNumberOfHospitals: number = 0;

  constructor(private colormapService: QualitativeColormapService) {}

  ngOnInit(): void {

    if((this.data as SingleHospitalOut<QualitativeTimedStatus>).address){
      this.isSingleHospital = true;
      this.singleHospital = this.data as SingleHospitalOut<QualitativeTimedStatus>;
    }

    if(this.data.developments) {
      this.latestDevelopment = this.data.developments[this.data.developments.length - 1];

      
      this.lastUpdate = this.isSingleHospital ? this.latestDevelopment.timestamp : this.latestDevelopment.last_update;

      this.firstTimestamp = this.data.developments[0].timestamp;

      this.warnOfOutdatedData = moment().subtract(1, 'day').isAfter(moment(this.lastUpdate));
    }

    

    this.prepareAddressAndContactInformation();

    this.prepareBarCharts();

    this.prepareTemporalCharts();

    
  }
  // getTrendIcon(entries: TimestampedValue[]): string {
  //   const latest = getLatest(entries);
  //   return latest >= 0 ? (latest == 0 ? 'trending_flat' : 'trending_up') : 'trending_down';
  // }

  getCapacityStateColor(bedStatus: string) {
    return this.colormapService.getSingleHospitalColormap()(bedStatus);
  }

  getStatusColorFor(bedStatus: BedType) {
    return this.colormapService.getLatestBedStatusColor(this.singleHospital.developments, bedStatus);
  }

  getStatusDescriptionFor(bedStatus: BedType) {
    const latest = this.singleHospital.developments[this.singleHospital.developments.length - 1];
    const counts = this.colormapService.propertyAccessor(bedStatus)(latest);

    return Object.keys(counts).find(s => s !== "") ?? "Keine Information";
  }

  getGlyphColor(str: string) {
    return this.colormapService.getSingleHospitalColormap()(str);
  }


  private prepareBarCharts() {
    const bedStati = this.glyphLegendColors;

    this.barChartSpecs = [];
    let maxNum = 0;

    for(const bedAccessor of this.bedAccessors) {
      const dataValues = [];

      // fill the data object
      for(const bedStatus of bedStati) {
        const v = this.latestDevelopment[bedAccessor][bedStatus] || 0;

        if(bedAccessor === this.bedAccessors[0]) {
          this.totalNumberOfHospitals += v;
        }


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
      const spec = JSON.parse(JSON.stringify(this.barChartTemplateSpec));

      // inject data values
      spec.data.values = dataValues;

      // also overwrite the title
      spec.encoding.x.title = '';

      this.barChartSpecs.push({
        title: this.bedAccessorsMapping[bedAccessor],
        chart: spec
      });
    }

    // set the max value
    this.barChartSpecs.forEach(spec => {
      spec.chart.encoding.y.scale.domain = [0, maxNum+1];
      spec.chart.encoding.y.axis.tickCount = Math.min(maxNum+1, 5);
    });
  }

  private prepareAddressAndContactInformation() {
    if(!this.isSingleHospital) {
      return false;
    }


    if(this.singleHospital.contact.indexOf('http')>-1){
      this.contact = 'http' + this.singleHospital.contact.split('http')[1];
      this.url = true;

      this.contactMsg = this.singleHospital.contact.replace(this.contact, '').replace('Website', '').trim();

      if (this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    }else{
      this.contact = this.singleHospital.contact;
      this.url = false;

      this.contactMsg = this.singleHospital.contact;
    }
  }

  private prepareTemporalCharts() {
    // var data = [{"development" : {"timestamp" : "2020-03-27T14:49:00", "icu_low_care" : {"Begrenzt" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-28T09:42:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-29T10:38:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-30T09:18:00", "icu_low_care" : {"Verfügbar" : 1}, "icu_high_care" : {"Begrenzt" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}, {"development" : {"timestamp" : "2020-03-31T09:04:00", "icu_low_care" : {"Begrenzt" : 1}, "icu_high_care" : {"Verfügbar" : 1}, "ecmo_state" : {"Nicht verfügbar" : 1}}}];
    const bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet']; //FIXME add "Nicht verfügbar" if should be displayed

    var colors = [];
    for (const bedStatus of bedStati) {
     colors.push(this.getCapacityStateColor(bedStatus));
    }

    this.specs = [];
    let maxNum = 0;

    let maxNumSlices = 0;

    if (this.data.developments) {
      for(const bedAccessor of this.bedAccessors) {
        let summedbedcounts = 0;
        const dataValues = [];

        for( const d of this.data.developments) {

          let sumOfOneSlice = 0;
          // fill the data object
          for (const bedStatus of bedStati) {
            const v = d[bedAccessor][bedStatus] || 0;
            
            summedbedcounts++;

            sumOfOneSlice += v;

            dataValues.push(
              {
                Kategorie: bedStatus,
                num: v,
                color: this.getCapacityStateColor(bedStatus),
                Datum: d.timestamp
              }
            );
            if (v > maxNum) {
              maxNum = v;
            }
          }

          if(sumOfOneSlice > maxNumSlices) {
            maxNumSlices = sumOfOneSlice;
          }
        }

        

        // hack deep clone spec
        const spec = JSON.parse(JSON.stringify(this.temporalChartTemplateSpec));

        // inject data values
        spec.data.values = dataValues;
        
        spec.encoding.y.scale = {
          domain: [0, maxNumSlices]
        }

        if(!this.isSingleHospital) {
          spec.mark.interpolate = 'step-before';
          // spec.width = 370;
        } else {
          // is single hospital
          spec.encoding.y.axis = false;

          spec.height = spec.height * 0.3;
        }

        // also overwrite the title
        spec.encoding.x.title = '';

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
  }
}
