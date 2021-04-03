import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon, Point } from 'geojson';
import { Moment } from 'moment';
import { filter } from 'rxjs/operators';
import { BedBackgroundOptions } from '../map/options/bed-background-options';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { AbstractTimedStatus, QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AbstractHospitalOut } from '../repositories/types/out/abstract-hospital-out';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { getMoment, getStrDate } from '../util/date-util';

@Injectable({
  providedIn: 'root'
})
export class HospitalUtilService {

  constructor() { }

  public filterByDate(date: Moment) {
    return filter<Feature<Geometry, AbstractHospitalOut<AbstractTimedStatus>>>(h => this.getLatestTimedStatus(h.properties.developments, date) !== null);
  }

  public isSingleHospitalFeatureCollection(fc: FeatureCollection<Point, SingleHospitalOut<any>> | FeatureCollection<MultiPolygon, AggregatedHospitalOut<any>>): fc is FeatureCollection<Point, SingleHospitalOut<any>> {
    return this.isSingleHospitalFeature(fc?.features[0]);
  }

  public isSingleHospitalFeature(hf: Feature<Point, SingleHospitalOut<any>> | Feature<MultiPolygon, AggregatedHospitalOut<any>>): hf is Feature<Point, SingleHospitalOut<any>> {
    return this.isSingleHospital(hf?.properties);
  }

  public isSingleHospital(hospital: SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus>): hospital is SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus> {
    return hospital !== undefined && (hospital as SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus>).address !== undefined;
  }

  public getFromToTupleFromOptions(mo: BedGlyphOptions | BedBackgroundOptions): [string, string] {
    const to = getStrDate(getMoment(mo.date).add(1, 'day'));

    const from = getStrDate(getMoment(mo.date));


    return [from, to];
  }

  public getNumberOfHospitals(hospitalAgg: AggregatedHospitalOut<QualitativeTimedStatus>): number {
    return hospitalAgg?.developments[hospitalAgg.developments.length - 1].num_hospitals;
  }

  public getBedAccessorFunctions(): ((d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts)[] {
    return [
      (d: QualitativeTimedStatus) => d.icu_low_state,
      (d: QualitativeTimedStatus) => d.icu_high_state,
      (d: QualitativeTimedStatus) => d.ecmo_state,
    ];
  }

  public getBedStatusAccessorFunctions(): ((d: QualitativeAggregatedBedStateCounts) => number)[] {
    return [
      (d: QualitativeAggregatedBedStateCounts) => d.Verfügbar,
      (d: QualitativeAggregatedBedStateCounts) => d.Begrenzt,
      (d: QualitativeAggregatedBedStateCounts) => d.Ausgelastet,
      (d: QualitativeAggregatedBedStateCounts) => d['Nicht verfügbar']
    ];
  }

  public getLatestTimedStatus<T extends AbstractTimedStatus>(entries: Array<T>, beforeDate?: Moment): T | null {
    if (!entries) {
      return null;
    }

    if (beforeDate) {
      const mDate = beforeDate.startOf('day');

      const filtered = [];
      for (let i = entries.length - 1; i >= 0; i--) {
        const d = entries[i];
        const t = getMoment(d.timestamp).startOf('day');

        if (t.isSameOrBefore(mDate)) {
          filtered.push(d);
          break;
        }
      }

      if (filtered.length === 0) {
        return null;
      }

      // because it is reversed with the for loop
      return filtered[0];
    }

    const last = entries[entries.length - 1];
    return last;
  }
}
