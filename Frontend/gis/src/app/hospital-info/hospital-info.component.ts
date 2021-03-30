/* eslint-disable @typescript-eslint/quotes, quote-props */

import { Component, Input, OnInit } from '@angular/core';
import moment, { Moment } from 'moment';
import { Observable, of } from 'rxjs';
import { map, max, mergeMap } from 'rxjs/operators';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { BedType } from "../map/options/bed-type.enum";
import { QualitativeDiviDevelopmentRepository } from '../repositories/qualitative-divi-development.respository';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { HospitalUtilService } from '../services/hospital-util.service';
import { I18nService, SupportedLocales } from '../services/i18n.service';
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { TranslationService } from '../services/translation.service';
import { VegaBarchartService } from '../services/vega-barchart.service';
import { getMoment, getStrDate } from '../util/date-util';

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

  private _options: BedGlyphOptions | BedBackgroundOptions;

  @Input()
  set options(o: BedGlyphOptions | BedBackgroundOptions) {
    this._options = o;

    this.updateData();
  }

  get options(): BedGlyphOptions | BedBackgroundOptions {
    return this._options;
  }

  @Input()
  set data(d: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>) {
    this._data = d;

    this.updateData();
  }

  get data(): SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus> {
    return this._data;
  }

  private fullData: SingleHospitalOut<QualitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus>;

  glyphLegendColors = QualitativeColormapService.bedStati;

  temporalChartTemplateSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
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



  tempChartSpecs$: Observable<any[]>;

  barChartSpecs$: Observable<any[]>;

  bedAccessors = ['icu_low_state', 'icu_high_state', 'ecmo_state'];
  bedAccessorsMapping = {'icu_low_state': 'ICU - Low Care', 'icu_high_state': 'ICU - High Care', 'ecmo_state': 'ECMO'};

  isSingleHospital = false;
  singleHospital: SingleHospitalOut<QualitativeTimedStatus>;

  latestDevelopment: QualitativeTimedStatus;

  lastUpdate: Date;

  firstTimestamp: Moment;

  warnOfOutdatedData: boolean;

  totalNumberOfHospitals = 0;

  now = new Date();

  constructor(private colormapService: QualitativeColormapService,
              private translationService: TranslationService,
              private vegaBarchartService: VegaBarchartService,
              private i18nService: I18nService,
              private diviRepo: QualitativeDiviDevelopmentRepository,
              private hospitalUtil: HospitalUtilService
    ) {
  }

  ngOnInit(): void {
    this.updateData();
  }

  private async updateData() {
    this.tempChartSpecs$ = undefined;
    this.barChartSpecs$ = undefined;
    if (!this.data || !this.options) {
      return;
    }

    // eslint-disable-next-line prefer-const
    let [from, to] = this.hospitalUtil.getFromToTupleFromOptions(this.options);

    from = getStrDate(getMoment(to).subtract(11, 'days'));

    if (this.hospitalUtil.isSingleHospital(this.data)) {
      this.isSingleHospital = true;

      this.fullData = (await this.diviRepo.getDiviDevelopmentSingleHospital(this.data.id, from, to).toPromise()).properties;

      this.singleHospital = this.fullData as SingleHospitalOut<QualitativeTimedStatus>;
    } else {
      this.fullData = (await this.diviRepo.getDiviDevelopmentForAggLevelSingle(this.options.aggregationLevel, this.data.id, from, to).toPromise()).properties;
    }

    if (this.fullData.developments) {
      this.latestDevelopment = this.fullData.developments[this.fullData.developments.length - 1];
      this.totalNumberOfHospitals = this.latestDevelopment.num_hospitals;


      const lastUpdateM = getMoment(this.latestDevelopment.last_updated);
      this.lastUpdate = lastUpdateM.toDate();

      const tenDaysAgo = moment().subtract(10, 'day');
      this.firstTimestamp = moment.max(getMoment(this.fullData.developments[0].timestamp), tenDaysAgo);

      this.warnOfOutdatedData = moment().subtract(1, 'day').isAfter(lastUpdateM);
    }

    this.tempChartSpecs$ = this.getTemporalCharts();


    if (this.isSingleHospital) {
      this.prepareAddressAndContactInformation();
    } else {
      this.barChartSpecs$ = this.getBarChartSpecs();
    }
  }

  // getTrendIcon(entries: TimestampedValue[]): string {
  //   const latest = getLatest(entries);
  //   return latest >= 0 ? (latest == 0 ? 'trending_flat' : 'trending_up') : 'trending_down';
  // }

  getCapacityStateColor(bedStatus: string) {
    return this.colormapService.getSingleHospitalColormap()(bedStatus);
  }

  getStatusColorFor(bedStatus: BedType) {
    return this.colormapService.getLatestBedStatusColor(this.fullData, bedStatus);
  }

  getStatusDescriptionFor(bedStatus: BedType) {
    const latest = this.fullData.developments[this.fullData.developments.length - 1];
    const counts = this.colormapService.propertyAccessor(bedStatus)(latest);

    return Object.keys(counts).find(key => key !== '' && counts[key] > 0) ?? "Keine Information";
  }

  private getBarChartSpecs(): Observable<any[]> {
    const barChartSpecs = [];

    if (!this.latestDevelopment) {
      return undefined;
    }

    const bedStati = this.glyphLegendColors;




    for (const bedAccessor of this.bedAccessors) {

      const spec = this.vegaBarchartService.compileChart(this.latestDevelopment, bedAccessor, bedStati, {
        xAxisTitle: '',
        yAxisTitle: this.translationService.translate('Anzahl Krankenhäuser'),
        width: 55
      });


      barChartSpecs.push({
        title: this.bedAccessorsMapping[bedAccessor],
        chart: spec
      });
    }

    return of(barChartSpecs)
    .pipe(
      mergeMap(d => d),
      mergeMap(d => d.chart.data.values),
      map((d: any) => d.num as number),
      max(),
      map(maxNum => {
        barChartSpecs.forEach(spec => {
          spec.chart.encoding.y.scale.domain = [0, maxNum + 1];
          spec.chart.encoding.y.axis.tickCount = Math.min(maxNum + 1, 5);
        });
        return barChartSpecs;
      })
    );
  }

  private prepareAddressAndContactInformation(): void {
    if (!this.isSingleHospital) {
      return;
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
    for (let i = dataValues.length - 1; i >= 0; i--) {
      if (moment(dataValues[i].Datum).isSame(date) && dataValues[i].Kategorie === category){
        return true;
      }
    }
    return false;
  }

  private getTemporalCharts(): Observable<any[]> {
    return of(true)
    .pipe(
      map(() => {
        const bedStati = this.glyphLegendColors;

        const colors = [];
        for (const bedStatus of bedStati) {
          colors.push(this.getCapacityStateColor(bedStatus));
        }


        const specs = [];
        let maxNum = 0;

        let maxNumSlices = 0;

        if (!this.fullData.developments) {
          return null;
        }

        const tenDaysAgo = moment().subtract(10, 'day');
        // const data = this.fullData.developments.filter(d => tenDaysAgo.isBefore(moment(d.timestamp)));
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
          for ( const d of this.fullData.developments) {

            let sumOfOneSlice = 0;
            // fill the data object
            for (const bedStatus of bedStati) {
              const v = d[bedAccessor][bedStatus] || 0;

              summedbedcounts++;

              sumOfOneSlice += v;

              if (!this.existsInDataValues(moment.max(getMoment(d.timestamp), tenDaysAgo), bedStatus, dataValues)) {
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
              if (counter === this.fullData.developments.length - 1){
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

          // if (this.isSingleHospital && (new Date(this.lastUpdate).getTime() - new Date(this.firstTimestamp).getTime() < 2 * 24 * 60 * 60 * 1000)) {

          //  spec.encoding.x.axis.labelExpr = "[timeFormat(datum.value, '%d.%m'), false ? ' ' : timeFormat(datum.value, '(%H:%M)')]";
          // }

          spec.encoding.y.scale = {
            domain: [0, maxNumSlices]
          };

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

          if (this.i18nService.getCurrentLocale() === SupportedLocales.DE_DE) {
            spec.encoding.x.axis.format = '%d.%m';
          } else {
            spec.encoding.x.axis.format = '%m/%d';
          }

          if (summedbedcounts > 0) {
            const bedType = bedAccessor === 'icu_low_state' ? this.eBedType.icuLow : (bedAccessor === 'icu_high_state' ? this.eBedType.icuHigh : this.eBedType.ecmo);
            specs.push({
              title: this.bedAccessorsMapping[bedAccessor],
              chart: spec,
              bedtype: bedType,
              bedStatusDesc: this.getStatusDescriptionFor(bedType)
            });


          }

          // set the max value
          specs.forEach(s => {
            s.chart.encoding.color.scale.domain = bedStati;
            s.chart.encoding.color.scale.range = colors;
            // spec.encoding.color.range = Math.min(maxNum+1, 5);
          });

        }

        return specs;
      }));
  }
}
