import { Injectable } from '@angular/core';
import moment, { Moment } from 'moment';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';

@Injectable({
  providedIn: 'root'
})
export class CaseUtilService {

  constructor() { }


  public getTimedStatus(data: RKICaseDevelopmentProperties, date: Moment): RKICaseTimedStatus | undefined {
    const dateKey = date.format('YYYY-MM-DD');

    return data.developmentDays[dateKey];
  }

  public getTimedStatusWithOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): RKICaseTimedStatus | undefined {
    return this.getTimedStatus(data, options.date === 'now' ? moment() : moment(options.date));
  }

  public getNowPrevTimedStatusTupleWithOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    return this.getNowPrevTimedStatusTuple(data, options.date, options.timeWindow);
  }

  public getNowPrevTimedStatusTuple(data: RKICaseDevelopmentProperties, refDateStr: string, timeWindow: CovidNumberCaseTimeWindow): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    const dateRef = refDateStr === 'now' ? moment() : moment(refDateStr);
    const currentTimedStatus = this.getTimedStatus(data, dateRef);

    let prevTimedStatus;
    switch (timeWindow) {
      case CovidNumberCaseTimeWindow.all:
        prevTimedStatus = undefined;
        break;
      case CovidNumberCaseTimeWindow.twentyFourhours:
        prevTimedStatus = this.getTimedStatus(data, dateRef.subtract(1, 'day'));
        break;
      case CovidNumberCaseTimeWindow.seventyTwoHours:
        prevTimedStatus = this.getTimedStatus(data, dateRef.subtract(3, 'days'));
        break;
      case CovidNumberCaseTimeWindow.sevenDays:
        prevTimedStatus = this.getTimedStatus(data, dateRef.subtract(7, 'days'));
        break;
    }

    return [currentTimedStatus, prevTimedStatus];
  }

  public getCaseNumbers(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): number {
    let typeAccessor = this.getTypeAccessorFnWithOptions(options);

    const [currentTimedStatus, prevTimedStatus] = this.getNowPrevTimedStatusTupleWithOptions(data, options);

    if(!currentTimedStatus) {
      return undefined;
    }


    const prev = typeAccessor(prevTimedStatus);
    const now = typeAccessor(currentTimedStatus);

    let unnormalizedResult = 0;
    if (options.change === CovidNumberCaseChange.absolute) {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        unnormalizedResult = now;
      } else {
        if(!prevTimedStatus) {
          return undefined;
        }
        unnormalizedResult = now - prev;
      }
    } else {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      if(!prevTimedStatus) {
        return undefined;
      }
      unnormalizedResult = ((now - prev) / prev) * 100 || 0;
    }

    return options.normalization === CovidNumberCaseNormalization.absolut ?
      unnormalizedResult :
      unnormalizedResult / currentTimedStatus.population;
  }

  getTypeAccessorFnWithOptions(options: CovidNumberCaseOptions): (d: RKICaseTimedStatus) => number | undefined {
    return this.getTypeAccessorFn(options.type);
  }

  getTypeAccessorFn(type: CovidNumberCaseType): (d: RKICaseTimedStatus) => number | undefined {
    let typeAccessor: (d: RKICaseTimedStatus) => number;

    switch (type) {
      case CovidNumberCaseType.cases:
        typeAccessor = d => d?.cases;
        break;
      case CovidNumberCaseType.deaths:
        typeAccessor = d => d?.deaths;
        break;
    }

    return typeAccessor;
  }
}
