import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {LatLngLiteral} from 'leaflet';
import {environment} from 'src/environments/environment';
import {Feature, FeatureCollection, MultiPolygon} from 'geojson';
import {BedType} from "../map/options/bed-type.enum";


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

export function getLatest(entries: TimestampedValue[]) : number {
  // console.log(entries);
  if (entries === undefined) {
    return NaN;
  }
  if (entries.length === 0) {
    return NaN;
  }
  let currentEntry = entries[0];
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].timestamp > currentEntry.timestamp) {
      currentEntry = entries[i];
    }
  }
  return currentEntry.value;
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

export interface BedStatusSummary {
  free: TimestampedValue[]
  full: TimestampedValue[]
  prognosis: TimestampedValue[]
  in24h: TimestampedValue[]
}

export interface DiviHospital {
  ID: number;
  Name: string;
  City: string;
  Postcode: string;
  Address: string;
  'Webaddress': string;
  'Location': LatLngLiteral;
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];

  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
  icu_low_summary: BedStatusSummary;

  helipad_nearby: boolean;
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
  'covid19_aktuell': TimestampedValue[];
  'covid19_beatmet': TimestampedValue[];
  'covid19_kumulativ': TimestampedValue[];
  'covid19_verstorben': TimestampedValue[];
  'ecmo_faelle_jahr': TimestampedValue[];

  'icu_ecmo_care_belegt': TimestampedValue[]; // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'icu_ecmo_care_einschaetzung': TimestampedValue[];
  'icu_ecmo_care_frei': TimestampedValue[];
  'icu_ecmo_care_in_24h': TimestampedValue[];
  icu_ecmo_summary: BedStatusSummary;

  'icu_high_care_belegt': TimestampedValue[];
  'icu_high_care_einschaetzung': TimestampedValue[];
  'icu_high_care_frei': TimestampedValue[];
  'icu_high_care_in_24h': TimestampedValue[];
  icu_high_summary: BedStatusSummary;

  'icu_low_care_belegt': TimestampedValue[];
  'icu_low_care_einschaetzung': TimestampedValue[];
  'icu_low_care_frei': TimestampedValue[];
  'icu_low_care_in_24h': TimestampedValue[];
  icu_low_summary: BedStatusSummary;

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

  constructor(private http: HttpClient) {
  }

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
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}divi/development/bundeslaender`)
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
        ID: +i.properties.id,
        Name: i.properties.name,
        Address: i.properties.address,
        Kontakt: i.properties.contact,
        City: i.properties.ort,
        Postcode: i.properties.plz,
        Webaddress: i.properties.webaddresse,
        Location: {
          lat: i.geometry.coordinates[1],
          lng: i.geometry.coordinates[0]
        },
        LastUpdate: new Date(),
        covid19_aktuell: i.properties.covid19_aktuell,
        covid19_beatmet: i.properties.covid19_beatmet,
        covid19_kumulativ: i.properties.covid19_kumulativ,
        covid19_verstorben: i.properties.covid19_verstorben,
        ecmo_faelle_jahr: i.properties.ecmo_faelle_jahr,

        icu_ecmo_care_belegt: i.properties.icu_ecmo_care_belegt,
        icu_ecmo_care_einschaetzung: i.properties.icu_ecmo_care_einschaetzung,
        icu_ecmo_care_frei: i.properties.icu_ecmo_care_frei,
        icu_ecmo_care_in_24h: i.properties.icu_ecmo_care_in_24h,
        icu_ecmo_summary: {free: i.properties.icu_ecmo_care_frei, full: i.properties.icu_ecmo_care_belegt, prognosis: i.properties.icu_ecmo_care_einschaetzung, in24h: i.properties.icu_ecmo_care_in_24h} as BedStatusSummary,

        icu_high_care_belegt: i.properties.icu_high_care_belegt,
        icu_high_care_einschaetzung: i.properties.icu_high_care_einschaetzung,
        icu_high_care_frei: i.properties.icu_high_care_frei,
        icu_high_care_in_24h: i.properties.icu_high_care_in_24h,
        icu_high_summary: {free: i.properties.icu_high_care_frei, full: i.properties.icu_high_care_belegt, prognosis: i.properties.icu_high_care_einschaetzung, in24h: i.properties.icu_high_care_in_24h} as BedStatusSummary,

        icu_low_care_belegt: i.properties.icu_low_care_belegt,
        icu_low_care_einschaetzung: i.properties.icu_low_care_einschaetzung,
        icu_low_care_frei: i.properties.icu_low_care_frei,
        icu_low_care_in_24h: i.properties.icu_low_care_in_24h,
        icu_low_summary: {free: i.properties.icu_low_care_frei, full: i.properties.icu_low_care_belegt, prognosis: i.properties.icu_low_care_einschaetzung, in24h: i.properties.icu_low_care_in_24h } as BedStatusSummary,

        helipad_nearby: i.properties.helipad_nearby
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
