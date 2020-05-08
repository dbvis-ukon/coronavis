import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, Geometry, MultiPolygon, Point } from 'geojson';
import { filter } from 'rxjs/operators';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { AbstractTimedStatus, QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AbstractHospitalOut } from '../repositories/types/out/abstract-hospital-out';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';
import { getMoment } from '../util/date-util';

@Injectable({
  providedIn: 'root'
})
export class HospitalUtilService {

  constructor() { }

  public filterByDate(date: Date) {
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

  public getNumberOfHospitals(hospitalAgg: AggregatedHospitalOut<QualitativeTimedStatus>): number {
    const ld = this.getLatestTimedStatus(hospitalAgg.developments);
    if(!ld) {
      return 0;
    }
    
    let maxN = 0;

    for(const bedAcc of this.getBedAccessorFunctions()) {
      let sum = 0;

      const bed = bedAcc(ld);

      if(!bed) {
        continue;
      }

      for(const bedStatusAcc of this.getBedStatusAccessorFunctions()) {
        sum += bedStatusAcc(bed) || 0;
      }

      if(sum > maxN) {
        maxN = sum;
      }
    }

    return maxN;
  }

  public getBedAccessorFunctions(): ((d: QualitativeTimedStatus) => QualitativeAggregatedBedStateCounts)[] {
    return [
      (d: QualitativeTimedStatus) => d.icu_low_care,
      (d: QualitativeTimedStatus) => d.icu_high_care,
      (d: QualitativeTimedStatus) => d.ecmo_state,
    ];
  }

  public getBedStatusAccessorFunctions(): ((d: QualitativeAggregatedBedStateCounts) => number)[] {
    return [
      (d: QualitativeAggregatedBedStateCounts) => d.Verfügbar,
      (d: QualitativeAggregatedBedStateCounts) => d.Begrenzt,
      (d: QualitativeAggregatedBedStateCounts) => d.Ausgelastet,
      (d: QualitativeAggregatedBedStateCounts) => d["Nicht verfügbar"]
    ];
  }

  public getLatestTimedStatus<T extends AbstractTimedStatus>(entries: Array<T>, beforeDate?: Date): T | null {
    if(!entries) {
      return null;
    }
    
    if(beforeDate) {
      const mDate = getMoment(beforeDate).startOf('day');

      const filtered = []
      for(let i = entries.length - 1; i >= 0; i--) {
        const d = entries[i];
        const t = getMoment(d.timestamp).startOf('day');

        // console.log(t.format('YYYY-MM-DD'), mDate.format('YYYY-MM-DD'), t.isSameOrBefore(mDate), t.isSameOrAfter(mDate))

        if(t.isSameOrBefore(mDate)) {
          filtered.push(d);
          break;
        }
      }

      if(filtered.length === 0) {
        return null;
      }

      // because it is reversed with the for loop
      return filtered[0];
    }

    const last = entries[entries.length - 1];
    return last;
  }
}
