import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LatLngLiteral } from 'leaflet';
import { environment } from 'src/environments/environment';
import {Feature, FeatureCollection, MultiPolygon} from 'geojson';


export interface SingleHospitalGeometry {
    coordinates: number[];
    type: string;
}

export interface TimestampedValueJson {
  value: number;
  timestamp: Date;
}

export interface SingleHospitalProperties {
    index: number;
    last_update: string;
    name: string;
    address: string;
    contact: string;
    LastUpdate: string;
    city: string;
    plz: string;
    webaddress: string;
    'covid19_aktuell': TimestampedValueJson[];
    'covid19_beatmet': TimestampedValueJson[];
    'covid19_kumulativ': TimestampedValueJson[];
    'covid19_verstorben': TimestampedValueJson[];
    'ecmo_faelle_jahr': TimestampedValueJson[];
    'icu_ecmo_care_belegt': TimestampedValueJson[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
    'icu_ecmo_care_einschaetzung': TimestampedValueJson[];
    'icu_ecmo_care_frei': TimestampedValueJson[];
    'icu_ecmo_care_in_24h': TimestampedValueJson[];
    'icu_high_care_belegt': TimestampedValueJson[];
    'icu_high_care_einschaetzung': TimestampedValueJson[];
    'icu_high_care_frei': TimestampedValueJson[];
    'icu_high_care_in_24h': TimestampedValueJson[];
    'icu_low_care_belegt': TimestampedValueJson[];
    'icu_low_care_einschaetzung': TimestampedValueJson[];
    'icu_low_care_frei': TimestampedValueJson[];
    'icu_low_care_in_24h': TimestampedValueJson[];
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


/* aggregated hospitals */
export interface AggregatedHospitalsGeometry extends MultiPolygon {
  coordinates: number[][][][];
  type: 'MultiPolygon';
}

export interface AggregatedHospitalsCentroid {
  coordinates: number[];
  type: string;
}

export interface AggregatedHospitalsProperties {
  name: string;
  ids: string;
  centroid: AggregatedHospitalsCentroid;
  'last_update': string;
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

export interface AggregatedHospitalsFeature extends Feature<AggregatedHospitalsGeometry, AggregatedHospitalsProperties> {
  geometry: AggregatedHospitalsGeometry;
  properties: AggregatedHospitalsProperties;
  type: 'Feature';
}

export interface AggregatedHospitals extends FeatureCollection {
  features: Array<AggregatedHospitalsFeature>;
  type: 'FeatureCollection';
}

export interface TimestampedValue {
  value: number;
  timestamp: Date;
}

export interface DiviHospital {
  'ID': number;
  'Name': string;
  'City': string;
  'Postcode': string;
  'Webaddress': string;
  'Location': LatLngLiteral;
  'LastUpdate': Date;
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
  'x'?: number;
  'y'?: number;
  '_x'?: number;
  '_y'?: number;
  'vx'?: number;
  'vy'?: number;
}

export interface DiviAggregatedHospital {
  'ID': number;
  'Name': string;
  'Location': LatLngLiteral;
  'LastUpdate': Date;
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
  'x': number;
  'y': number;
  '_x': number;
  '_y': number;
  'vx': number;
  'vy': number;
}

@Injectable({
  providedIn: 'root'
})
export class DiviHospitalsService {

  constructor(private http: HttpClient) { }

  public getDiviHospitalsCounties(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}divi/development/landkreise`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitalsGovernmentDistrict(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}divi/development/regierungsbezirke`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitalsStates(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}divi/development/bundeslander`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitals(): Observable<DiviHospital[]> {
    return this.http.get<SingleHospitals>(`${environment.apiUrl}divi/development`)
      .pipe(
        map(this.mySingleAggregatedMapper)
      );
  }

  mySingleAggregatedMapper(input: SingleHospitals): DiviHospital[] {
    return input.features.map((i, index) => {
      return {
        ID: i.properties.index,
        Name: i.properties.name,
        Adress: i.properties.address,
        Kontakt: i.properties.contact,
        City: i.properties.city,
        Postcode: i.properties.plz,
        Webaddress: i.properties.webaddress,
        Location: {
          lat: i.geometry.coordinates[1],
          lng: i.geometry.coordinates[0]
        },
        LastUpdate: new Date(i.properties.last_update),
        covid19_aktuell: i.properties.covid19_aktuell,
        covid19_beatmet: i.properties.covid19_beatmet,
        covid19_kumulativ: i.properties.covid19_kumulativ,
        covid19_verstorben: i.properties.covid19_verstorben,
        ecmo_faelle_jahr: i.properties.ecmo_faelle_jahr,
        icu_ecmo_care_belegt: i.properties.icu_ecmo_care_belegt,
        icu_ecmo_care_einschaetzung: i.properties.icu_ecmo_care_einschaetzung,
        icu_ecmo_care_frei: i.properties.icu_ecmo_care_frei,
        icu_ecmo_care_in_24h: i.properties.icu_ecmo_care_in_24h,
        icu_high_care_belegt: i.properties.icu_high_care_belegt,
        icu_high_care_einschaetzung: i.properties.icu_high_care_einschaetzung,
        icu_high_care_frei: i.properties.icu_high_care_frei,
        icu_high_care_in_24h: i.properties.icu_high_care_in_24h,
        icu_low_care_belegt: i.properties.icu_low_care_belegt,
        icu_low_care_einschaetzung: i.properties.icu_low_care_einschaetzung,
        icu_low_care_frei: i.properties.icu_low_care_frei,
        icu_low_care_in_24h: i.properties.icu_low_care_in_24h,
      } as DiviHospital;
    });
  }

  myAggregatedMapper(input: AggregatedHospitals): DiviAggregatedHospital[] {
    return input.features.map((i, index) => {
      return {
        ID: index,
        Name: i.properties.name,
        Location: {
          lat: i.properties.centroid.coordinates[1],
          lng: i.properties.centroid.coordinates[0]
        },
        LastUpdate: new Date(i.properties.last_update),
        covid19_aktuell: i.properties.covid19_aktuell,
        covid19_beatmet: i.properties.covid19_beatmet,
        covid19_kumulativ: i.properties.covid19_kumulativ,
        covid19_verstorben: i.properties.covid19_verstorben,
        ecmo_faelle_jahr: i.properties.ecmo_faelle_jahr,
        icu_ecmo_care_belegt: i.properties.icu_ecmo_care_belegt,
        icu_ecmo_care_einschaetzung: i.properties.icu_ecmo_care_einschaetzung,
        icu_ecmo_care_frei: i.properties.icu_ecmo_care_frei,
        icu_ecmo_care_in_24h: i.properties.icu_ecmo_care_in_24h,
        icu_high_care_belegt: i.properties.icu_high_care_belegt,
        icu_high_care_einschaetzung: i.properties.icu_high_care_einschaetzung,
        icu_high_care_frei: i.properties.icu_high_care_frei,
        icu_high_care_in_24h: i.properties.icu_high_care_in_24h,
        icu_low_care_belegt: i.properties.icu_low_care_belegt,
        icu_low_care_einschaetzung: i.properties.icu_low_care_einschaetzung,
        icu_low_care_frei: i.properties.icu_low_care_frei,
        icu_low_care_in_24h: i.properties.icu_low_care_in_24h,
      } as DiviAggregatedHospital;
    });
  }
}
