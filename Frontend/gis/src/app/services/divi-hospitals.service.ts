import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LatLngLiteral } from 'leaflet';
import { environment } from 'src/environments/environment';
import {Feature, FeatureCollection, MultiPolygon} from "geojson";


export interface SingleHospitalGeometry {
    coordinates: number[];
    type: string;
}

export interface SingleHospitalProperties {
    address: string;
    contact: string;
    ecmo_state: string;
    icu_high_state: string;
    icu_low_state: string;
    index: number;
    last_update: string;
    name: string;
}

export interface SingleHospitalFeature {
    geometry: SingleHospitalGeometry;
    properties: SingleHospitalProperties;
    type: 'Feature';
}

export interface SingleHospital {
    features: SingleHospitalFeature[];
    type: 'FeatureCollection';
}


/* aggregated hospitals */
export interface AggregatedHospitalsGeometry extends MultiPolygon {
  coordinates: number[][][][];
  type: "MultiPolygon"
}

export interface AggregatedHospitalsCentroid {
  coordinates: number[];
  type: string;
}

export interface AggregatedHospitalsState {
  Ausgelastet?: number;
  Begrenzt?: number;
  'Nicht verfügbar'?: number;
  'Verfügbar'?: number;
}

export interface AggregatedHospitalsProperties {
  centroid: AggregatedHospitalsCentroid;
  ecmo_state: AggregatedHospitalsState;
  icu_high_state: AggregatedHospitalsState;
  icu_low_state: AggregatedHospitalsState;
  sn_l: string;
  sn_k: string;
  sn_r: string;
  name: string;
}

export interface AggregatedHospitalsFeature extends Feature<AggregatedHospitalsGeometry, AggregatedHospitalsProperties>{
  geometry: AggregatedHospitalsGeometry;
  properties: AggregatedHospitalsProperties;
  type: "Feature"
}

export interface AggregatedHospitals extends FeatureCollection {
  features: Array<AggregatedHospitalsFeature>;
  type: "FeatureCollection"
}

export interface DiviHospital {
  'ID': number;
  'Name': string;
  'Adress': string;
  'Kontakt': string;
  'icuLowCare': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'icuHighCare': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'ECMO': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';  // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'Stand': string;
  'Location': LatLngLiteral;
  'x': number;
  'y': number;
  '_x': number;
  '_y': number;
  'vx': number;
  'vy': number;
}

export interface DiviAggregatedHospital {
  ecmo_state: AggregatedHospitalsState;
  icu_high_state: AggregatedHospitalsState;
  icu_low_state: AggregatedHospitalsState;
  'Location': LatLngLiteral;
  'ID': number;
  'Name': string;
}

@Injectable({
  providedIn: 'root'
})
export class DiviHospitalsService {

  constructor(private http: HttpClient) { }

  public getDiviHospitalsCounties(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}hospitals/landkreise`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitalsGovernmentDistrict(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}hospitals/regierungsbezirke`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitalsStates(): Observable<DiviAggregatedHospital[]> {
    return this.http.get<AggregatedHospitals>(`${environment.apiUrl}hospitals/bundeslander`)
      .pipe(
        map(this.myAggregatedMapper)
      );
  }

  public getDiviHospitals(): Observable<DiviHospital[]> {
    return this.http.get<SingleHospital>(`${environment.apiUrl}hospitals`)
      .pipe(map(
          d => d.features.map(i => {
            return {
              ID: i.properties.index,
              Name: i.properties.name,
              Adress: i.properties.address,
              Kontakt: i.properties.contact,
              icuLowCare: i.properties.icu_low_state,
              icuHighCare: i.properties.icu_high_state,
              ECMO: i.properties.ecmo_state,
              Stand: i.properties.last_update,
              Location: {
                lat: i.geometry.coordinates[1],
                lng: i.geometry.coordinates[0]
              }
            } as DiviHospital;
          })
      ));
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
        ecmo_state: i.properties.ecmo_state,
        icu_low_state: i.properties.icu_low_state,
        icu_high_state: i.properties.icu_high_state
      } as DiviAggregatedHospital;
    });
  }
}
