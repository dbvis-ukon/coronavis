import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';
import { environment } from 'src/environments/environment';
import { AggregatedHospitalsState } from './divi-hospitals.service';

@Injectable({
  providedIn: 'root'
})
export class ColormapService {
  constructor() {}

  getSingleHospitalColormap(): d3.ScaleOrdinal<string, string> {
      return d3.scaleOrdinal<string, string>().domain(['Verfügbar', 'Begrenzt', 'Ausgelastet', 'Nicht verfügbar'])
      .range(['rgb(113,167,133)', 'rgb(230,181,72)', 'rgb(198,106,75)', '#bbbbbb']);
  }

  getMaxColor(state: AggregatedHospitalsState): string {
    let maxNumber = 0;
    let maxFeature = 'Nicht verfügbar';

    for (const key in state) {
        if (state.hasOwnProperty(key)) {
            const element = state[key];
            if (element > maxNumber) {
              maxNumber = element;
              maxFeature = key;
            }
        }
    }
    const c = this.getSingleHospitalColormap();
    return c(maxFeature);
  }


}
