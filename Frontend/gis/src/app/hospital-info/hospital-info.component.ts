import { Component, Input, OnInit } from '@angular/core';
import moment, { Moment } from 'moment';
import { of } from 'rxjs';
import { flatMap, map, max, reduce } from 'rxjs/operators';
import { BedType } from "../map/options/bed-type.enum";
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { I18nService, SupportedLocales } from '../services/i18n.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { TranslationService } from '../services/translation.service';
import { VegaBarchartService } from '../services/vega-barchart.service';
import { getMoment } from '../util/date-util';

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

  private _data: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>;

  @Input()
  set data(d: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>) {
    this._data = d;

    this.updateData();
  }

  get data(): SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus> {
    return this._data;
  }
 
  glyphLegendColors = QualitativeColormapService.bedStati;

  temporalChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
    "width": 260, "height": 50,
    "aggregated": true,
    "data": {
      "values": []
    },
    "mark": {"type": "area", "interpolate": "step-after"},
    "encoding": {
      "x": {
        "field": "Datum", "type": "temporal",
        "axis": {
          "domain": false,
          "tickSize": 2, "tickCount": 8,
          "format": "%d.%m"
        }
      },
      "y": {
        "field": "num", "type": "quantitative",
        "axis": {"title": "Anzahl KH", "tickMinStep": 1}
      },
      "color": {"type": "nominal", "field": "Kategorie", "scale": {"domain": [], "range": []}, "legend": false}
    }
  };

  

  specs = [];

  barChartSpecs = [];

  bedAccessors = ['icu_low_care', 'icu_high_care', 'ecmo_state'];
  bedAccessorsMapping = {'icu_low_care': 'ICU - Low Care', 'icu_high_care': 'ICU - High Care', 'ecmo_state': 'ECMO'};

  isSingleHospital: boolean = false;
  singleHospital: SingleHospitalOut<QualitativeTimedStatus>;

  latestDevelopment: QualitativeTimedStatus;

  lastUpdate: Date;

  firstTimestamp: Moment;

  warnOfOutdatedData: boolean;

  totalNumberOfHospitals: number = 0;

  now = new Date();

  constructor(private colormapService: QualitativeColormapService,
    private translationService: TranslationService,
    private vegaBarchartService: VegaBarchartService,
    private i18nService: I18nService
    ) {
  }

  ngOnInit(): void {
    this.updateData();
  }

  private updateData() {
    if ((this.data as SingleHospitalOut<QualitativeTimedStatus>).address) {
      this.isSingleHospital = true;
      this.singleHospital = this.data as SingleHospitalOut<QualitativeTimedStatus>;
    }

    if (this.data.developments) {
      this.latestDevelopment = this.data.developments[this.data.developments.length - 1];


      const lastUpdateM = this.isSingleHospital ? getMoment(this.latestDevelopment.timestamp) : getMoment(this.latestDevelopment.last_update);
      this.lastUpdate = lastUpdateM.toDate();

      const tenDaysAgo = moment().subtract(10, 'day');
      this.firstTimestamp = moment.max(getMoment(this.data.developments[0].timestamp), tenDaysAgo);

      this.warnOfOutdatedData = moment().subtract(1, 'day').isAfter(lastUpdateM);
    }


    this.prepareAddressAndContactInformation();

    this.prepareBarCharts()
    .then(v => this.barChartSpecs = v);

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
    return this.colormapService.getLatestBedStatusColor(this.singleHospital, bedStatus);
  }

  getStatusDescriptionFor(bedStatus: BedType) {
    const latest = this.singleHospital.developments[this.singleHospital.developments.length - 1];
    const counts = this.colormapService.propertyAccessor(bedStatus)(latest);

    return Object.keys(counts).find(s => s !== "") ?? "Keine Information";
  }

  getGlyphColor(str: string) {
    return this.colormapService.getSingleHospitalColormap()(str);
  }

  private async prepareBarCharts() {
    const barChartSpecs = [];

    if(!this.latestDevelopment) {
      return;
    }

    const bedStati = this.glyphLegendColors;

    
    

    for (const bedAccessor of this.bedAccessors) {

      const spec = this.vegaBarchartService.compileChart(this.latestDevelopment, bedAccessor, bedStati, {
        xAxisTitle: '',
        yAxisTitle: this.translationService.translate('Anzahl Krankenhäuser'),
        width: 55
      })


      barChartSpecs.push({
        title: this.bedAccessorsMapping[bedAccessor],
        chart: spec
      });
    }

    const maxNum = await of(barChartSpecs)
    .pipe(
      flatMap(d => d),
      flatMap(d => d.chart.data.values),
      map((d: any) => d.num as number),
      max()
    ).toPromise();



    of(barChartSpecs[0])
    .pipe(
      flatMap(d => d.chart.data.values),
      map((d: any) => d.num as number),
      reduce((acc, val) => acc + val)
    )
    .subscribe(v => this.totalNumberOfHospitals = v);

    // set the max value
    barChartSpecs.forEach(spec => {
      spec.chart.encoding.y.scale.domain = [0, maxNum + 1];
      spec.chart.encoding.y.axis.tickCount = Math.min(maxNum + 1, 5);
    });

    return barChartSpecs;
  }

  private prepareAddressAndContactInformation() {
    if (!this.isSingleHospital) {
      return false;
    }


    if (this.singleHospital.contact.indexOf('http') > -1) {
      this.contact = 'http' + this.singleHospital.contact.split('http')[1];
      this.url = true;

      this.contactMsg = this.singleHospital.contact.replace(this.contact, '').replace('Website', '').trim();

      if (this.contactMsg === '') {
        this.contactMsg = 'Webseite';
      }
    } else {
      this.contact = this.singleHospital.contact;
      this.url = false;

      this.contactMsg = this.singleHospital.contact;
    }
  }

  private existsInDataValues(date: Moment, category, dataValues){
    for(let i = dataValues.length-1; i>=0; i--) {
      if(moment(dataValues[i].Datum).isSame(date) && dataValues[i].Kategorie === category){
        return true;
      }
    }
    return false;
  }

  private prepareTemporalCharts() {
    const bedStati = this.glyphLegendColors;

    var colors = [];
    for (const bedStatus of bedStati) {
      colors.push(this.getCapacityStateColor(bedStatus));
    }

    this.specs = [];
    let maxNum = 0;

    let maxNumSlices = 0;


    if (this.data.developments) {
      const tenDaysAgo = moment().subtract(10, 'day');
      // const data = this.data.developments.filter(d => tenDaysAgo.isBefore(moment(d.timestamp)));
      for (const bedAccessor of this.bedAccessors) {
        let summedbedcounts = 0;
        const dataValues = [];

        if (this.firstTimestamp.isSameOrAfter(tenDaysAgo)) {
            dataValues.push(
              {
                Kategorie: "Keine Information",
                num: this.totalNumberOfHospitals,
                color: this.getCapacityStateColor("Keine Information"),
                Datum: tenDaysAgo
              }
            );
        }

        let counter = 0;
        for( const d of this.data.developments) {

          let sumOfOneSlice = 0;
          // fill the data object
          for (const bedStatus of bedStati) {
            const v = d[bedAccessor][bedStatus] || 0;

            summedbedcounts++;

            sumOfOneSlice += v;

            if(!this.existsInDataValues(moment.max(getMoment(d.timestamp), tenDaysAgo), bedStatus, dataValues)) {
              dataValues.push(
                {
                  Kategorie: bedStatus,
                  num: v,
                  color: this.getCapacityStateColor(bedStatus),
                  Datum: moment.max(getMoment(d.timestamp), tenDaysAgo).toDate()
                }
              );
              if (v > maxNum) {
                maxNum = v;
              }
            }

            // add last data point once again
            if(counter === this.data.developments.length-1){
              dataValues.push(
                {
                  Kategorie: bedStatus,
                  num: v,
                  color: this.getCapacityStateColor(bedStatus),
                  Datum: moment()
                }
              );
            }
          }

          if (sumOfOneSlice > maxNumSlices) {
            maxNumSlices = sumOfOneSlice;
          }

          counter++;
        }

        // hack deep clone spec
        const spec = JSON.parse(JSON.stringify(this.temporalChartTemplateSpec));

        // inject data values
        spec.data.values = dataValues;

        //if (this.isSingleHospital && (new Date(this.lastUpdate).getTime() - new Date(this.firstTimestamp).getTime() < 2 * 24 * 60 * 60 * 1000)) {

        //  spec.encoding.x.axis.labelExpr = "[timeFormat(datum.value, '%d.%m'), false ? ' ' : timeFormat(datum.value, '(%H:%M)')]";
        // }

        spec.encoding.y.scale = {
          domain: [0, maxNumSlices]
        }

        if (!this.isSingleHospital) {
          spec.mark.interpolate = 'step-after';
          spec.encoding.y.axis.title = this.translationService.translate('Anzahl KH');
          spec.encoding.x.axis.tickCount = 5;
          // spec.width = 370;
        } else {
          // is single hospital
          spec.encoding.y.axis = false;

          spec.height = spec.height * 0.3;
          spec.width  = 200;
        }

        // also overwrite the title
        spec.encoding.x.title = '';

        if(this.i18nService.getCurrentLocale() === SupportedLocales.DE_DE) {
          spec.encoding.x.axis.format = '%d.%m';
        } else {
          spec.encoding.x.axis.format = '%m/%d';
        }

        if (summedbedcounts > 0) {
          this.specs.push({
            title: this.bedAccessorsMapping[bedAccessor],
            chart: spec,
            bedtype: bedAccessor == 'icu_low_care' ? this.eBedType.icuLow : (bedAccessor == 'icu_high_care' ? this.eBedType.icuHigh : this.eBedType.ecmo)   
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
