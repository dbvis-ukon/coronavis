import { Injectable } from '@angular/core';
import { schemeBlues, schemeGreens } from 'd3';
import { extent, max } from 'd3-array';
import { scaleLinear, ScaleLinear, scalePow, ScalePower, scaleQuantize, scaleThreshold } from 'd3-scale';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { CovidNumberCaseChange, CovidNumberCaseOptions } from '../map/options/covid-number-case-options';
import { RKICaseDevelopmentProperties } from '../repositories/types/in/quantitative-rki-case-development';
import { CaseUtilService } from './case-util.service';

export interface ColorMapBin {
  color: string;

  min: number;

  max: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethColormapService {

  private unavailableColor = '#70929c';

  private caseChoroplethColorMap = scaleQuantize<string>()
    .domain([-1, 1])
    .range([...schemeGreens[8].slice(0, 7).reverse(), '#fff', ...schemeBlues[8].slice(0, 7)]);

  private lockDownColorMap = scaleThreshold<number, string>()
    .domain([
      0,
      0.000000000000000001,
      8.75 / 100000,
      17.5 / 100000,
      26.25 / 100000,
      35 / 100000,
      40 / 100000,
      45 / 100000,
      50 / 100000,
      100 / 100000,
      150 / 100000,
      200 / 100000,
      350 / 100000,
      500 / 100000,
      650 / 100000
    ])
    .range([
      '#ffffff', // < 0 mostly unused
      '#fefefe', // < ~0
      '#fee6ce', // < 8.75
      '#ffc499', // < 17.5
      '#ffa666', // < 26.25
      '#ff8833', // < 35
      '#fe5501', // < 40
      '#e44d01', // < 45
      '#cb4401', // < 50
      '#B80087', // < 100
      '#990070', // < 150
      '#66004b', // < 200
      '#4d4d4d', // < 300
      '#333333', // < 400
      '#000000'  // < 500
    ]);



  constructor(private caseUtil: CaseUtilService) { }

  private getColorMap(options: CovidNumberCaseOptions) {
    return this.caseUtil.isLockdownMode(options) ? this.lockDownColorMap : this.caseChoroplethColorMap;
  }

  getUnavailableColor(): string {
    return this.unavailableColor;
  }

  getColorMapBins(
    options: CovidNumberCaseOptions,
    scaleFn?: ScaleLinear<number, number> | ScalePower<number, number>,
    onlyFullNumbers: boolean = false,
    dataExtent: [number, number] = null
  ): ColorMapBin[] {
    return this.getColorMap(options).range()
    .map(color => {
      const ext = this.getColorMap(options).invertExtent(color);

      const min = scaleFn ? scaleFn.invert(ext[0]) : ext[0];
      const max1 = scaleFn ? scaleFn.invert(ext[1]) : ext[1];

      return {
        color,
        min,
        max: max1
      } as ColorMapBin;
    })
    // filter out all bins not in the extent
    .filter(b => {
      if (!dataExtent) {
        return true;
      }

      return b.max >= dataExtent[0] && b.min <= dataExtent[1];
    })
    // clamp the bins to the actual numbers
    .map((b, i, arr) => {
      if (!dataExtent) {
        return b;
      }

      if (i === 0) {
        return {
          color: b.color,

          min: dataExtent[0],

          max: b.max
        } as ColorMapBin;
      }

      if (i === (arr.length - 1)) {
        return {
          color: b.color,

          min: b.min,

          max: dataExtent[1]
        } as ColorMapBin;
      }

      return b;
    })
    // filter out bins that do not capture a full number
    .filter(b => {
      if (!onlyFullNumbers) {
        return true;
      }

      const minFull = Math.ceil(b.min);
      const maxFull = Math.floor(b.max);

      return (minFull >= b.min && minFull <= b.max) || (maxFull <= b.max && maxFull >= b.min);
    })
    // round bin limits to full numbers
    .map((b, i, arr) => {
      if (!onlyFullNumbers) {
        return b;
      }

      const max1 = i > 0 && i < arr.length - 1 ? Math.round(b.max) - 1 : Math.round(b.max);

      return {
        color: b.color,
        min: Math.round(b.min),
        max: max1
      } as ColorMapBin;
    })
    // filter out double bins
    .filter((b, i, arr) => {
      if (i === 0) {
        return true;
      }

      const last = arr[i - 1];

      if (onlyFullNumbers && last.max === b.min) {
        return false;
      }

      return true;
    });
  }


  getColor(
    scaleFn: ScalePower<number, number> | ScaleLinear<number, number>,
    dataPoint: Feature<Geometry, RKICaseDevelopmentProperties>,
    options: CovidNumberCaseOptions
  ): string {


    if (!this.caseUtil.isInFilter(dataPoint, options)) {
      return this.unavailableColor;
    }

    const nmbr = this.getCaseNumbers(dataPoint.properties, options);
    return this.getColorMap(options)(scaleFn(nmbr));
  }

  public getDomainExtent(
    fc: FeatureCollection<Geometry, RKICaseDevelopmentProperties>,
    options: CovidNumberCaseOptions,
    actualExtent: boolean = false
  ): [number, number] {
    const cases: number[] = this.caseUtil.getCaseNumbersArray(fc, options);

    if (options.change === CovidNumberCaseChange.absolute) {
      if (actualExtent) {
        return extent<number>(cases);
      }

      if (this.caseUtil.isLockdownMode(options)) {
        return extent(this.lockDownColorMap.domain());
      }

      return [0, max<number>(cases)];
    } else {
      const [minChange, maxChange] = extent(cases.filter(d => d < Infinity));
      if (actualExtent) {
        return [minChange, maxChange];
      }
      const max1 = Math.max(Math.abs(minChange), Math.abs(maxChange));

      return [-max, max1];
    }
  }

  private getRangeExtent(options: CovidNumberCaseOptions): [number, number] {
    if (this.caseUtil.isLockdownMode(options)) {
      return extent(this.lockDownColorMap.domain());
    }
    return options.change === CovidNumberCaseChange.absolute ? [0, 1] : [-1, 1];
  }

  public getScale(fc: FeatureCollection<Geometry, RKICaseDevelopmentProperties>, options: CovidNumberCaseOptions): ScalePower<number, number> | ScaleLinear<number, number> {
    if (options.change === CovidNumberCaseChange.absolute) {

      if (this.caseUtil.isLockdownMode(options)) {
        return scaleLinear()
          .domain(this.getDomainExtent(fc, options))
          .range(this.getRangeExtent(options))
          .clamp(true);
      }

      return scalePow().exponent(0.33)
        .domain(this.getDomainExtent(fc, options))
        .range(this.getRangeExtent(options));



    } else {

      return scaleLinear()
        .domain(this.getDomainExtent(fc, options))
        .range(this.getRangeExtent(options))
        .clamp(true);
    }
  }


  public getCaseNumbers(data: RKICaseDevelopmentProperties, options: CovidNumberCaseOptions) {
    return this.caseUtil.getCaseNumbers(data, options);
  }



}
