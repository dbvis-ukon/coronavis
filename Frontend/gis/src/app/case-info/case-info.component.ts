import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { filter, flatMap, map, toArray } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from '../services/case-util.service';
import { VegaLinechartService } from '../services/vega-linechart.service';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less']
})
export class CaseInfoComponent implements OnInit {

  @Input()
  public data: RKICaseDevelopmentProperties;

  @Input()
  public options: CovidNumberCaseOptions;


  eChange = CovidNumberCaseChange;

  eTime = CovidNumberCaseTimeWindow;

  eType = CovidNumberCaseType;

  eNorm = CovidNumberCaseNormalization;

  curTimedStatus: RKICaseTimedStatus;

  twentyFourHTimedStatus: RKICaseTimedStatus;

  seventyTwoHTimedStatus: RKICaseTimedStatus;

  sevenDaysTimedStatus: RKICaseTimedStatus;

  rollingChart: Observable<any>;

  constructor(
    private numberPipe: DecimalPipe, 
    private caseUtil: CaseUtilService,
    private vegaLinechartService: VegaLinechartService
  ) { }

  ngOnInit(): void {
    [this.curTimedStatus, this.twentyFourHTimedStatus] = this.caseUtil.getNowPrevTimedStatusTuple(this.data, this.options.date, CovidNumberCaseTimeWindow.twentyFourhours);
    [this.curTimedStatus, this.seventyTwoHTimedStatus] = this.caseUtil.getNowPrevTimedStatusTuple(this.data, this.options.date, CovidNumberCaseTimeWindow.seventyTwoHours);
    [this.curTimedStatus, this.sevenDaysTimedStatus] = this.caseUtil.getNowPrevTimedStatusTuple(this.data, this.options.date, CovidNumberCaseTimeWindow.sevenDays);

    // console.log('name', this.data.name, this.curTimedStatus, this.twentyFourHTimedStatus, this.seventyTwoHTimedStatus);
    this.rollingChart = of(this.data)
    .pipe(
      flatMap(d => d.developments),
      filter((_, i) => i >= 7),
      map(d => {
        const t = this.caseUtil.getNowPrevTimedStatusTuple(this.data, moment(d.timestamp).format('YYYY-MM-DD'), CovidNumberCaseTimeWindow.sevenDays);
        return {
          x: d.timestamp, 
          y: t[0].cases_per_100k - t[1].cases_per_100k};}),
      toArray(),
      map(d => this.vegaLinechartService.compileChart(d, {xAxisTitle: '', yAxisTitle: 'Cases per 100', width: 600, height: 100}))
    );
  }

  public getCasesPer100kInhabitants(count: number, status: RKICaseTimedStatus, addPlus: boolean = false): string {
    const v = ((count / status.population) * 100000);

    return `${v > 0 && addPlus ? '+' : ''}${this.numberPipe.transform(v, '1.0-2')}`;
  }

  public getPercentageChange(curr: number, old: number): string {
    if (curr === old) {
      return "0%";
    }
    const change = ((curr - old) / old) * 100;
    if (change === Infinity) {
      return ("war 0");
    }
    return `${change > 0 ? '+' : ''}${this.numberPipe.transform(change, '1.0-1')}%`
  }

  isActive(eType: CovidNumberCaseType, eNorm: CovidNumberCaseNormalization, eTime: CovidNumberCaseTimeWindow, eChange: CovidNumberCaseChange) {
    return this.options.type === eType && this.options.change === eChange && this.options.normalization === eNorm && this.options.timeWindow === eTime;
  }

}
