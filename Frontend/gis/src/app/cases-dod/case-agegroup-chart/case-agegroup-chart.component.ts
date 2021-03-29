import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { map } from 'rxjs/operators';
import { CovidNumberCaseDataSource, CovidNumberCaseNormalization, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { RKICaseDevelopmentProperties } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { VegaPixelchartService } from '../../services/vega-pixelchart.service';
import { CovidChartOptions, ScaleType, TimeGranularity } from '../covid-chart-options';

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
      CovidNumberCaseDataSource.rki,
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

    const dataAndOptions = this.vegaPixelchartService.compileToDataAndOptions(this._options, fullData, autoConfig);

    dataAndOptions.chartOptions.yAxisTitle = this.i18nAltersgruppe.nativeElement.textContent;

    dataAndOptions.chartOptions.xAxisTitle = this._options.timeAgg === TimeGranularity.yearweek ? this.i18nWoche.nativeElement.textContent : this.i18nDatum.nativeElement.textContent;

    dataAndOptions.chartOptions.zAxisTitle = this.i18nVal.nativeElement.textContent;

    this.spec = this.vegaPixelchartService.compileChart(dataAndOptions.data, dataAndOptions.chartOptions);

    // console.log(JSON.stringify(this.spec));
  }

}
