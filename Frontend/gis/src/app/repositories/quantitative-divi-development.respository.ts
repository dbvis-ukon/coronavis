import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { map } from 'rxjs/operators';
import { CachedRepository } from './cached.repository';
import { QuantitativeHospitalsDevelopment } from './types/in/quantitative-hospitals-development';
import { QuantitativeTimedStatus } from './types/out/quantitative-timed-status';
import { AggregatedHospitalOut } from './types/out/aggregated-hospital-out';
import { SingleHospitalOut } from './types/out/single-hospital-out';
import { MultiPolygon, FeatureCollection, Feature, Point } from 'geojson';
import { QuantitativeAggregatedHospitalProperties, QuantitativeSingleHospitalProperties } from './types/in/qualitative-hospitals-development';

@Injectable({
  providedIn: 'root'
})
export class QuantitativeDiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  private getDiviDevelopmentCounties(): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalProperties>> (`${environment.apiUrl}divi/development/landkreise`)
    .pipe(
      map(this.mapQAH)
    );
  }

  private getDiviDevelopmentGovernmentDistricts(): Observable < FeatureCollection<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>> > {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalProperties>> (`${environment.apiUrl}divi/development/regierungsbezirke`)
    .pipe(
      map(this.mapQAH)
    );
  }

  private getDiviDevelopmentStates(): Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalProperties>> (`${environment.apiUrl}divi/development/bundeslaender`)
    .pipe(
      map(this.mapQAH)
    );
  }

  public getDiviDevelopmentSingleHospitals(): Observable <FeatureCollection<Point, SingleHospitalOut<QuantitativeTimedStatus>>> {
    return this.cachedRepository.get <FeatureCollection<Point, QuantitativeSingleHospitalProperties>> (`${environment.apiUrl}divi/development`)
    .pipe(
      map(this.mapQSH)
    )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel):  Observable <FeatureCollection<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>>> {
    switch(aggregationLevel) {
        
      case AggregationLevel.county:
        return this.getDiviDevelopmentCounties();

      case AggregationLevel.governmentDistrict:
        return this.getDiviDevelopmentGovernmentDistricts();

      case AggregationLevel.state:
        return this.getDiviDevelopmentStates();

      default:
        throw 'No divi development endpoint for aggregation level: ' + aggregationLevel;  
    }
  }

  private mapQSH(input: FeatureCollection<Point, QuantitativeSingleHospitalProperties>): FeatureCollection<Point, SingleHospitalOut<QuantitativeTimedStatus>> {
    return {
      ...input,
      features: input.features.map(i => {
        const newProperties: SingleHospitalOut<QuantitativeTimedStatus> = {
          ...i.properties,
          developments: this.map(i.properties)
        };

        const newI: Feature<Point, SingleHospitalOut<QuantitativeTimedStatus>> = {
          ...i,
          properties: newProperties
        };
        
        return newI;
      })
    };
  }

  private mapQAH(input: FeatureCollection<MultiPolygon, QuantitativeAggregatedHospitalProperties>): FeatureCollection<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>> {
    return {
      ...input,
      features: input.features.map(i => {
        const newProperties: AggregatedHospitalOut<QuantitativeTimedStatus> = {
          ...i.properties,
          developments: this.map(i.properties),
        };

        const newI: Feature<MultiPolygon, AggregatedHospitalOut<QuantitativeTimedStatus>> = {
          ...i,
          properties: newProperties
        };
        
        return newI;
      })
    };
  }

  private map(input: QuantitativeHospitalsDevelopment): Array<QuantitativeTimedStatus> {
    const out: QuantitativeTimedStatus[] = [];
    
    for(let i = 0; i < input.covid19_aktuell.length; i++) {

      out.push({
        timestamp: input.covid19_aktuell[i].timestamp,

        covid19: {
          aktuell: input.covid19_aktuell[i].value,
          beatmet:  input.covid19_beatmet[i].value,
          kumulativ:  input.covid19_kumulativ[i].value,
          verstorben:  input.covid19_verstorben[i].value
        },

        ecmo_faelle_jahr: input.ecmo_faelle_jahr[i].value,

        icu_low_care: {
          free: input.icu_low_care_frei[i].value,
          full: input.icu_low_care_belegt[i].value,
          in24h: input.icu_low_care_in_24h[i].value,
          prognosis: input.icu_low_care_einschaetzung[i].value
        },

        icu_high_care: {
          free: input.icu_high_care_frei[i].value,
          full: input.icu_high_care_belegt[i].value,
          in24h: input.icu_high_care_in_24h[i].value,
          prognosis: input.icu_high_care_einschaetzung[i].value
        },

        ecmo_state: {
          free: input.icu_ecmo_care_frei[i].value,
          full: input.icu_ecmo_care_belegt[i].value,
          in24h: input.icu_ecmo_care_in_24h[i].value,
          prognosis: input.icu_ecmo_care_einschaetzung[i].value
        },

        quantitative: true

      });

      return out;
    }
  }
}
