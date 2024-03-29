import { Injectable } from '@angular/core';
import { ScaleLinear, scaleLinear } from 'd3-scale';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { DateTime } from 'luxon';
import { Observable, of } from 'rxjs';
import { filter, map, mergeMap, toArray } from 'rxjs/operators';
import { CovidChartOptions } from '../cases-dod/covid-chart-options';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { StatusWithCache } from '../map/overlays/case-trend-canvas.layer';
import { AggregatedRKICaseDevelopmentProperties, RKIAgeGroups, RKICaseDevelopmentProperties, RKICaseTimedStatus, SurvStatAgeGroups } from '../repositories/types/in/quantitative-rki-case-development';
import { getDateTime, getStrDate } from '../util/date-util';
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

  /**
   * Checks data across various options.
   *
   * @param dataPoint the feature
   * @param options case options
   * @returns true iff DP is in all filters; false otherwise
   */
  public isInFilter(dataPoint: Feature<Geometry, RKICaseDevelopmentProperties>, options: CovidNumberCaseOptions): boolean {
    if (this.isLockdownMode(options)) {
      const status = this.getTimedStatusWithOptions(dataPoint.properties, options) as StatusWithCache;
      if (options.dataSource === 'risklayer' && options.showOnlyAvailableCounties === true) {
        if (!status.last_updated) {
          return false;
        }
      }

      if (this.isEBrakeMode(options) && !this.isEBrakeOver(dataPoint, options)) {
        return false;
      }

      if (status?._regression && options.trendRange?.length > 0 && (options.trendRange[0] > status._regression.m || options.trendRange[1] < status._regression.m)) {
        return false;
      }
    }


    const nmbr = this.getCaseNumbers(dataPoint.properties, options);
    if (!this.isHoveredOrSelectedBin(options, nmbr)) {
      return false;
    }

    return true;
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

  public getTimedStatus(data: RKICaseDevelopmentProperties, date: DateTime, exact?: boolean): RKICaseTimedStatus | undefined {
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
    return this.getTimedStatus(data, getDateTime(options.date));
  }

  public getNowPrevTimedStatusTuple(data: RKICaseDevelopmentProperties, refDateStr: string, timeWindow: CovidNumberCaseTimeWindow): [RKICaseTimedStatus | undefined, RKICaseTimedStatus | undefined] {
    const dateRef = getDateTime(refDateStr);
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
        prevTimedStatus = this.getTimedStatus(data, dateRef.minus({days: 1}));
        break;
      case CovidNumberCaseTimeWindow.seventyTwoHours:
        prevTimedStatus = this.getTimedStatus(data, dateRef.minus({days: 3}));
        break;
      case CovidNumberCaseTimeWindow.sevenDays:
        prevTimedStatus = this.getTimedStatus(data, dateRef.minus({days: 7}));
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

    const t = this.getTimedStatus(f.properties, getDateTime(options.date));

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

  public extractXYByOptions(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions, region_suffix?: string): Observable<{x: string; y: number; y2: number; region: string}[]> {
    return of(data)
    .pipe(
      mergeMap(d1 => d1.developments),
      filter(d => d.inserted !== null && d.inserted !== undefined),
      map(d => {
        const x = getStrDate(getDateTime(d.timestamp));
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

        let region = (data.description ? data.description + ' ' : '') + data.name;
        if (region_suffix) {
          region += ' ' + region_suffix;
        }
        return {
          x,
          y,
          y2,
          region
        };
      }),
      toArray()
    );
  }

  public getTrendForCase7DaysPer100k(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions): Observable<{m: number; b: number}> {
    const refDate = getDateTime(options.date);

    return this.extractXYByOptions(data, options)
    .pipe(
      map(d => {
        const myXY = d
          .filter(d1 => getDateTime(d1.x).startOf('day') <= refDate.startOf('day') && d1.y !== null && d1.y !== undefined)
          .filter((_, i, n) => i >= (n.length - options.daysForTrend))
          .map((d1, i) => ({x: i, y: d1.y}));

        return linearRegression(myXY);
      })
    );
  }

  public getRotationForTrend(m: number): number {
    return this.rotationScale(m);
  }

  /**
   * This function calculates the from, to parameters for the API based on the options.
   * For example: If the reference date from the options is 2021-09-19 the to parameter will be 2021-09-20.
   * The from parameter will be calculated by 2021-09-19 - daysForTrend - daysThreshold - fromAdditionalThreshold
   *
   * @param mo the options
   * @returns an array with two strings representing the from and to date
   */
   public getFromToTupleFromOptions(mo: CovidNumberCaseOptions): [string, string] {
    const refDate = getDateTime(mo.date);

    const to = getStrDate(refDate.plus({days: 1}));

    const from = getStrDate(refDate.minus({days: this.timeWindowToNumberOfDays(mo.timeWindow) + mo.daysForTrend + 2}));

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

  public addTotalRow(input: RKIAgeGroups, normalization: CovidNumberCaseNormalization): RKIAgeGroups {
    if (normalization === CovidNumberCaseNormalization.per100k) {
      const total = Object.entries(input).reduce((agg, val) => agg + val[1], 0);
      const out = {...input};
      out.Total = total;
      return out;
    } else {
      return {...input};
    }
  }

  public groupAgeStatus(input: SurvStatAgeGroups, ageGroups?: [number, number][], normalization?: CovidNumberCaseNormalization): {[key: string]: number} | SurvStatAgeGroups {
    if (!ageGroups) {
      if (normalization === CovidNumberCaseNormalization.per100k) {
        const total = Object.entries(input).reduce((agg, val) => agg + val[1], 0);
        const output = {...input};
        output.Total = total;
        return output;
      } else {
        return input;
      }
    }

    const out: {[key: string]: number} = {};


    for (const a of ageGroups) {
      let sum = 0;
      for (let i = a[0]; i <= a[1]; i++) {
        const val = input[this.getAgeGroupKey(i)] || 0;
        sum += val;
      }
      let newkey = this.getAgeGroupKey(a[0]) + '-' + this.getAgeGroupKey(a[1]).substring(1);
      if (a[0] === a[1]) {
        newkey = this.getAgeGroupKey(a[0]);
      }

      out[newkey] = sum;
    }

    let sumTotal = 0;
    for (const k of Object.keys(input)) {
      sumTotal += input[k] || 0;
    }
    if (normalization === CovidNumberCaseNormalization.per100k) {
      out.Total = sumTotal;
    }

    return out;
  }

    /**
     * Translates the timeWindow option to the number of days that need to be looked into the past to calculate differences.
     *
     * @param timeWindow the time window option
     * @returns the number of days that need to be looked into the past
     */
    public timeWindowToNumberOfDays(timeWindow: CovidNumberCaseTimeWindow): number {
      switch(timeWindow) {
        case CovidNumberCaseTimeWindow.all:
          return 0;

        case CovidNumberCaseTimeWindow.twentyFourhours:
          return 1;

        case CovidNumberCaseTimeWindow.seventyTwoHours:
          return 3;

        case CovidNumberCaseTimeWindow.sevenDays:
          return 7;

        default:
          throw Error(`${timeWindow} is not known`);
      }
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

      case CovidNumberCaseType.bedsFree:
        typeAccessor = d => d?.beds_free;
        break;

      case CovidNumberCaseType.bedsOccupied:
        typeAccessor = d => d?.beds_occupied;
        break;

      case CovidNumberCaseType.bedsTotal:
        typeAccessor = d => d?.beds_total;
        break;

      default:
        throw new Error(`unknown type ${type}`);
    }

    return typeAccessor;
  }

  getChartTitle(c: CovidChartOptions, titleRegions?: string[], short = false): string {
    const str = [];

    switch(c.type) {
      case CovidNumberCaseType.cases:
        str.push(this.translation.translate('Positiv getestete'));
        break;

      case CovidNumberCaseType.deaths:
        str.push(this.translation.translate('Todesfälle'));
        break;

      case CovidNumberCaseType.patients:
        str.push(this.translation.translate('Covid-19 Intensivpatient:innen'));
        break;

      case CovidNumberCaseType.patientsVentilated:
        str.push(this.translation.translate('Covid-19 Intensivpatient:innen (invasiv beatmet)'));
        break;

      case CovidNumberCaseType.bedOccupancyPercent:
        str.push(this.translation.translate('Bettenauslastung (%)'));
        break;

      case CovidNumberCaseType.bedOccupancy:
        str.push(this.translation.translate('Bettenauslastung'));
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

      case CovidNumberCaseTimeWindow.seventyTwoHours:
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
