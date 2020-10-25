import { Injectable } from '@angular/core';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { FeatureCollection, Geometry } from 'geojson';
import { Moment } from 'moment';
import { Observable, of } from 'rxjs';
import { map, mergeMap, toArray } from 'rxjs/operators';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties, RKICaseTimedStatus } from '../repositories/types/in/quantitative-rki-case-development';
import { getMoment, getStrDate } from '../util/date-util';
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

  public findHighestIdxWhereLastUpdatedIsNotNull(data: RKICaseDevelopmentProperties): number {
    for (let i = data.developments.length - 1; i >= 0; i--) {
      if (data.developments[i].last_updated) {
        return i;
      }
    }

    return -1;
  }

  public getTimedStatusByIdx(data: RKICaseDevelopmentProperties, idx: number): RKICaseTimedStatus | undefined {
    if (idx < 0 && idx >= data.developments.length) {
      return undefined;
    }

    return data?.developments[idx];
  }

  public getTimedStatus(data: RKICaseDevelopmentProperties, date: Moment): RKICaseTimedStatus | undefined {
    const dateKey = getStrDate(date);

    const timedStatus = data.developmentDays[dateKey];

    if (timedStatus) {
      return timedStatus;
    }

    // return last available data
    return data.developments[data.developments.length - 1];
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

  public getCaseNumbersArray(fc: FeatureCollection<Geometry, RKICaseDevelopmentProperties>, options: CovidNumberCaseOptions): number[] {
    return fc.features.map(d => this.getCaseNumbers(d.properties, options));
  }

  public getCaseNumbers(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): number {
    const typeAccessor = this.getTypeAccessorFnWithOptions(options);

    const [currentTimedStatus, prevTimedStatus] = this.getNowPrevTimedStatusTupleWithOptions(data, options);

    if (!currentTimedStatus) {
      return undefined;
    }


    const prev = typeAccessor(prevTimedStatus);
    const now = typeAccessor(currentTimedStatus);

    let unnormalizedResult = 0;
    if (options.change === CovidNumberCaseChange.absolute) {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        unnormalizedResult = now;
      } else {
        if (!prevTimedStatus) {
          return undefined;
        }
        unnormalizedResult = now - prev;

        if (this.isLockdownMode(options)) {
          unnormalizedResult = (currentTimedStatus.cases7_per_100k / 100000) * currentTimedStatus.population;
        }
      }
    } else {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw new Error('Unsupported configuration -- cannot show percentage change for single value');
      }
      if (!prevTimedStatus) {
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
      mergeMap(d1 => d1.developments),
      // filter((_, i) => i >= data.developments.length - 7),
      map(d => {
        const t = this.getNowPrevTimedStatusTuple(data, getStrDate(getMoment(d.timestamp)), CovidNumberCaseTimeWindow.sevenDays);
        return {
          x: getStrDate(getMoment(d.timestamp)),
          y: t[0].cases7_per_100k || (t[0].cases_per_100k - t[1].cases_per_100k)}; }),
      toArray()
    );
  }

  public getTrendForCase7DaysPer100k(data: RKICaseDevelopmentProperties, date: string, lastNItems: number): Observable<{m: number, b: number}> {
    const refDate = getMoment(date);

    return this.extractXYForCase7DaysPer100k(data)
    .pipe(
      map(d => {
        const myXY = d
          .filter(d1 => getMoment(d1.x).isSameOrBefore(refDate))
          .filter((_, i, n) => i >= (n.length - lastNItems))
          .map((d1, i) => ({x: i, y: d1.y}));

        return linearRegression(myXY);
      })
    );
  }

  public getRotationForTrend(m: number): number {
    return this.rotationScale(m);
  }

  public getFromToTupleFromOptions(mo: CovidNumberCaseOptions): [string, string] {
    const to = getStrDate(getMoment(mo.date).add(1, 'day'));

    const from = getStrDate(getMoment(to).subtract(mo.daysForTrend + 1, 'days'));

    return [from, to];
  }

  public isHoverBin(opt: CovidNumberCaseOptions, nmbr: number): boolean {
    return opt._binHovered && (opt._binHovered[0] <= nmbr && opt._binHovered[1] >= nmbr);
  }

  public isSelectedBin(opt: CovidNumberCaseOptions, nmbr: number): boolean {
    return opt._binSelection && opt._binSelection.findIndex(d => d[0] <= nmbr && d[1] >= nmbr) > -1;
  }

  public isHoveredOrSelectedBin(opt: CovidNumberCaseOptions, nmbr: number): boolean {
    return (!opt._binHovered && !opt._binSelection) || this.isHoverBin(opt, nmbr) || this.isSelectedBin(opt, nmbr);
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
