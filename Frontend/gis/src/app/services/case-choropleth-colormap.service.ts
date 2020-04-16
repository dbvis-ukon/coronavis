import { Injectable } from '@angular/core';
import { schemeBlues, schemeGreens } from 'd3';
import { extent, max } from 'd3-array';
import { scaleLinear, ScaleLinear, scalePow, ScalePower, scaleQuantize } from 'd3-scale';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { CovidNumberCaseChange, CovidNumberCaseNormalization, CovidNumberCaseOptions, CovidNumberCaseTimeWindow, CovidNumberCaseType } from '../map/options/covid-number-case-options';
import { QuantitativeAggregatedRkiCaseNumberProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { QuantitativeAggregatedRkiCasesOverTimeProperties } from './types/quantitative-aggregated-rki-cases-over-time';

export interface ColorMapBin {
  color: string;

  min: number;

  max: number;
}

@Injectable({
  providedIn: 'root'
})
export class CaseChoroplethColormapService {

  private caseChoroplethColorMap = scaleQuantize<string>()
    .domain([-1, 1])
    .range([...schemeGreens[8].slice(0, 7).reverse(), '#fff', ...schemeBlues[8].slice(0, 7)]);
  
  
  
  constructor() { }

  getColorMap() {
    return this.caseChoroplethColorMap;
  }

  getColorMapBins(
    scaleFn?: ScaleLinear<number, number> | ScalePower<number, number>,
    onlyFullNumbers: boolean = false,
    dataExtent: [number, number] = null
  ): ColorMapBin[] {
    return this.caseChoroplethColorMap.range()
    .map(color => {
      const ext = this.caseChoroplethColorMap.invertExtent(color);

      const min = scaleFn ? scaleFn.invert(ext[0]) : ext[0];
      const max = scaleFn ? scaleFn.invert(ext[1]) : ext[1];

      return {
        color: color,
        min: min,
        max: max
      } as ColorMapBin;
    })
    // filter out bins that do not capture a full number
    .filter(b => {
      if(!onlyFullNumbers) {
        return true;
      }

      const minFull = Math.ceil(b.min);
      const maxFull = Math.floor(b.max);

      return (minFull >= b.min && minFull <= b.max) || (maxFull <= b.max && maxFull >= b.min);
    })
    // round bin limits to full numbers
    .map(b => {
      if(!onlyFullNumbers) {
        return b;
      }

      return {
        color: b.color,
        min: Math.round(b.min),
        max: Math.round(b.max)
      } as ColorMapBin;
    })
    // filter out all bins not in the extent
    .filter(b => {
      if(!dataExtent) {
        return true;
      }

      return b.max >= dataExtent[0] && b.min <= dataExtent[1];
    })
    // clamp the bins to the actual numbers
    .map((b, i, arr) => {
      if(!dataExtent) {
        return b;
      }

      if(i === 0) {
        return {
          color: b.color,

          min: dataExtent[0],

          max: b.max
        } as ColorMapBin
      }

      if(i === (arr.length - 1)) {
        return {
          color: b.color,

          min: b.min,

          max: dataExtent[1]
        } as ColorMapBin
      }

      return b;
    })
  }


  getColor(
    scaleFn: ScalePower<number, number> | ScaleLinear<number, number>, 
    dataPoint: Feature<Geometry, QuantitativeAggregatedRkiCasesOverTimeProperties>, 
    options: CovidNumberCaseOptions
  ): string {
    return this.getChoroplethCaseColor(scaleFn(this.getCaseNumbers(dataPoint.properties, options)));
  }


  getChoroplethCaseColor(normalizedDiff: number): string {
    return this.caseChoroplethColorMap(normalizedDiff);
  }

  public getDomainExtent(
    fc: FeatureCollection<Geometry, QuantitativeAggregatedRkiCasesOverTimeProperties>, 
    options: CovidNumberCaseOptions,
    actualExtent: boolean = false
  ): [number, number] {
    const cases: number[] = fc.features.map(d => this.getCaseNumbers(d.properties, options));

    if(options.change === CovidNumberCaseChange.absolute) {
      if(actualExtent) {
        return extent<number>(cases);
      }
      return [0, max<number>(cases)];
    } else {
      const [minChange, maxChange] = extent(cases.filter(d => d < Infinity));
      if(actualExtent) {
        return [minChange, maxChange];
      }
      const max = Math.max(Math.abs(minChange), Math.abs(maxChange));
      return [-max, max];
    }
  }

  public getRangeExtent(options: CovidNumberCaseOptions): [number, number] {
    return options.change === CovidNumberCaseChange.absolute ? [0, 1] : [-1, 1];
  }

  public getScale(fc: FeatureCollection<Geometry, QuantitativeAggregatedRkiCasesOverTimeProperties>, options: CovidNumberCaseOptions): ScalePower<number, number> | ScaleLinear<number, number> {
    if(options.change === CovidNumberCaseChange.absolute) {

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


  public getCaseNumbers(data: QuantitativeAggregatedRkiCasesOverTimeProperties, options: CovidNumberCaseOptions): number {
    let typeAccessor: (d: QuantitativeAggregatedRkiCaseNumberProperties) => number;
    let timeAccessor: (d: QuantitativeAggregatedRkiCasesOverTimeProperties) => QuantitativeAggregatedRkiCaseNumberProperties;

    switch (options.type) {
      case CovidNumberCaseType.cases:
        typeAccessor = d => d.cases;
        break;
      case CovidNumberCaseType.deaths:
        typeAccessor = d => d.deaths;
        break;
    }

    switch (options.timeWindow) {
      case CovidNumberCaseTimeWindow.all:
        timeAccessor = d => d.last;
        break;
      case CovidNumberCaseTimeWindow.twentyFourhours:
        timeAccessor = d => d.yesterday;
        break;
      case CovidNumberCaseTimeWindow.seventyTwoHours:
        timeAccessor = d => d.threeDaysAgo;
        break;
    }


    const prev = typeAccessor(timeAccessor(data));
    const now = typeAccessor(data.last);

    let unnormalizedResult = 0;
    if (options.change === CovidNumberCaseChange.absolute) {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        unnormalizedResult = now;
      } else {
        unnormalizedResult = now - prev;
      }
    } else {
      if (options.timeWindow === CovidNumberCaseTimeWindow.all) {
        throw "Unsupported configuration -- cannot show percentage change for single value";
      }
      unnormalizedResult = ((now - prev) / prev) * 100 || 0;
    }

    return options.normalization === CovidNumberCaseNormalization.absolut ?
      unnormalizedResult :
      unnormalizedResult / data.bevoelkerung;
  }

}
