import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { RKICaseDevelopmentProperties } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { VegaLinechartService } from 'src/app/services/vega-linechart.service';
import { getMoment } from 'src/app/util/date-util';
import { CovidChartOptions } from '../covid-chart-options';

@Component({
  selector: 'app-case-line-chart',
  templateUrl: './case-line-chart.component.html',
  styleUrls: ['./case-line-chart.component.less']
})
export class CaseLineChartComponent implements OnInit {

  @ViewChild('i18nAccumulated', {static: true})
  i18nAccumulated: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nPer100k', {static: true})
  i18nPer100k: ElementRef<HTMLSpanElement>;

  @ViewChild('i18nPerDay', {static: true})
  i18nPerDay: ElementRef<HTMLSpanElement>;

  tDay = 7;

  @Input()
  public data: RKICaseDevelopmentProperties;

  private _options: CovidChartOptions;

  @Input()
  set options(o: CovidChartOptions) {
    this._options = o;

    if (o) {
      this.updateChart();
    }
  }

  get options(): CovidChartOptions {
    return this._options;
  }

  rollingChart: Observable<any>;

  trend: Observable<{m: number; b: number; rotation: number}>;

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService,
    private vegaLinechartService: VegaLinechartService
  ) { }

  ngOnInit(): void {
    this.updateChart();
  }

  updateChart() {
    if (!this.options || !this.data) {
      return;
    }

    // to avoid Expression has changed after it has been checked error
    switch (this.options.timeWindow) {
      case CovidNumberCaseTimeWindow.twentyFourhours:
        this.tDay = 1;
      break;

      case CovidNumberCaseTimeWindow.seventyTwoHours:
        this.tDay = 3;
      break;

      case CovidNumberCaseTimeWindow.sevenDays:
        this.tDay = 7;
      break;
    }

    setTimeout(() => {
      this.rollingChart = this.caseRepo.getCasesDevelopmentForAggLevelSingle(
        this.options.dataSource,
        this.options.aggregationLevel,
        this.data.id
      )
      .pipe(
        map(d => d.properties),
        mergeMap(d => this.caseUtil.extractXYByOptions(d, this.options)),
        map(d => {

          const tType = this.options.type;

          const tNorm = this.options.normalization === CovidNumberCaseNormalization.per100k ? ' ' + this.i18nPer100k.nativeElement.textContent : '';

          const tWindow = ' / ' + this.i18nPerDay.nativeElement.textContent;

          return this.vegaLinechartService.compileChart(d.splice(7), {
            xAxisTitle: null,
            yAxisTitle: 'New ' + tType + tNorm + tWindow,
            yAxis2Title: this.i18nAccumulated.nativeElement.textContent + tNorm,
            width: 700,
            height: 150,
            regression: {
              to: getMoment(this.options.date).toISOString(),
              from: getMoment(this.options.date).subtract(this.options.daysForTrend, 'days').toISOString()
            },
            incidenceRules: this.caseUtil.isLockdownMode(this.options),
            tempGranularity: this.options.timeAgg,
            scaleType: this.options.scaleType
          });
        })
      );
    });


    setTimeout(() => {

      this.trend = this.caseRepo.getCasesDevelopmentForAggLevelSingle(
        this.options.dataSource,
        this.options.aggregationLevel,
        this.data.id
      )
      .pipe(
        mergeMap(d => this.caseUtil.getTrendForCase7DaysPer100k(d.properties, this.options)),
        map(d => ({ m: d.m, b: d.b, rotation: this.caseUtil.getRotationForTrend(d.m)}))
      );
    });
  }

}
