import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from '../services/case-util.service';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less'],
  providers: [DecimalPipe]
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

  constructor(private numberPipe: DecimalPipe, private caseUtil: CaseUtilService) { }

  ngOnInit(): void {
    [this.curTimedStatus, this.twentyFourHTimedStatus] = this.caseUtil.getNowPrevTimedStatusTuple(this.data, this.options.date, CovidNumberCaseTimeWindow.twentyFourhours);
    [this.curTimedStatus, this.seventyTwoHTimedStatus] = this.caseUtil.getNowPrevTimedStatusTuple(this.data, this.options.date, CovidNumberCaseTimeWindow.seventyTwoHours);

    // console.log('name', this.data.name, this.curTimedStatus, this.twentyFourHTimedStatus, this.seventyTwoHTimedStatus);
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
