import { Injectable } from '@angular/core';
import { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';
import { QualitativeAggregatedBedStateCounts } from '../repositories/types/in/qualitative-aggregated-bed-states';
import { QualitativeTimedStatus } from '../repositories/types/in/qualitative-hospitals-development';
import { AggregatedHospitalOut } from '../repositories/types/out/aggregated-hospital-out';
import { QuantitativeTimedStatus } from '../repositories/types/out/quantitative-timed-status';
import { SingleHospitalOut } from '../repositories/types/out/single-hospital-out';

@Injectable({
  providedIn: 'root'
})
export class HospitalUtilService {

  constructor() { }

  public isSingleHospitalFeatureCollection(fc: FeatureCollection<Point, SingleHospitalOut<any>> | FeatureCollection<MultiPolygon, AggregatedHospitalOut<any>>): fc is FeatureCollection<Point, SingleHospitalOut<any>> {
    return this.isSingleHospitalFeature(fc.features[0]);
  }

  public isSingleHospitalFeature(hf: Feature<Point, SingleHospitalOut<any>> | Feature<MultiPolygon, AggregatedHospitalOut<any>>): hf is Feature<Point, SingleHospitalOut<any>> {
    return this.isSingleHospital(hf.properties);
  }

  public isSingleHospital(hospital: SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus> | AggregatedHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus>): hospital is SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus> {
    return (hospital as SingleHospitalOut<QualitativeTimedStatus | QuantitativeTimedStatus>).address !== undefined;
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

  public getLatestTimedStatus<T extends QualitativeTimedStatus | QuantitativeTimedStatus>(entries: Array<T>): T | null {
    if(!entries) {
      return null;
    }
    const last = entries[entries.length - 1];
    return last;
  }
}
