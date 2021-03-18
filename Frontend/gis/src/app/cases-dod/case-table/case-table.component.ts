import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from 'src/app/map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from 'src/app/repositories/case-development.repository';
import { RKICaseTimedStatus } from 'src/app/repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from 'src/app/services/case-util.service';
import { getMoment, getStrDate } from 'src/app/util/date-util';

@Component({
  selector: 'app-case-table',
  templateUrl: './case-table.component.html',
  styleUrls: ['./case-table.component.less']
})
export class CaseTableComponent implements OnInit {

  private _options: CovidNumberCaseOptions;

  @Input()
  set options(o: CovidNumberCaseOptions) {
    this._options = o;

    this.updateTable();
  }

  get options(): CovidNumberCaseOptions {
    return this._options;
  }

  @Input()
  public tooltip: boolean;

  @Input()
  public dataId: string;


  curTimedStatus: RKICaseTimedStatus;

  twentyFourHTimedStatus: RKICaseTimedStatus;

  seventyTwoHTimedStatus: RKICaseTimedStatus;

  sevenDaysTimedStatus: RKICaseTimedStatus;

  eChange = CovidNumberCaseChange;

  eTime = CovidNumberCaseTimeWindow;

  eType = CovidNumberCaseType;

  eNorm = CovidNumberCaseNormalization;

  lastUpdated: string;

  loading = true;

  dataOutdated: boolean;

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService,
    private numberPipe: DecimalPipe
  ) { }

  ngOnInit(): void {
    this.updateTable();
  }

  updateTable() {
    if (!this.dataId || !this.options) {
      return;
    }

    this.loading = true;


    this.caseRepo.getCasesDevelopmentForAggLevelSingle(
      this.options.dataSource,
      this.options.aggregationLevel,
      this.dataId,
      getStrDate(getMoment(this.options.date).add(1, 'day'))
    ).subscribe(d => {
      const data = d.properties;

      let refIdx = this.caseUtil.findHighestIdxWhereInsertedIsNotNull(data);

      // this may happen if the entity does not report any data
      // all development entries will have inserted === null
      // we fallback and take the last development
      if (refIdx === -1) {
        refIdx = data.developments.length - 1;
      }

      this.curTimedStatus = this.caseUtil.getTimedStatusByIdx(data, refIdx);
      this.twentyFourHTimedStatus = this.caseUtil.getTimedStatusByIdx(data, refIdx - 1);
      this.seventyTwoHTimedStatus = this.caseUtil.getTimedStatusByIdx(data, refIdx - 3);
      this.sevenDaysTimedStatus = this.caseUtil.getTimedStatusByIdx(data, refIdx - 7);


      const slice = data.developments.slice().reverse().find(d1 => d1.inserted);

      this.lastUpdated = slice ? slice.inserted : (this.curTimedStatus.last_updated || this.curTimedStatus.timestamp);

      this.dataOutdated = !(getMoment(this.lastUpdated).isSame(getMoment('now'), 'day'));

      this.loading = false;
    });
  }

  getCasesPer100kInhabitants(count: number, status: RKICaseTimedStatus, addPlus: boolean = false): string {
    const v = ((count / status.population) * 100000);

    return `${v > 0 && addPlus ? '+' : ''}${this.numberPipe.transform(v, '1.0-2')}`;
  }

  getPercentageChange(curr: number, old: number): string {
    if (curr === old) {
      return '0%';
    }
    const change = ((curr - old) / old) * 100;
    if (change === Infinity) {
      return ('war 0');
    }
    return `${change > 0 ? '+' : ''}${this.numberPipe.transform(change, '1.0-1')}%`;
  }


  isActive(eType: CovidNumberCaseType, eNorm: CovidNumberCaseNormalization, eTime: CovidNumberCaseTimeWindow, eChange: CovidNumberCaseChange) {
    return this.options.type === eType && this.options.change === eChange && this.options.normalization === eNorm && this.options.timeWindow === eTime;
  }
}
