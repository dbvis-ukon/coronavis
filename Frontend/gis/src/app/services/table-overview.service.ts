/* eslint-disable @typescript-eslint/quotes, quote-props */

import { DecimalPipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { CaseDevelopmentRepository } from '../repositories/case-development.repository';
import { RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { Region } from '../repositories/types/in/region';
import { PlusminusPipe } from '../shared/plusminus.pipe';
import { getMoment } from '../util/date-util';
import { CaseUtilService } from './case-util.service';
import { TranslationService } from './translation.service';

export interface TableOverviewData {
  lastUpdated: string;
  dataOutdated: boolean;
  title: string;

  rows: {
    title: string;
    type: CovidNumberCaseType;

    cols: {
      normalization: CovidNumberCaseNormalization;
      timeWindow: CovidNumberCaseTimeWindow;
      change: CovidNumberCaseChange;

      value: string;
      isActive: boolean;
    }[];
  }[];
}

export interface TableOverviewDataAndOptions {
  config: CovidNumberCaseOptions;
  data: TableOverviewData;
}

@Injectable({
  providedIn: 'root'
})
export class TableOverviewService {

  constructor(
    private caseRepo: CaseDevelopmentRepository,
    private caseUtil: CaseUtilService,
    private translation: TranslationService,
    private decimalPipe: DecimalPipe,
    private plusMinusPipe: PlusminusPipe
  ) {}


  compileToDataAndOptions(o: CovidNumberCaseOptions, dataRequests: Region[]): Observable<TableOverviewDataAndOptions> {
    return this.caseRepo.getCasesDevelopmentAggregated(o.dataSource, dataRequests, false, true)
    .pipe(
      map(d => {
        const data = d.properties;

        let refIdx = this.caseUtil.findHighestIdxWhereInsertedIsNotNull(data);

        // this may happen if the entity does not report any data
        // all development entries will have inserted === null
        // we fallback and take the last development
        if (refIdx === -1) {
          refIdx = data.developments.length - 1;
        }

        const states: RKICaseTimedStatus[] = [];

        for (const i of [0, 1, 3, 7]) {
          states.push(this.caseUtil.getTimedStatusByIdx(data, refIdx - i));
        }

        const slice = data.developments.slice().reverse().find(d1 => d1.inserted);

        const lastUpdated = slice ? slice.inserted : (states[0].last_updated || states[0].timestamp);

        const dataOutdated = !(getMoment(lastUpdated).isSame(getMoment('now'), 'day'));

        const rowsTemplate = [
          {
            type: CovidNumberCaseType.cases,
            title: this.translation.translate('Positiv Getestet'),
            cols: []
          },
          {
            type: CovidNumberCaseType.deaths,
            title: this.translation.translate('Todesfälle'),
            cols: []
          },
          {
            type: CovidNumberCaseType.patients,
            title: this.translation.translate('Covid-19 Patienten'),
            cols: []
          },
          {
            type: CovidNumberCaseType.patientsVentilated,
            title: this.translation.translate('Covid-19 Patienten (beatmet)'),
            cols: []
          },
          {
            type: CovidNumberCaseType.bedOccupancyPercent,
            title: this.translation.translate('Bettenauslastung'),
            cols: []
          },
        ];

        const colTemplate = [
          {
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: CovidNumberCaseTimeWindow.all,
            change: CovidNumberCaseChange.absolute,
            statesIdx: 0
          },
          {
            normalization: CovidNumberCaseNormalization.per100k,
            timeWindow: CovidNumberCaseTimeWindow.all,
            change: CovidNumberCaseChange.absolute,
            statesIdx: 0
          }
        ];

        let idx = 1;
        for (const tw of [CovidNumberCaseTimeWindow.twentyFourhours, CovidNumberCaseTimeWindow.seventyTwoHours, CovidNumberCaseTimeWindow.sevenDays]) {
          colTemplate.push({
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: tw,
            change: CovidNumberCaseChange.absolute,
            statesIdx: idx
          });

          colTemplate.push({
            normalization: CovidNumberCaseNormalization.per100k,
            timeWindow: tw,
            change: CovidNumberCaseChange.absolute,
            statesIdx: idx
          });

          colTemplate.push({
            normalization: CovidNumberCaseNormalization.absolut,
            timeWindow: tw,
            change: CovidNumberCaseChange.relative,
            statesIdx: idx
          });
          idx++;
        }

        // fill values

        const nowState = states[0];
        for (const row of rowsTemplate) {
          const nowVal = this.caseUtil.getTypeAccessorFn(row.type)(nowState);

          for (const col of colTemplate) {
            const oldState = states[col.statesIdx];

            let oldVal: number;
            if (col.timeWindow !== CovidNumberCaseTimeWindow.all) {
              oldVal = this.caseUtil.getTypeAccessorFn(row.type)(oldState);
            }

            let retVal: string;
            if (col.change === CovidNumberCaseChange.absolute) {
              const diff = nowVal - (oldVal || 0);

              if (col.normalization === CovidNumberCaseNormalization.per100k) {
                retVal = '('+this.getCasesPer100kInhabitants(diff, nowState.population, col.timeWindow !== CovidNumberCaseTimeWindow.all)+'/100k)';
              } else {
                retVal = col.timeWindow === CovidNumberCaseTimeWindow.all ? this.decimalPipe.transform(diff) : this.plusMinusPipe.transform(diff);
              }
            } else {
              // implies relative, also implies timeWindow !== all
              retVal = '('+this.getPercentageChange(nowVal, oldVal)+')';
            }

            if (row.type === CovidNumberCaseType.bedOccupancyPercent) {
              const propOld = (oldState.beds_occupied / oldState.beds_total) * 100;
              const propNew = (nowState.beds_occupied / nowState.beds_total) * 100;


              if (col.timeWindow === CovidNumberCaseTimeWindow.all) {
                retVal = nowState.beds_occupied+'/'+nowState.beds_total;

                if (col.normalization === CovidNumberCaseNormalization.per100k) {
                  retVal = '('+this.decimalPipe.transform(propNew, '1.0-1')+'%)';
                }
              } else {
                if (col.change === CovidNumberCaseChange.absolute) {
                  retVal = this.plusMinusPipe.transform(nowState.beds_occupied - oldState.beds_occupied) + '/' + this.plusMinusPipe.transform(nowState.beds_total - oldState.beds_total);
                } else {
                  retVal = '('+this.plusMinusPipe.transform(propNew - propOld, '1.0-1')+'%)';
                }

                if (col.normalization === CovidNumberCaseNormalization.per100k) {
                  retVal = '';
                }
              }
            }

            row.cols.push({...col, value: retVal, isActive: this.isActive(o, row, col)});
          }
        }

        const ret: TableOverviewData = {
          lastUpdated,
          dataOutdated,
          title: dataRequests.map(r => (r.description ? r.description + ' ' : '') + r.name).join(', '),
          rows: rowsTemplate
        };

        return {config: o, data: ret};
      })
    );
  }

  private getPercentageChange(curr: number, old: number): string {
    if (curr === old) {
      return '0%';
    }
    const change = ((curr - old) / old) * 100;
    if (change === Infinity) {
      return ('war 0');
    }
    return `${change > 0 ? '+' : ''}${this.decimalPipe.transform(change, '1.0-1')}%`;
  }

  private getCasesPer100kInhabitants(count: number, population: number, addPlus: boolean = false): string {
    const v = ((count / population) * 100000);

    return `${v > 0 && addPlus ? '+' : ''}${this.decimalPipe.transform(v, '1.0-2')}`;
  }

  private isActive(o: CovidNumberCaseOptions, row: {type: CovidNumberCaseType}, col: {
    normalization: CovidNumberCaseNormalization;
    timeWindow: CovidNumberCaseTimeWindow;
    change: CovidNumberCaseChange;
  }): boolean {
    return o.type === row.type && o.change === col.change && o.normalization === col.normalization && o.timeWindow === col.timeWindow;
  }


}
