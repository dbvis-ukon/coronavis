import {Injectable} from '@angular/core';
import {Feature, FeatureCollection, MultiPolygon} from 'geojson';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
import { AggregationLevel } from '../map/options/aggregation-level.enum';
import { tap } from 'rxjs/operators';
import { CachedRepository } from './cached.repository';

/* aggregated hospitals */
export interface AggregatedHospitalsGeometry extends MultiPolygon {
    coordinates: number[][][][];
    type: 'MultiPolygon';
  }

export interface AggregatedHospitalsFeature extends Feature < AggregatedHospitalsGeometry, AggregatedHospitalsProperties > {
  geometry: AggregatedHospitalsGeometry;
  properties: AggregatedHospitalsProperties;
  type: 'Feature';
}

export interface AggregatedHospitals extends FeatureCollection {
  features: Array < AggregatedHospitalsFeature > ;
  type: 'FeatureCollection';
}

export interface AggregatedHospitalsCentroid {
  coordinates: number[];
  type: string;
}

export interface AggregatedHospitalsProperties {
  name: string;
  ids: string;
  centroid: AggregatedHospitalsCentroid;
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];
  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
}

export interface SingleHospitalGeometry {
    coordinates: number[];
    type: string;
  }
  
  export interface SingleHospitalProperties {
    gemeindeschluessel: number;
    ort: string;
    bundeslandschluessel: string;
    plz: string;
    webaddresse: string;
    id: string;
    name: string;
    address: string;
    state: string;
    contact: string;
    helipad_nearby: boolean;
    'covid19_aktuell': TimestampedValue[];
    'covid19_beatmet': TimestampedValue[];
    'covid19_kumulativ': TimestampedValue[];
    'covid19_verstorben': TimestampedValue[];
    'ecmo_faelle_jahr': TimestampedValue[];
    'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
    'icu_ecmo_care_einschaetzung': TimestampedValue[];
    'icu_ecmo_care_frei': TimestampedValue[];
    'icu_ecmo_care_in_24h': TimestampedValue[];
    'icu_high_care_belegt': TimestampedValue[];
    'icu_high_care_einschaetzung': TimestampedValue[];
    'icu_high_care_frei': TimestampedValue[];
    'icu_high_care_in_24h': TimestampedValue[];
    'icu_low_care_belegt': TimestampedValue[];
    'icu_low_care_einschaetzung': TimestampedValue[];
    'icu_low_care_frei': TimestampedValue[];
    'icu_low_care_in_24h': TimestampedValue[];
  }

export interface SingleHospitalFeature {
    geometry: SingleHospitalGeometry;
    properties: SingleHospitalProperties;
    type: 'Feature';
  }
  
  export interface SingleHospitals {
    features: SingleHospitalFeature[];
    type: 'FeatureCollection';
  }

export interface TimestampedValue {
  value: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DiviDevelopmentRepository {

  constructor(private cachedRepository: CachedRepository) {}

  private getDiviDevelopmentCounties(): Observable <AggregatedHospitals> {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/landkreise`);
  }

  private getDiviDevelopmentGovernmentDistricts(): Observable < AggregatedHospitals > {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/regierungsbezirke`);
  }

  private getDiviDevelopmentStates(): Observable <AggregatedHospitals> {
    return this.cachedRepository.get <AggregatedHospitals> (`${environment.apiUrl}divi/development/bundeslaender`);
  }

  public getDiviDevelopmentSingleHospitals(): Observable <SingleHospitals> {
    return this.cachedRepository.get <SingleHospitals> (`${environment.apiUrl}divi/development`)
    .pipe(
      tap(c => console.log('repo single', c))
    )
  }

  public getDiviDevelopmentForAggLevel(aggregationLevel: AggregationLevel): Observable<AggregatedHospitals> {
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
}
