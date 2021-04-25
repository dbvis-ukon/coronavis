import { Injectable } from '@angular/core';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { Moment } from 'moment';
import { Observable, of } from 'rxjs';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { AggregatedRKICaseDevelopmentProperties, RKICaseDevelopmentProperties, RKICaseTimedStatus, SurvStatAgeGroups } from '../repositories/types/in/quantitative-rki-case-development';
import { getMoment, getStrDate } from '../util/date-util';
import { linearRegression } from '../util/regression';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class CaseUtilService {

  private rotationScale: ScaleLinear<number, number> = scaleLinear()
  .domain([-5, 5])
  .range([45, -45])
  .clamp(true);

  constructor(private translation: TranslationService) { }

  public isLockdownMode(options: CovidNumberCaseOptions) {
    return options.normalization === CovidNumberCaseNormalization.per100k
    && options.timeWindow === CovidNumberCaseTimeWindow.sevenDays
    && options.type === CovidNumberCaseType.cases;
  }

  public findHighestIdxWhereInsertedIsNotNull(data: RKICaseDevelopmentProperties | AggregatedRKICaseDevelopmentProperties): number {
    for (let i = data.developments.length - 1; i >= 0; i--) {
      if (data.developments[i].inserted) {
        return i;
      }
    }

    return -1;
  }

  public getTimedStatusByIdx(data: RKICaseDevelopmentProperties | AggregatedRKICaseDevelopmentProperties, idx: number): RKICaseTimedStatus | undefined {
    if (idx < 0 && idx >= data.developments.length) {
      return undefined;
    }

    return data?.developments[idx];
  }

  public getTimedStatus(data: RKICaseDevelopmentProperties, date: Moment, exact?: boolean): RKICaseTimedStatus | undefined {
    const dateKey = getStrDate(date);

    const timedStatus = data.developmentDays[dateKey];

    if (timedStatus) {
      return timedStatus;
    }

    if (exact && !timedStatus) {
      throw new Error(`Cannot find timed status for ${date} in ${data}`);
    }

    // return last available data
    return data.developments[data.developments.length - 1];
  }

  public getTimedStatusWithOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): RKICaseTimedStatus | undefined {
    return this.getTimedStatus(data, getMoment(options.date));
  }

  public getNowPrevTimedStatusTuple(data: RKICaseDevelopmentProperties, refDateStr: string, timeWindow: CovidNumberCaseTimeWindow): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    const dateRef = getMoment(refDateStr);
    let currentTimedStatus = this.getTimedStatus(data, dateRef);

    if (currentTimedStatus.inserted === undefined || currentTimedStatus.inserted === null) {
      const idx = this.findHighestIdxWhereInsertedIsNotNull(data);
      currentTimedStatus = this.getTimedStatusByIdx(data, idx);
    }

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

  public isEBreakModePossible(options: CovidNumberCaseOptions): boolean {
    return this.isLockdownMode(options) && options.dataSource === 'rki' && options.aggregationLevel === AggregationLevel.county;
  }

  public isEBrakeMode(options: CovidNumberCaseOptions): boolean {
    return this.isEBreakModePossible(options) && options.eBrakeOver > 0;
  }

  public isEBrakeOver(f: Feature<Geometry, RKICaseDevelopmentProperties>, options: CovidNumberCaseOptions): boolean {
    if (!options.eBrakeOver || options.eBrakeOver < 0) {
      throw new Error(`Invalid threshold ${options.eBrakeOver}`);
    }

    const t = this.getTimedStatus(f.properties, getMoment(options.date));

    switch(options.eBrakeOver) {
      case 100:
        return t.ebrake100 === true;

      case 165:
        return t.ebrake165 === true;

      default:
        throw new Error(`Invalid eBrakeOver ${options.eBrakeOver}`);
    }
  }

  public getCaseNumbers(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions, refDate?: string): number {
    if (!refDate) {
      refDate = options.date;
    }

    const typeAccessor = this.getTypeAccessorFnWithOptions(options);

    const [currentTimedStatus, prevTimedStatus] = this.getNowPrevTimedStatusTuple(data, refDate, options.timeWindow);

    if (!currentTimedStatus) {
      return undefined;
    }


    const prev = typeAccessor(prevTimedStatus);
    const now = typeAccessor(currentTimedStatus);

    if (!now) {
      return undefined;
    }

    let unnormalizedResult = null;
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
      unnormalizedResult = ((now - prev) / prev) * 100;
    }

    return options.normalization === CovidNumberCaseNormalization.absolut ?
      unnormalizedResult :
      unnormalizedResult / currentTimedStatus.population;
  }

  public extractXYByOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): Observable<{x: string; y: number; y2: number; region: string}[]> {
    return of(data)
    .pipe(
      mergeMap(d1 => d1.developments),
      filter(d => d.inserted !== null && d.inserted !== undefined),
      map(d => {
        const x = getStrDate(getMoment(d.timestamp));
        let y: number = null;

        if (
          options.normalization === CovidNumberCaseNormalization.per100k
          && options.timeWindow === CovidNumberCaseTimeWindow.sevenDays
          && options.type === CovidNumberCaseType.cases
          && d.cases7_per_100k) {
            y = d.cases7_per_100k;
        } else {
          // do it manually
          y = this.getCaseNumbers(data, options, x);

          if (options.normalization === CovidNumberCaseNormalization.per100k) {
            y *= 100000;
          }
        }

        let y2 = this.getTypeAccessorFnWithOptions(options)(d);

        if (options.normalization === CovidNumberCaseNormalization.per100k) {
          y2 = y2 / d.population * 100000;
        }

        return {
          x,
          y,
          y2,
          region: (data.description ? data.description + ' ' : '') + data.name
        };
      }),
      toArray()
    );
  }

  public getTrendForCase7DaysPer100k(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): Observable<{m: number; b: number}> {
    const refDate = getMoment(options.date);

    return this.extractXYByOptions(data, options)
    .pipe(
      map(d => {
        const myXY = d
          .filter(d1 => getMoment(d1.x).isSameOrBefore(refDate))
          .filter((_, i, n) => i >= (n.length - options.daysForTrend))
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

    const from = getStrDate(getMoment(to).subtract(mo.daysForTrend + 2, 'days'));

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

  public groupAgeStatus(input: SurvStatAgeGroups, ageGroups?: [number, number][]): any {
    if (!ageGroups) {
      return input;
    }

    const out = {};

    for (const a of ageGroups) {
      let sum = 0;
      for (let i = a[0]; i <= a[1]; i++) {
        sum += input[this.getAgeGroupKey(i)] || 0;
      }
      let newkey = this.getAgeGroupKey(a[0]) + '-' + this.getAgeGroupKey(a[1]).substring(1);
      if (a[0] === a[1]) {
        newkey = this.getAgeGroupKey(a[0]);
      }

      out[newkey] = sum;
    }

    return out;
  }

  private getAgeGroupKey(age: number): string {
    if (age < 0) {
      throw new Error('age ' + age + ' out of bounds');
    }

    if (age >= 80) {
      return 'A80plus';
    }

    if (age < 10) {
      return 'A0' + age;
    }

    return 'A' + age;
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

      case CovidNumberCaseType.patients:
        typeAccessor = d => d?.cases_covid;
        break;

      case CovidNumberCaseType.patientsVentilated:
        typeAccessor = d => d?.cases_covid_ventilated;
        break;

      case CovidNumberCaseType.bedOccupancyPercent:
        typeAccessor = d => (d?.beds_occupied / d?.beds_total) * 100;
        break;
    }

    return typeAccessor;
  }

  getChartTitle(c: CovidChartOptions, titleRegions?: string[], short: boolean = false): string {
    const str = [];

    switch(c.type) {
      case CovidNumberCaseType.cases:
        str.push(this.translation.translate('Positiv getestete'));
        break;

      case CovidNumberCaseType.deaths:
        str.push(this.translation.translate('Todesfälle'));
        break;

      case CovidNumberCaseType.patients:
        str.push(this.translation.translate('Covid-19 Patienten'));
        break;

      case CovidNumberCaseType.patientsVentilated:
        str.push(this.translation.translate('Covid-19 Patienten (beatmet)'));
        break;

      case CovidNumberCaseType.bedOccupancyPercent:
        str.push(this.translation.translate('Bettenauslastung (%)'));
        break;
    }

    if (c.ageGroupBinning) {
      str.push(this.translation.translate('nach Altersgruppen'));
    }

    if (titleRegions && titleRegions.length > 0) {
      str.push(this.translation.translate('für'));
      str.push(titleRegions.join(', '));
    }

    if (c.timeWindow !== CovidNumberCaseTimeWindow.all) {
      str.push(this.translation.translate('innerhalb'));
    }

    switch(c.timeWindow) {
      case CovidNumberCaseTimeWindow.twentyFourhours:
        str.push(this.translation.translate(short ? '24h' : '24 Std'));
        break;

      case CovidNumberCaseTimeWindow.twentyFourhours:
        str.push(this.translation.translate(short ? '72h' : '72 Std'));
        break;

      case CovidNumberCaseTimeWindow.sevenDays:
        str.push(this.translation.translate(short ? '7T' : '7 Tage'));
        break;
    }

    if (c.normalization === CovidNumberCaseNormalization.per100k) {
        str.push(this.translation.translate(short ? '/100k' : 'pro 100k Einwohner'));
    }

    return str.join(' ');
  }
}
