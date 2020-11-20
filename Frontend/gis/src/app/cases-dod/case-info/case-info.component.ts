import { DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../../map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from '../../repositories/case-development.repository';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from '../../services/case-util.service';
import { VegaLinechartService } from '../../services/vega-linechart.service';
import { getMoment } from '../../util/date-util';

@Component({
  selector: 'app-case-info',
  templateUrl: './case-info.component.html',
  styleUrls: ['./case-info.component.less'],
  providers: [DecimalPipe]
})
export class CaseInfoComponent implements OnInit, AfterViewInit {

  @Input()
  public data: RKICaseDevelopmentProperties;

  @Input()
  public options: CovidNumberCaseOptions;

  @Input()
  public tooltip: boolean;


  eChange = CovidNumberCaseChange;

  eTime = CovidNumberCaseTimeWindow;

  eType = CovidNumberCaseType;

  eNorm = CovidNumberCaseNormalization;

  curTimedStatus: RKICaseTimedStatus;

  twentyFourHTimedStatus: RKICaseTimedStatus;

  seventyTwoHTimedStatus: RKICaseTimedStatus;

  sevenDaysTimedStatus: RKICaseTimedStatus;

  rollingChart: Observable<any>;

  trend: Observable<{m: number, b: number, rotation: number}>;

  lastUpdated: string;

  constructor(
    private numberPipe: DecimalPipe,
    private caseUtil: CaseUtilService,
    private vegaLinechartService: VegaLinechartService,
    private caseRepo: CaseDevelopmentRepository
  ) { }


  ngAfterViewInit(): void {
    if (this.tooltip) {
      return;
    }

    setTimeout(() => {
      this.rollingChart = this.caseRepo.getCasesDevelopmentForAggLevelSingle(
        this.options.dataSource,
        this.options.aggregationLevel,
        this.data.id
      )
      .pipe(
        map(d => d.properties),
        mergeMap(d => this.caseUtil.extractXYForCase7DaysPer100k(d)),
        map(d => this.vegaLinechartService.compileChart(d.splice(7), {
          xAxisTitle: '',
          yAxisTitle: 'New cases per 100k / 7days',
          width: 600,
          height: 150,
          regression: {
            to: getMoment(this.options.date).toISOString(),
            from: getMoment(this.options.date).subtract(this.options.daysForTrend, 'days').toISOString()
          }
        }))
      );
    });


    setTimeout(() => {
      this.trend = this.caseUtil.getTrendForCase7DaysPer100k(this.data, this.options.date, this.options.daysForTrend)
      .pipe(
        map(d => {
          return { m: d.m, b: d.b, rotation: this.caseUtil.getRotationForTrend(d.m)};
        })
      );
    });
  }


  ngOnInit(): void {
    const refIdx = this.caseUtil.findHighestIdxWhereInsertedIsNotNull(this.data);

    this.curTimedStatus = this.caseUtil.getTimedStatusByIdx(this.data, refIdx);
    this.twentyFourHTimedStatus = this.caseUtil.getTimedStatusByIdx(this.data, refIdx - 1);
    this.seventyTwoHTimedStatus = this.caseUtil.getTimedStatusByIdx(this.data, refIdx - 3);
    this.sevenDaysTimedStatus = this.caseUtil.getTimedStatusByIdx(this.data, refIdx - 7);


    const slice = this.data.developments.slice().reverse().find(d => d.inserted);

    this.lastUpdated = slice ? slice.inserted : (this.curTimedStatus.last_updated || this.curTimedStatus.timestamp);
  }

  public getCasesPer100kInhabitants(count: number, status: RKICaseTimedStatus, addPlus: boolean = false): string {
    const v = ((count / status.population) * 100000);

    return `${v > 0 && addPlus ? '+' : ''}${this.numberPipe.transform(v, '1.0-2')}`;
  }

  public getPercentageChange(curr: number, old: number): string {
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
