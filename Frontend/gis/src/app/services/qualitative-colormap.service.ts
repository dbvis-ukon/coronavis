import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import { getLatest } from '../util/timestamped-value';
import { BedStatusSummary } from './types/bed-status-summary';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { BedType } from '../map/options/bed-type.enum';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';

@Injectable({
  providedIn: 'root'
})
export class QualitativeColormapService {
  constructor() {
  }

  public static CChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[8].slice(0, 7).reverse(), '#fff', ...d3.schemeBlues[8].slice(0, 7)]);

  public static bedStatusColors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];
  public static bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar', 'Keine Information'];

  public static BedStatusColor = d3.scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(QualitativeColormapService.bedStatusColors)
      .interpolate(d3.interpolateRgb.gamma(2.2));


  private singleHospitalCM = d3.scaleOrdinal<string, string>()
    .domain(QualitativeColormapService.bedStati)
    .range([...QualitativeColormapService.bedStatusColors, "#c2cbd4", "#bbb"]);
  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
    return this.singleHospitalCM;
  }

  private caseChoroplethColorMap = d3.scaleQuantize<string>()
    .domain([-1, 1])
    .range([...d3.schemeGreens[8].slice(0, 7).reverse(), '#fff', ...d3.schemeBlues[8].slice(0, 7)]);
  getChoroplethCaseColor(normalizedDiff: number): string {
    return this.caseChoroplethColorMap(normalizedDiff);
  }

  private getMinScore(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;

    return v + b + a;
  }

  private getMaxScore(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;

    return (v + b + a) * 3;
  }

  private getScore(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;

    return (v + b * 2 + a * 3); // / ((v + b + a) * 3);
  }

  private notAvailable(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;
    const n = d["Nicht verfügbar"] || 0;

    return v === 0 && b === 0 && a === 0 && n > 0;
  }

  private noInformation(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;
    const n = d["Nicht verfügbar"] || 0;

    return v === 0 && b === 0 && a === 0 && n == 0;
  }

  private continousColorMap = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(QualitativeColormapService.bedStatusColors)
    .interpolate(d3.interpolateRgb.gamma(2.2));

    public propertyAccessor(type: BedType) {
      switch (type) {
        case BedType.ecmo:
          return (a: QualitativeTimedStatus) => a.ecmo_state;
        case BedType.icuHigh:
          return (a: QualitativeTimedStatus) => a.icu_high_care;
        case BedType.icuLow:
          return (a: QualitativeTimedStatus) => a.icu_low_care;
      }
    }
  
    getLatestBedStatusColor(t: Array<QualitativeTimedStatus>, type: BedType) {
      if(!t) {
        return this.getBedStatusColor(null, this.propertyAccessor(type));
      }
      const latest = t[t.length -1];
  
      return this.getBedStatusColor(latest, this.propertyAccessor(type));
    }

  getBedStatusColor(latest: QualitativeTimedStatus, f: (d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts): string {
    if(!latest) {
      return this.singleHospitalCM("Keine Information");
    }
    const properties = f(latest);

    const score = this.getScore(properties);
    const minScore = this.getMinScore(properties);
    const maxScore = this.getMaxScore(properties);

    const minMaxNormValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const normalizeValues = d3.scaleQuantize()
      .domain([minScore, maxScore])
      .range(minMaxNormValues);

    if (this.noInformation(properties)) {
      return this.singleHospitalCM("Keine Information");
    }
    if (this.notAvailable(properties)) {
      return this.singleHospitalCM("Nicht verfügbar");
    }
    return this.continousColorMap(normalizeValues(score));
  }

}
