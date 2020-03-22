import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LatLngLiteral } from 'leaflet';

interface DiviHospitalInput {
  'ID': number;
  'Name': string;
  'Adress': string;
  'String': string;
  'Kontakt': string;
  'Bundesland': string;
  'ICU low care': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'ICU high care': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'ECMO': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'Stand': string;
  'Location': string;
}

export interface DiviHospital {
  'ID': number;
  'Name': string;
  'Adress': string;
  'String': string;
  'Kontakt': string;
  'Bundesland': string;
  'icuLowCare': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'icuHighCare': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';
  'ECMO': 'Verfügbar' | 'Begrenzt' | 'Ausgelastet' | 'Nicht verfügbar';  // Extrakorporale Membranoxygenierung --> https://bit.ly/3dnlpyb
  'Stand': string;
  'Location': LatLngLiteral;
}


@Injectable({
  providedIn: 'root'
})
export class DiviHospitalsService {

  constructor(private http: HttpClient) { }

  public getDiviHospitals(): Observable<DiviHospital[]> {
    return this.http.get<DiviHospitalInput[]>('/assets/rki_hospitals.json')
      .pipe(map(
        l => l.filter(i => i.Location !== '(None, None)').map(i => {
          const loc = i.Location;
          return  {...i,
            icuLowCare: i['ICU low care'],
            icuHighCare: i['ICU high care'],
            Location: {
              lat: parseFloat(loc.split(',')[0].replace('(', '').trim()),
              lng: parseFloat(loc.split(',')[1].replace(')', '').trim())
            }
          };
        }) as DiviHospital[]
      ));
  }
}
