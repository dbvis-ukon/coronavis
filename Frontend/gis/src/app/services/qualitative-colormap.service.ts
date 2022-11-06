import { Injectable } from '@angular/core';
import { interpolateRgb, scaleOrdinal, scaleQuantize } from 'd3';
import { scaleLinear } from 'd3-scale';
import { BedType } from '../map/options/bed-type.enum';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AbstractHospitalOut } from '../repositories/types/out/abstract-hospital-out';
import { getDateTime, getStrDate } from '../util/date-util';
import { HospitalUtilService } from './hospital-util.service';

@Injectable({
  providedIn: 'root'
})
export class QualitativeColormapService {
  constructor(
    private hospitalUtil: HospitalUtilService
  ) {
  }

  public static bedStatusColors = ['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)'];
  public static bedStati = ['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar', 'Keine Information'];

  public static BedStatusColor = scaleLinear<string, string>()
      .domain([0, 0.5, 1])
      .range(QualitativeColormapService.bedStatusColors)
      .interpolate(interpolateRgb.gamma(2.2));


  private singleHospitalCM = scaleOrdinal<string, string>()
    .domain(QualitativeColormapService.bedStati)
    .range([...QualitativeColormapService.bedStatusColors, '#c2cbd4', '#bbb']);

  private continousColorMap = scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(QualitativeColormapService.bedStatusColors)
    .interpolate(interpolateRgb.gamma(2.2));


  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
    return this.singleHospitalCM;
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
    const n = d['Nicht verfügbar'] || 0;

    return v === 0 && b === 0 && a === 0 && n > 0;
  }

  private noInformation(d: QualitativeAggregatedBedStateCounts) {
    const v = d.Verfügbar || 0;
    const b = d.Begrenzt || 0;
    const a = d.Ausgelastet || 0;
    const n = d['Nicht verfügbar'] || 0;

    return v === 0 && b === 0 && a === 0 && n === 0;
  }

    public propertyAccessor(type: BedType) {
      switch (type) {
        case BedType.ecmo:
          return (a: QualitativeTimedStatus) => a.ecmo_state;
        case BedType.icuHigh:
          return (a: QualitativeTimedStatus) => a.icu_high_state;
        case BedType.icuLow:
          return (a: QualitativeTimedStatus) => a.icu_low_state;
      }
    }

    getLatestBedStatusColor(p: AbstractHospitalOut<QualitativeTimedStatus>, type: BedType, date: string = 'now') {
      if (!p || !p.developments) {
        return this.getBedStatusColor(null, this.propertyAccessor(type));
      }

      const t = p.developments;

      let latest: QualitativeTimedStatus;
      if (date === null || date === 'now') {
        latest = t[t.length - 1];
      } else {
        const actualDate = getDateTime(date).endOf('day');
        const strDate = getStrDate(getDateTime(date));

        if (p?.developmentDays) {
          const status = p?.developmentDays[strDate];
          if (status) {
            return this.getBedStatusColor(status, this.propertyAccessor(type));
          }
        }

        latest = this.hospitalUtil.getLatestTimedStatus(t, actualDate);

      }

      return this.getBedStatusColor(latest, this.propertyAccessor(type));
    }

  getBedStatusColor(latest: QualitativeTimedStatus, f: (d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts): string {
    if (!latest) {
      return this.singleHospitalCM('Keine Information');
    }
    const properties = f(latest);

    if (!properties) {
      return this.singleHospitalCM('Keine Information');
    }

    const score = this.getScore(properties);
    const minScore = this.getMinScore(properties);
    const maxScore = this.getMaxScore(properties);

    const minMaxNormValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const normalizeValues = scaleQuantize()
      .domain([minScore, maxScore])
      .range(minMaxNormValues);

    if (this.noInformation(properties)) {
      return this.singleHospitalCM('Keine Information');
    }
    if (this.notAvailable(properties)) {
      return this.singleHospitalCM('Nicht verfügbar');
    }
    return this.continousColorMap(normalizeValues(score));
  }

}
