import { Injectable } from '@angular/core';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { Moment } from 'moment';
import { Observable, of } from 'rxjs';
import { filter, flatMap, map, toArray } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { getMoment } from '../util/date-util';
import { linearRegression } from '../util/regression';

@Injectable({
  providedIn: 'root'
})
export class CaseUtilService {

  private rotationScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-5, 5])
  .range([45, -45])
  .clamp(true);

  constructor() { }

  public isLockdownMode(options: CovidNumberCaseOptions) {
    return options.normalization === CovidNumberCaseNormalization.per100k
    && options.timeWindow === CovidNumberCaseTimeWindow.sevenDays
    && options.type === CovidNumberCaseType.cases;
  }


  public getTimedStatus(data: RKICaseDevelopmentProperties, date: Moment): RKICaseTimedStatus | undefined {
    const dateKey = date.format('YYYY-MM-DD');

    return data.developmentDays[dateKey];
  }

  public getTimedStatusWithOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): RKICaseTimedStatus | undefined {
    return this.getTimedStatus(data, getMoment(options.date));
  }

  public getNowPrevTimedStatusTupleWithOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    return this.getNowPrevTimedStatusTuple(data, options.date, options.timeWindow);
  }

  public getNowPrevTimedStatusTuple(data: RKICaseDevelopmentProperties, refDateStr: string, timeWindow: CovidNumberCaseTimeWindow): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    const dateRef = getMoment(refDateStr);
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

        if(currentTimedStatus.cases7_per_100k && options.timeWindow === CovidNumberCaseTimeWindow.sevenDays && options.normalization === CovidNumberCaseNormalization.per100k) {
          unnormalizedResult = (currentTimedStatus.cases7_per_100k / 100000) * currentTimedStatus.population;
        }
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

  public extractXYForCase7DaysPer100k(data: RKICaseDevelopmentProperties) {
    return of(data)
    .pipe(
      flatMap(d => d.developments),
      filter((_, i) => i >= 7),
      map(d => {
        const t = this.getNowPrevTimedStatusTuple(data, getMoment(d.timestamp).format('YYYY-MM-DD'), CovidNumberCaseTimeWindow.sevenDays);
        return {
          x: d.timestamp, 
          y: t[0].cases7_per_100k || (t[0].cases_per_100k - t[1].cases_per_100k)};}),
      toArray()
    );
  }

  public getTrendForCase7DaysPer100k(data: RKICaseDevelopmentProperties, date: string, lastNItems: number): Observable<{m: number, b: number}> {
    const refDate = getMoment(date);

    return this.extractXYForCase7DaysPer100k(data)
    .pipe(
      map(d => {
        const myXY = d
          .filter(d => getMoment(d.x).isSameOrBefore(refDate))
          .filter((_, i, n) => i >= (n.length - lastNItems))
          .map((d1, i) => {return {x: i, y: d1.y}});

        return linearRegression(myXY);
      })
    )
  }

  public getRotationForTrend(m: number): number {
    return this.rotationScale(m);
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
