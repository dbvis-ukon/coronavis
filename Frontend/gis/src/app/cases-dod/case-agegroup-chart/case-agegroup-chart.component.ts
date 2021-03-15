import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { RKIAgeGroups, RKICaseDevelopmentProperties, RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { VegaPixelchartService } from '../../services/vega-pixelchart.service';
import { CovidChartOptions, TimeGranularity, ScaleType, AgeGroupBinning } from '../covid-chart-options';

@Component({
  selector: 'app-case-agegroup-chart',
  templateUrl: './case-agegroup-chart.component.html',
  styleUrls: ['./case-agegroup-chart.component.less']
})
export class CaseAgegroupChartComponent implements OnInit {

  @ViewChild('i18nAltersgruppe', {static: true})
  i18nAltersgruppe: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nDatum', {static: true})
  i18nDatum: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nWoche', {static: true})
  i18nWoche: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nVal', {static: true})
  i18nVal: ElementRef<HTMLSpanElement>;

  _data: RKICaseDevelopmentProperties;

  _options: CovidChartOptions;

  _ageGroups: {[key: string]: [number, number][] | null} = {
    all: null,
    fiveyears: [
      [0, 4],
      [5, 9],
      [10, 14],
      [15, 19],
      [20, 24],
      [25, 29],
      [30, 34],
      [35, 39],
      [40, 44],
      [45, 49],
      [50, 54],
      [55, 59],
      [60, 64],
      [65, 69],
      [70, 74],
      [75, 79],
      [80, 80],
    ],
    rki: [
      [0, 4],
      [5, 14],
      [15, 34],
      [35, 59],
      [60, 79],
      [80, 80]
    ]
  };

  @Input()
  public set data(d: RKICaseDevelopmentProperties) {
    this._data = d;

    this.updateChart(true);
  }

  public get data(): RKICaseDevelopmentProperties {
    return this._data;
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

  hasPopulationData = true;

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
    private caseRepo: CaseDevelopmentRepository,
    private caseUtils: CaseUtilService
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart(autoConfig = false): void {
    if (!this._data?.id || !this._options) {
      return;
    }

    this.caseRepo.getCasesDevelopmentForAggLevelSingle(
      'rki',
      this._options.aggregationLevel,
      this._data.id
    )
    .pipe(
      map(d => d.properties)
    )
    .subscribe(fullData => this.compileChart(fullData, autoConfig));
  }

  private compileChart(fullData: RKICaseDevelopmentProperties, autoConfig: boolean) {
    this.hasPopulationData = fullData.developments[0].population_by_agegroup.A00_A04 !== null;

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

    // let ageGroupAccessor: ((s: RKICaseTimedStatus) => RKIAgeGroups);

    // switch (this._options.type) {
    //   case CovidNumberCaseType.cases:
    //     ageGroupAccessor = ((s: RKICaseTimedStatus) => s.cases_survstat_by_agegroup);
    //     break;

    //   case CovidNumberCaseType.deaths:
    //     ageGroupAccessor = ((s: RKICaseTimedStatus) => s.deaths_by_agegroup);
    //     break;
    // }

    const ageGroups: [number, number][] = this._ageGroups[this._options.ageGroupBinning];

    const data = [];
    let maxDiff = 0;
    let numberOfAgeGroups = 0;

    const converted = [];

    for (let i = 0; i < idxDiff; i++) {
      let agNow;
      switch (this._options.type) {
        case CovidNumberCaseType.cases:
          agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
          converted[i] = agNow;

          this._options.timeAgg = TimeGranularity.yearweek;
          idxDiff = 7;

          break;

        case CovidNumberCaseType.deaths:
          agNow = fullData.developments[i].deaths_by_agegroup;
          break;
      }
      converted[i] = agNow;
    }

    for (let i = idxDiff; i < fullData.developments.length; i++) {
      let agNow;
      let agPop;
      switch (this._options.type) {
        case CovidNumberCaseType.cases:
          agNow = this.caseUtils.groupAgeStatus(fullData.developments[i].cases_survstat_by_agegroup, ageGroups);
          agPop = this.caseUtils.groupAgeStatus(fullData.developments[i].population_survstat_by_agegroup, ageGroups);
          break;

        case CovidNumberCaseType.deaths:
          agNow = fullData.developments[i].deaths_by_agegroup;
          agPop = fullData.developments[i].population_by_agegroup;
          break;
      }

      converted[i] = agNow;
      const agOld = converted[i - idxDiff];

      // const agNow: RKIAgeGroups = ageGroupAccessor(fullData.developments[i]);
      // const agOld: RKIAgeGroups = ageGroupAccessor(fullData.developments[i - idxDiff]);
      numberOfAgeGroups = Object.keys(agNow).length;

      for (const k of Object.keys(agNow)) {
        if (this._options.normalization === CovidNumberCaseNormalization.per100k && k === 'Aunknown') {
          continue;
        }
        let diff = (agNow[k] - agOld[k]);

        if (this._options.normalization === CovidNumberCaseNormalization.per100k) {
          diff = diff / agPop[k] * 100000;
        }

        if (diff > maxDiff) {
          maxDiff = diff;
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
      height: numberOfAgeGroups * 9,
      scaleType: this._options.scaleType.toString(),
      timeAgg: this._options.timeAgg.toString(),
      domain: [0, maxDiff]
    });

    // console.log(JSON.stringify(this.spec));
  }

}
