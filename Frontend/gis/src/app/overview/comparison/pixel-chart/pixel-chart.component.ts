import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { CovidChartOptions, ScaleType, TimeGranularity } from 'src/app/cases-dod/covid-chart-options';
import { CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { AggregatedRKICaseDevelopmentProperties, RKIAgeGroups, RKICaseDevelopmentProperties, RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { PixelChartDataPoint, VegaPixelchartService } from 'src/app/services/vega-pixelchart.service';
import { DataRequest } from '../comparison-view/comparison-view.component';

@Component({
  selector: 'app-pixel-chart',
  templateUrl: './pixel-chart.component.html',
  styleUrls: ['./pixel-chart.component.less']
})
export class PixelChartComponent implements OnInit {

  @ViewChild('i18nAltersgruppe', {static: true})
  i18nAltersgruppe: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nDatum', {static: true})
  i18nDatum: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nWoche', {static: true})
  i18nWoche: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nVal', {static: true})
  i18nVal: ElementRef<HTMLSpanElement>;

  _dataRequest: DataRequest[];

  _options: CovidChartOptions;

  @Input()
  public set dataRequest(d: DataRequest[]) {
    this._dataRequest = d;

    this.updateChart(true);
  }

  public get dataRequest(): DataRequest[] {
    return this._dataRequest;
  }

  @Input()
  public set options(o: CovidChartOptions) {
    this._options = JSON.parse(JSON.stringify(o));

    this.updateChart(false);
  }

  public get options(): CovidChartOptions {
    return this._options;
  }

  spec: any;

  titleRegions: string;

  // timeAggs = ['yearmonthdate', 'yearweek'];
  // timeAgg = 'yearmonthdate';

  // scaleTypes = ['linear', 'sqrt', 'symlog'];
  // scaleType = 'linear';

  eCovidNumberCaseType = CovidNumberCaseType;
  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;
  eCovidChartTimeGranularity = TimeGranularity;
  eCovidChartScaleType = ScaleType;

  constructor(
    private vegaPixelchartService: VegaPixelchartService,
    private caseRepo: CaseDevelopmentRepository
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(autoConfig = false): void {
    if (!this._dataRequest || !this._options) {
      return;
    }

    this.caseRepo.getCasesDevelopmentAggregated(
      'rki',
      this._dataRequest
    )
    .pipe(
      map(d => d.properties)
    )
    .subscribe(fullData => this.compileChart(fullData, autoConfig));
  }

  private compileChart(fullData: AggregatedRKICaseDevelopmentProperties, autoConfig: boolean) {
    this.titleRegions = fullData.name.join(', ');

    let idxDiff = 1;
    switch (this._options.timeWindow) {
      case CovidNumberCaseTimeWindow.twentyFourhours:
        idxDiff = 1;
        this._options.timeAgg = TimeGranularity.yearmonthdate;
        break;

      case CovidNumberCaseTimeWindow.seventyTwoHours:
        idxDiff = 3;
        this._options.timeAgg = TimeGranularity.yearmonthdate;
        break;

      case CovidNumberCaseTimeWindow.sevenDays:
        idxDiff = 7;
        if (autoConfig) {
          this._options.timeAgg = TimeGranularity.yearweek;
        }
        break;

      default:
        idxDiff = 7;
    }

    let ageGroupAccessor: ((s: RKICaseTimedStatus) => RKIAgeGroups);

    switch (this._options.type) {
      case CovidNumberCaseType.cases:
        ageGroupAccessor = ((s: RKICaseTimedStatus) => s.cases_by_agegroup);
        break;

      case CovidNumberCaseType.deaths:
        ageGroupAccessor = ((s: RKICaseTimedStatus) => s.deaths_by_agegroup);
        break;
    }

    const data: PixelChartDataPoint[] = [];

    for (let i = idxDiff; i < fullData.developments.length; i++) {
      const agNow: RKIAgeGroups = ageGroupAccessor(fullData.developments[i]);
      const agOld: RKIAgeGroups = ageGroupAccessor(fullData.developments[i - idxDiff]);

      for (const k of Object.keys(agNow)) {
        if (this._options.normalization === CovidNumberCaseNormalization.per100k && k === 'Aunknown') {
          continue;
        }
        let diff = (agNow[k] - agOld[k]);

        if (this._options.normalization === CovidNumberCaseNormalization.per100k) {
          diff = diff / fullData.developments[i].population_by_agegroup[k] * 100000;
        }

        data.push({
          x: fullData.developments[i].timestamp,
          y: k,
          val: diff
        });
      }
    }

    const yAxis = this.i18nAltersgruppe.nativeElement.textContent;

    const xAxis = this._options.timeAgg === TimeGranularity.yearweek ? this.i18nWoche.nativeElement.textContent : this.i18nDatum.nativeElement.textContent;

    const zAxis = this.i18nVal.nativeElement.textContent;

    this.spec = this.vegaPixelchartService.compileChart(data, {
      xAxisTitle: xAxis,
      yAxisTitle: yAxis,
      zAxisTitle: zAxis,
      width: 'container',
      height: 200,
      scaleType: this._options.scaleType.toString(),
      timeAgg: this._options.timeAgg.toString()
    });

    console.log(JSON.stringify(this.spec));
  }
}
